import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Required for populate to work
import Review from '@/models/Review';
import MetaFieldTemplate from '@/models/MetaFieldTemplate'; // Required for template lookup
import { loadTemplatesForProduct, resolveProductMeta } from '@/lib/meta';

/**
 * Server-side product detail loader.
 *
 * The page renders blocks on the server, so the product has to be available
 * before hydration — fetching it client-side would leave every block empty in
 * the initial HTML (bad for SEO and for first paint).
 *
 * Mirrors /api/products/[id] so the block-built page and the legacy page show
 * exactly the same data.
 */
export async function getProductDetail(id) {
    try {
        await connectDB();

        const product = await Product.findOne({ _id: id, isActive: true })
            .populate('category', 'name')
            .lean();

        if (!product) return null;

        const [reviews, relatedProducts, templates] = await Promise.all([
            Review.find({ product: id, isActive: true })
                .sort({ createdAt: -1 })
                .populate('user', 'name')
                .lean(),
            Product.find({
                category: product.category?._id,
                _id: { $ne: id },
                isActive: true,
            })
                .limit(4)
                .select('name images variants category minPrice maxPrice hasSale')
                .populate('category', 'name')
                .lean(),
            loadTemplatesForProduct(product),
        ]);

        const { fields, groups } = resolveProductMeta(product, templates);
        const visibleFields = fields.filter(
            f => f.hasValue && f.display?.show !== false && f.display?.where !== 'hidden'
        );

        return {
            product: JSON.parse(JSON.stringify(product)),
            reviews: JSON.parse(JSON.stringify(reviews)),
            relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
            meta: {
                // Everything resolved, so a block can bind to any field the
                // admin chooses rather than only the "visible" ones.
                all: JSON.parse(JSON.stringify(fields)),
                fields: JSON.parse(JSON.stringify(visibleFields)),
                groups: JSON.parse(JSON.stringify(
                    groups
                        .map(g => ({ ...g, fields: g.fields.filter(f => visibleFields.includes(f)) }))
                        .filter(g => g.fields.length > 0)
                )),
            },
        };
    } catch (error) {
        console.error('getProductDetail failed:', error);
        return null;
    }
}
