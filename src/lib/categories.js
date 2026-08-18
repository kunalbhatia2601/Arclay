import Category from '@/models/Category';
import Product from '@/models/Product';
import { escapeRegex } from '@/lib/utils';

export function isTopLevel(category) {
    return !category?.parent;
}

export async function assertUniqueSiblingName(name, parentId, excludeId) {
    const query = {
        name: { $regex: new RegExp(`^${escapeRegex(String(name).trim())}$`, 'i') },
        parent: parentId || null,
    };
    if (excludeId) query._id = { $ne: excludeId };

    const clash = await Category.findOne(query).lean();
    if (clash) {
        const err = new Error(
            parentId
                ? 'A subcategory with this name already exists under that category'
                : 'A category with this name already exists'
        );
        err.status = 400;
        throw err;
    }
}

export async function resolveParent(parentId) {
    if (!parentId) return null;

    const parent = await Category.findById(parentId);
    if (!parent) {
        const err = new Error('Parent category not found');
        err.status = 400;
        throw err;
    }
    if (parent.parent) {
        const err = new Error('Subcategories cannot have children — pick a top-level category');
        err.status = 400;
        throw err;
    }
    return parent;
}

/**
 * Product.category must be a top-level category. subcategory, if set, must be
 * a child of that category.
 */
export async function resolveProductTaxonomy(categoryId, subcategoryId) {
    if (!categoryId) {
        const err = new Error('Category is required');
        err.status = 400;
        throw err;
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        const err = new Error('Category not found');
        err.status = 400;
        throw err;
    }
    if (category.parent) {
        const err = new Error('Pick a top-level category; use subcategory for the nested group');
        err.status = 400;
        throw err;
    }

    if (!subcategoryId) {
        return { categoryId: category._id, subcategoryId: null };
    }

    const subcategory = await Category.findById(subcategoryId);
    if (!subcategory || String(subcategory.parent) !== String(category._id)) {
        const err = new Error('Subcategory must belong to the selected category');
        err.status = 400;
        throw err;
    }

    return { categoryId: category._id, subcategoryId: subcategory._id };
}

export async function assertCategoryDeletable(id) {
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0) {
        const err = new Error('Delete or reassign subcategories first');
        err.status = 400;
        throw err;
    }

    const productCount = await Product.countDocuments({
        $or: [{ category: id }, { subcategory: id }],
    });
    if (productCount > 0) {
        const err = new Error('This category is used by products and cannot be deleted');
        err.status = 400;
        throw err;
    }
}

export function nestCategories(categories) {
    const list = Array.isArray(categories) ? categories : [];
    const childrenByParent = new Map();

    for (const cat of list) {
        const parentId = cat.parent ? String(cat.parent._id || cat.parent) : '';
        if (!parentId) continue;
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(cat);
    }

    return list
        .filter((cat) => !cat.parent)
        .map((cat) => ({
            ...cat,
            children: childrenByParent.get(String(cat._id)) || [],
        }));
}
