import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import Review from "@/models/Review";
import MetaFieldTemplate from "@/models/MetaFieldTemplate"; // Required for template lookup
import { loadTemplatesForProduct, resolveProductMeta } from "@/lib/meta";
import { stripAdminProductFields, stripAdminProducts } from "@/lib/productPublic";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const product = await Product.findOne({ _id: id, isActive: true })
            .populate("category", "name")
            .populate("subcategory", "name")
            .lean();

        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // Get active reviews for this product
        const reviews = await Review.find({
            product: id,
            isActive: true
        })
            .sort({ createdAt: -1 })
            .populate('user', 'name')
            .lean();

        // Get related products (same category, excluding current product)
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: id },
            isActive: true
        })
            .limit(4)
            .select('name images variants category subcategory')
            .populate('category', 'name')
            .lean();

        // Custom metadata, resolved against its templates and filtered to the
        // fields marked visible. The detail page renders from this rather than
        // reading raw values, so display rules live in one place.
        const templates = await loadTemplatesForProduct(product);
        const { fields, groups } = resolveProductMeta(product, templates);
        const visibleFields = fields.filter(
            f => f.hasValue && f.display?.show !== false && f.display?.where !== 'hidden'
        );

        return Response.json({
            success: true,
            product: stripAdminProductFields(product),
            meta: {
                fields: visibleFields,
                groups: groups
                    .map(g => ({
                        ...g,
                        fields: g.fields.filter(f => visibleFields.includes(f)),
                    }))
                    .filter(g => g.fields.length > 0),
            },
            reviews,
            relatedProducts: stripAdminProducts(relatedProducts)
        });
    } catch (error) {
        console.error("Get product error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
