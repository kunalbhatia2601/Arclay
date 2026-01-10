import { withAdminProtection } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

// POST - Bulk create products
async function postHandler(req) {
    try {
        const { products } = await req.json();

        if (!products || !Array.isArray(products) || products.length === 0) {
            return Response.json(
                { success: false, message: 'No products provided' },
                { status: 400 }
            );
        }

        await connectDB();

        // Cache for category lookups/creations
        const categoryCache = {};

        const results = {
            created: 0,
            categoriesCreated: 0,
            errors: []
        };

        // Function to get or create category by name
        const getOrCreateCategory = async (categoryName) => {
            const name = String(categoryName).trim();
            if (!name) return null;

            // Check cache first
            if (categoryCache[name.toLowerCase()]) {
                return categoryCache[name.toLowerCase()];
            }

            // Look for existing category (case-insensitive)
            let category = await Category.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') }
            });

            if (!category) {
                // Create new category
                category = await Category.create({ name });
                results.categoriesCreated++;
            }

            // Cache it
            categoryCache[name.toLowerCase()] = category._id;
            return category._id;
        };

        // Process each product
        for (let i = 0; i < products.length; i++) {
            const productData = products[i];
            
            try {
                // Validate required fields
                if (!productData.name || !productData.regularPrice) {
                    results.errors.push({
                        row: i + 2, // +2 for 1-indexed and header row
                        error: 'Missing name or regularPrice'
                    });
                    continue;
                }

                // Use NEXT_PUBLIC_SITE_NAME as default category if not provided
                const categoryName = productData.category || process.env.NEXT_PUBLIC_SITE_NAME || 'General';

                // Get or create category
                const categoryId = await getOrCreateCategory(categoryName);
                if (!categoryId) {
                    results.errors.push({
                        row: i + 2,
                        error: 'Invalid category name'
                    });
                    continue;
                }

                // Build images array from image1, image2, image3
                const images = [];
                if (productData.image1) images.push(productData.image1);
                if (productData.image2) images.push(productData.image2);
                if (productData.image3) images.push(productData.image3);

                // Parse numeric values
                const regularPrice = parseFloat(productData.regularPrice) || 0;
                const salePrice = productData.salePrice ? parseFloat(productData.salePrice) : null;
                const stock = parseInt(productData.stock) || 0;

                // Parse boolean values
                const isActive = productData.isActive === undefined ? true : 
                    String(productData.isActive).toLowerCase() == 'true' || productData.isActive == '1' || productData.isActive == 1;
                const isFeatured = productData.isFeatured === undefined ? false :
                    String(productData.isFeatured).toLowerCase() == 'true' || productData.isFeatured == '1' || productData.isFeatured == 1;

                // Create product with single variant
                await Product.create({
                    name: String(productData.name).trim(),
                    description: productData.description ? String(productData.description).trim() : '',
                    long_description: productData.long_description ? String(productData.long_description).trim() : '',
                    images,
                    category: categoryId,
                    isActive,
                    isFeatured,
                    variationTypes: [], // No variations for bulk upload
                    variants: [{
                        attributes: new Map([['Default', 'Default']]),
                        regularPrice,
                        salePrice,
                        stock,
                        sku: productData.sku ? String(productData.sku).trim() : ''
                    }]
                });

                results.created++;
            } catch (error) {
                console.error(`Error creating product at row ${i + 2}:`, error);
                results.errors.push({
                    row: i + 2,
                    error: error.message || 'Failed to create product'
                });
            }
        }

        return Response.json({
            success: true,
            message: `Created ${results.created} products${results.categoriesCreated > 0 ? ` and ${results.categoriesCreated} new categories` : ''}${results.errors.length > 0 ? `, ${results.errors.length} failed` : ''}`,
            created: results.created,
            categoriesCreated: results.categoriesCreated,
            errors: results.errors
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        return Response.json(
            { success: false, message: error.message || 'Failed to bulk upload products' },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
