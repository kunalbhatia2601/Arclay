/**
 * Product Seeder Script
 * 
 * This script seeds the database with fake product data.
 * Uses Picsum Photos API for random images.
 * 
 * Usage: node scripts/seedProducts.js
 * 
 * Make sure to set MONGODB_URI in your .env.local file
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================
// CONFIGURATION - Modify these values as needed
// ============================================
const CONFIG = {
    // Number of products to create
    productsCount: 50,

    // Number of categories to create (products will be distributed among these)
    categoriesCount: 8,

    // Min and max images per product
    minImagesPerProduct: 2,
    maxImagesPerProduct: 5,

    // Image dimensions for Picsum
    imageWidth: 800,
    imageHeight: 800,

    // Price range
    minPrice: 99,
    maxPrice: 9999,

    // Stock range per variant
    minStock: 0,
    maxStock: 100,

    // Sale price probability (0 to 1)
    salePriceProbability: 0.3,

    // Sale discount range (percentage)
    minSaleDiscount: 10,
    maxSaleDiscount: 50,

    // Clear existing data before seeding
    clearExisting: true
};

// ============================================
// SAMPLE DATA
// ============================================
const CATEGORIES = [
    { name: 'Electronics', description: 'Latest gadgets and electronic devices' },
    { name: 'Clothing', description: 'Fashion and apparel for all occasions' },
    { name: 'Home & Kitchen', description: 'Everything for your home and kitchen needs' },
    { name: 'Sports & Outdoors', description: 'Gear for sports and outdoor activities' },
    { name: 'Books', description: 'Wide selection of books and literature' },
    { name: 'Beauty & Personal Care', description: 'Beauty products and personal care items' },
    { name: 'Toys & Games', description: 'Fun toys and games for all ages' },
    { name: 'Jewelry & Accessories', description: 'Elegant jewelry and fashion accessories' },
    { name: 'Automotive', description: 'Car accessories and automotive parts' },
    { name: 'Health & Wellness', description: 'Health supplements and wellness products' }
];

const PRODUCT_TEMPLATES = {
    Electronics: [
        { name: 'Wireless Bluetooth Headphones', variations: [{ name: 'Color', options: ['Black', 'White', 'Blue', 'Red'] }] },
        { name: 'Smart Watch Pro', variations: [{ name: 'Color', options: ['Black', 'Silver', 'Gold'] }, { name: 'Size', options: ['40mm', '44mm'] }] },
        { name: 'Portable Power Bank 20000mAh', variations: [{ name: 'Color', options: ['Black', 'White'] }] },
        { name: 'Wireless Charging Pad', variations: [{ name: 'Color', options: ['Black', 'White'] }] },
        { name: 'Bluetooth Speaker', variations: [{ name: 'Color', options: ['Black', 'Blue', 'Red', 'Green'] }] },
        { name: 'USB-C Hub Adapter', variations: [{ name: 'Ports', options: ['4-in-1', '7-in-1', '10-in-1'] }] },
        { name: 'Mechanical Gaming Keyboard', variations: [{ name: 'Switch Type', options: ['Red', 'Blue', 'Brown'] }] },
        { name: 'Wireless Gaming Mouse', variations: [{ name: 'Color', options: ['Black', 'White', 'RGB'] }] },
        { name: 'Webcam HD 1080p', variations: [{ name: 'Resolution', options: ['720p', '1080p', '4K'] }] },
        { name: 'Noise Cancelling Earbuds', variations: [{ name: 'Color', options: ['Black', 'White', 'Navy'] }] }
    ],
    Clothing: [
        { name: 'Premium Cotton T-Shirt', variations: [{ name: 'Color', options: ['Black', 'White', 'Navy', 'Gray'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] }] },
        { name: 'Slim Fit Jeans', variations: [{ name: 'Color', options: ['Blue', 'Black', 'Gray'] }, { name: 'Size', options: ['28', '30', '32', '34', '36'] }] },
        { name: 'Hoodie Sweatshirt', variations: [{ name: 'Color', options: ['Black', 'Gray', 'Navy', 'Maroon'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
        { name: 'Casual Button-Down Shirt', variations: [{ name: 'Color', options: ['White', 'Blue', 'Pink'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
        { name: 'Athletic Shorts', variations: [{ name: 'Color', options: ['Black', 'Navy', 'Gray'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
        { name: 'Winter Jacket', variations: [{ name: 'Color', options: ['Black', 'Navy', 'Olive'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
        { name: 'Formal Blazer', variations: [{ name: 'Color', options: ['Black', 'Navy', 'Charcoal'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] },
        { name: 'Polo Shirt', variations: [{ name: 'Color', options: ['White', 'Black', 'Navy', 'Red'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] }
    ],
    'Home & Kitchen': [
        { name: 'Non-Stick Cookware Set', variations: [{ name: 'Pieces', options: ['5-Piece', '10-Piece', '15-Piece'] }] },
        { name: 'Electric Kettle', variations: [{ name: 'Capacity', options: ['1L', '1.5L', '2L'] }] },
        { name: 'Blender Pro', variations: [{ name: 'Color', options: ['Black', 'Silver', 'Red'] }] },
        { name: 'Air Fryer', variations: [{ name: 'Capacity', options: ['3.5L', '5L', '7L'] }] },
        { name: 'Coffee Maker', variations: [{ name: 'Type', options: ['Drip', 'Espresso', 'French Press'] }] },
        { name: 'Microwave Oven', variations: [{ name: 'Capacity', options: ['20L', '25L', '30L'] }] },
        { name: 'Food Processor', variations: [{ name: 'Power', options: ['500W', '750W', '1000W'] }] },
        { name: 'Vacuum Cleaner', variations: [{ name: 'Type', options: ['Corded', 'Cordless', 'Robot'] }] }
    ],
    'Sports & Outdoors': [
        { name: 'Yoga Mat Premium', variations: [{ name: 'Color', options: ['Purple', 'Blue', 'Black', 'Pink'] }, { name: 'Thickness', options: ['4mm', '6mm', '8mm'] }] },
        { name: 'Dumbbell Set', variations: [{ name: 'Weight', options: ['5kg', '10kg', '15kg', '20kg'] }] },
        { name: 'Running Shoes', variations: [{ name: 'Color', options: ['Black', 'White', 'Blue'] }, { name: 'Size', options: ['7', '8', '9', '10', '11'] }] },
        { name: 'Resistance Bands Set', variations: [{ name: 'Resistance', options: ['Light', 'Medium', 'Heavy'] }] },
        { name: 'Camping Tent', variations: [{ name: 'Capacity', options: ['2-Person', '4-Person', '6-Person'] }] },
        { name: 'Hiking Backpack', variations: [{ name: 'Capacity', options: ['30L', '45L', '60L'] }] },
        { name: 'Fitness Tracker', variations: [{ name: 'Color', options: ['Black', 'Blue', 'Pink'] }] },
        { name: 'Jump Rope', variations: [{ name: 'Type', options: ['Basic', 'Weighted', 'Speed'] }] }
    ],
    Books: [
        { name: 'Programming Mastery Guide', variations: [{ name: 'Format', options: ['Paperback', 'Hardcover', 'E-book'] }] },
        { name: 'Business Strategy Handbook', variations: [{ name: 'Format', options: ['Paperback', 'Hardcover'] }] },
        { name: 'Self-Help Collection', variations: [{ name: 'Format', options: ['Paperback', 'Hardcover', 'Audiobook'] }] },
        { name: 'Fiction Bestseller Novel', variations: [{ name: 'Format', options: ['Paperback', 'Hardcover', 'E-book'] }] },
        { name: 'Cookbook Deluxe Edition', variations: [{ name: 'Format', options: ['Paperback', 'Hardcover'] }] },
        { name: 'Science Encyclopedia', variations: [{ name: 'Format', options: ['Hardcover'] }] }
    ],
    'Beauty & Personal Care': [
        { name: 'Skincare Set', variations: [{ name: 'Skin Type', options: ['Normal', 'Oily', 'Dry', 'Combination'] }] },
        { name: 'Hair Dryer Pro', variations: [{ name: 'Color', options: ['Black', 'Rose Gold', 'White'] }] },
        { name: 'Electric Razor', variations: [{ name: 'Type', options: ['Rotary', 'Foil'] }] },
        { name: 'Perfume Collection', variations: [{ name: 'Size', options: ['30ml', '50ml', '100ml'] }] },
        { name: 'Makeup Brush Set', variations: [{ name: 'Pieces', options: ['12-Piece', '18-Piece', '24-Piece'] }] },
        { name: 'Face Mask Pack', variations: [{ name: 'Type', options: ['Hydrating', 'Brightening', 'Anti-Aging'] }] }
    ],
    'Toys & Games': [
        { name: 'Building Blocks Set', variations: [{ name: 'Pieces', options: ['100', '250', '500', '1000'] }] },
        { name: 'Board Game Classic', variations: [{ name: 'Type', options: ['Strategy', 'Family', 'Party'] }] },
        { name: 'Remote Control Car', variations: [{ name: 'Scale', options: ['1:24', '1:18', '1:12'] }] },
        { name: 'Puzzle Collection', variations: [{ name: 'Pieces', options: ['500', '1000', '2000'] }] },
        { name: 'Action Figure Set', variations: [{ name: 'Theme', options: ['Superheroes', 'Sci-Fi', 'Fantasy'] }] },
        { name: 'Educational Toy Kit', variations: [{ name: 'Age', options: ['3-5', '6-8', '9-12'] }] }
    ],
    'Jewelry & Accessories': [
        { name: 'Silver Necklace', variations: [{ name: 'Length', options: ['16 inch', '18 inch', '20 inch'] }] },
        { name: 'Leather Watch', variations: [{ name: 'Color', options: ['Brown', 'Black', 'Tan'] }] },
        { name: 'Sunglasses Premium', variations: [{ name: 'Style', options: ['Aviator', 'Wayfarer', 'Round'] }] },
        { name: 'Gold Bracelet', variations: [{ name: 'Size', options: ['Small', 'Medium', 'Large'] }] },
        { name: 'Pearl Earrings', variations: [{ name: 'Type', options: ['Stud', 'Drop', 'Hoop'] }] },
        { name: 'Leather Belt', variations: [{ name: 'Color', options: ['Black', 'Brown'] }, { name: 'Size', options: ['S', 'M', 'L', 'XL'] }] }
    ],
    Automotive: [
        { name: 'Car Phone Mount', variations: [{ name: 'Type', options: ['Dashboard', 'Vent', 'Windshield'] }] },
        { name: 'Car Vacuum Cleaner', variations: [{ name: 'Type', options: ['Corded', 'Cordless'] }] },
        { name: 'LED Headlight Bulbs', variations: [{ name: 'Size', options: ['H4', 'H7', 'H11', '9005'] }] },
        { name: 'Dash Cam', variations: [{ name: 'Resolution', options: ['1080p', '2K', '4K'] }] },
        { name: 'Car Seat Cover Set', variations: [{ name: 'Material', options: ['Leather', 'Fabric', 'Mesh'] }] },
        { name: 'Tire Inflator', variations: [{ name: 'Type', options: ['Digital', 'Analog'] }] }
    ],
    'Health & Wellness': [
        { name: 'Vitamin Supplements', variations: [{ name: 'Type', options: ['Multivitamin', 'Vitamin D', 'Vitamin C', 'B-Complex'] }] },
        { name: 'Protein Powder', variations: [{ name: 'Flavor', options: ['Chocolate', 'Vanilla', 'Strawberry'] }, { name: 'Size', options: ['1kg', '2kg', '5kg'] }] },
        { name: 'Essential Oils Set', variations: [{ name: 'Pieces', options: ['6-Pack', '12-Pack', '20-Pack'] }] },
        { name: 'Massage Gun', variations: [{ name: 'Power', options: ['Standard', 'Pro', 'Elite'] }] },
        { name: 'Blood Pressure Monitor', variations: [{ name: 'Type', options: ['Arm', 'Wrist'] }] },
        { name: 'First Aid Kit', variations: [{ name: 'Size', options: ['Basic', 'Standard', 'Comprehensive'] }] }
    ]
};

const DESCRIPTIONS = [
    "Experience premium quality with this exceptional product designed for everyday use. Crafted with attention to detail and built to last.",
    "Upgrade your lifestyle with this must-have item. Features modern design and superior functionality for the discerning customer.",
    "Discover the perfect blend of style and practicality. This product delivers outstanding performance and unmatched value.",
    "Elevate your experience with this top-rated product. Engineered for excellence and designed with you in mind.",
    "A perfect choice for those who appreciate quality. This product combines innovation with reliability.",
    "Stand out from the crowd with this exceptional offering. Premium materials meet cutting-edge design.",
    "Your search for the perfect product ends here. Uncompromising quality meets affordable pricing.",
    "Transform your daily routine with this game-changing product. Built for performance, designed for life.",
    "Experience the difference that quality makes. This product is crafted to exceed your expectations.",
    "The ultimate solution for modern living. Combining functionality with aesthetics in perfect harmony."
];

// ============================================
// MONGOOSE SCHEMAS (inline to avoid import issues)
// ============================================
const VariationTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }]
}, { _id: false });

const VariantSchema = new mongoose.Schema({
    attributes: { type: Map, of: String, required: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, default: '' }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    images: [{ type: String }],
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    variationTypes: { type: [VariationTypeSchema], default: [] },
    variants: { type: [VariantSchema], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generatePicsumImageUrl(width, height, seed) {
    // Picsum provides random images with optional seed for consistency
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function generateImages(productIndex, imageIndex, count) {
    const images = [];
    for (let i = 0; i < count; i++) {
        const seed = `product-${productIndex}-${imageIndex}-${i}-${Date.now()}`;
        images.push(generatePicsumImageUrl(CONFIG.imageWidth, CONFIG.imageHeight, seed));
    }
    return images;
}

function generateSKU(productName, variantIndex) {
    const prefix = productName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}-${variantIndex.toString().padStart(3, '0')}`;
}

function generateVariants(variationTypes, productName) {
    const variants = [];

    if (variationTypes.length === 0) {
        // Single variant product
        const regularPrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        const hasSale = Math.random() < CONFIG.salePriceProbability;
        const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
        const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

        variants.push({
            attributes: new Map([['Default', 'Standard']]),
            regularPrice,
            salePrice,
            stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
            sku: generateSKU(productName, 0)
        });
    } else if (variationTypes.length === 1) {
        // Single variation type
        const basePrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        variationTypes[0].options.forEach((option, index) => {
            const priceVariation = getRandomInt(-50, 100);
            const regularPrice = Math.max(CONFIG.minPrice, basePrice + priceVariation);
            const hasSale = Math.random() < CONFIG.salePriceProbability;
            const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
            const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

            variants.push({
                attributes: new Map([[variationTypes[0].name, option]]),
                regularPrice,
                salePrice,
                stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
                sku: generateSKU(productName, index)
            });
        });
    } else {
        // Multiple variation types - create combinations
        const basePrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        let variantIndex = 0;

        const generateCombinations = (typeIndex, currentAttributes) => {
            if (typeIndex >= variationTypes.length) {
                const priceVariation = getRandomInt(-50, 150);
                const regularPrice = Math.max(CONFIG.minPrice, basePrice + priceVariation);
                const hasSale = Math.random() < CONFIG.salePriceProbability;
                const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
                const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

                variants.push({
                    attributes: new Map(Object.entries(currentAttributes)),
                    regularPrice,
                    salePrice,
                    stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
                    sku: generateSKU(productName, variantIndex++)
                });
                return;
            }

            const currentType = variationTypes[typeIndex];
            for (const option of currentType.options) {
                generateCombinations(typeIndex + 1, {
                    ...currentAttributes,
                    [currentType.name]: option
                });
            }
        };

        generateCombinations(0, {});
    }

    return variants;
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function seedDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('❌ Error: MONGODB_URI environment variable is not set.');
        console.error('   Please set it in your .env.local file');
        process.exit(1);
    }

    console.log('🚀 Starting database seeding...\n');
    console.log('📋 Configuration:');
    console.log(`   Products to create: ${CONFIG.productsCount}`);
    console.log(`   Categories to create: ${CONFIG.categoriesCount}`);
    console.log(`   Clear existing data: ${CONFIG.clearExisting}`);
    console.log(`   Images per product: ${CONFIG.minImagesPerProduct}-${CONFIG.maxImagesPerProduct}`);
    console.log(`   Price range: ₹${CONFIG.minPrice} - ₹${CONFIG.maxPrice}`);
    console.log('');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { bufferCommands: false });
        console.log('✅ Connected to MongoDB\n');

        // Get or create models
        const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        // Clear existing data if configured
        if (CONFIG.clearExisting) {
            console.log('🗑️  Clearing existing data...');
            await Product.deleteMany({});
            await Category.deleteMany({});
            console.log('✅ Existing data cleared\n');
        }

        // Create categories
        console.log('📁 Creating categories...');
        const categoriesToCreate = CATEGORIES.slice(0, CONFIG.categoriesCount);
        const createdCategories = [];

        for (let i = 0; i < categoriesToCreate.length; i++) {
            const categoryData = categoriesToCreate[i];
            const category = await Category.create({
                name: categoryData.name,
                description: categoryData.description,
                image: generatePicsumImageUrl(400, 400, `category-${categoryData.name.toLowerCase().replace(/\s+/g, '-')}`),
                isActive: true
            });
            createdCategories.push(category);
            console.log(`   ✓ Created category: ${category.name}`);
        }
        console.log(`✅ Created ${createdCategories.length} categories\n`);

        // Create products
        console.log('📦 Creating products...');
        let productsCreated = 0;

        while (productsCreated < CONFIG.productsCount) {
            // Pick a random category
            const category = getRandomElement(createdCategories);
            const categoryName = category.name;

            // Get product templates for this category
            let templates = PRODUCT_TEMPLATES[categoryName];

            // If no templates exist for this category, use a random one
            if (!templates) {
                const availableCategories = Object.keys(PRODUCT_TEMPLATES);
                templates = PRODUCT_TEMPLATES[getRandomElement(availableCategories)];
            }

            // Pick a random template
            const template = getRandomElement(templates);

            // Generate product data
            const imageCount = getRandomInt(CONFIG.minImagesPerProduct, CONFIG.maxImagesPerProduct);
            const productName = template.name;
            const variationTypes = template.variations;
            const variants = generateVariants(variationTypes, productName);

            const productData = {
                name: productName,
                description: getRandomElement(DESCRIPTIONS),
                images: generateImages(productsCreated, Math.random(), imageCount),
                variationTypes: variationTypes,
                variants: variants,
                category: category._id,
                isActive: true
            };

            try {
                await Product.create(productData);
                productsCreated++;
                
                if (productsCreated % 10 === 0 || productsCreated === CONFIG.productsCount) {
                    console.log(`   📊 Progress: ${productsCreated}/${CONFIG.productsCount} products created`);
                }
            } catch (error) {
                console.error(`   ❌ Error creating product: ${error.message}`);
            }
        }

        console.log(`\n✅ Successfully created ${productsCreated} products!\n`);

        // Summary
        console.log('📊 Summary:');
        console.log('─'.repeat(40));
        
        for (const category of createdCategories) {
            const count = await Product.countDocuments({ category: category._id });
            console.log(`   ${category.name}: ${count} products`);
        }
        
        const totalProducts = await Product.countDocuments({});
        const totalCategories = await Category.countDocuments({});
        
        console.log('─'.repeat(40));
        console.log(`   Total Categories: ${totalCategories}`);
        console.log(`   Total Products: ${totalProducts}`);
        console.log('');

        console.log('🎉 Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// ============================================
// RUN THE SCRIPT
// ============================================
seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
