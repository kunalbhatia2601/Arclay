/**
 * Complete Seeder Script
 * 
 * Seeds the database with:
 * - Admin user (from config)
 * - Sample users
 * - Categories
 * - Products with long descriptions
 * - Reviews
 * - Bundles
 * - Product Ads
 * - Coupons
 * - Settings
 * - Addresses
 * - Orders (some with coupons)
 * 
 * Usage: node scripts/seedProducts.js
 * 
 * Make sure to set MONGODB_URI in your .env.local file
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================
// CONFIGURATION - Modify these values as needed
// ============================================
const CONFIG = {
    // Admin user credentials
    admin: {
        name: 'Admin User',
        email: 'admin@arclay.com',
        password: 'Admin@123',
        phone: '+91 9999999999'
    },

    // Counts
    usersCount: 10,
    productsCount: 50,
    categoriesCount: 10,
    bundlesCount: 5,
    productAdsCount: 10,
    couponsCount: 8,
    ordersPerUserMax: 5,

    // Reviews per product (min, max)
    minReviewsPerProduct: 0,
    maxReviewsPerProduct: 10,

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
    salePriceProbability: 0.4,

    // Sale discount range (percentage)
    minSaleDiscount: 10,
    maxSaleDiscount: 50,

    // Featured product probability
    featuredProbability: 0.6,

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

const SAMPLE_USERS = [
    { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
    { name: 'Priya Patel', email: 'priya.patel@example.com' },
    { name: 'Amit Kumar', email: 'amit.kumar@example.com' },
    { name: 'Sneha Reddy', email: 'sneha.reddy@example.com' },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com' },
    { name: 'Anita Gupta', email: 'anita.gupta@example.com' },
    { name: 'Rajesh Iyer', email: 'rajesh.iyer@example.com' },
    { name: 'Meera Nair', email: 'meera.nair@example.com' },
    { name: 'Sanjay Joshi', email: 'sanjay.joshi@example.com' },
    { name: 'Kavita Menon', email: 'kavita.menon@example.com' },
    { name: 'Arjun Das', email: 'arjun.das@example.com' },
    { name: 'Pooja Verma', email: 'pooja.verma@example.com' }
];

const COUPONS = [
    { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, description: '10% off on your first order' },
    { code: 'SAVE20', discountType: 'percentage', discountValue: 20, description: 'Save 20% on all items' },
    { code: 'FLAT500', discountType: 'fixed', discountValue: 500, minPurchase: 2000, description: 'Flat ₹500 off on orders above ₹2000' },
    { code: 'FREESHIP', discountType: 'fixed', discountValue: 0, description: 'Free shipping on all orders' }, // Handled as free shipping logic usually
    { code: 'SUMMER30', discountType: 'percentage', discountValue: 30, description: 'Summer sale special' },
    { code: 'BUY1GET1', discountType: 'buyXGetYFree', buyXGetYFree: { buyQty: 1, freeQty: 1 }, description: 'Buy 1 Get 1 Free on selected items' },
    { code: 'BULK5', discountType: 'tierPricing', quantityTiers: [{ minQty: 5, discountValue: 15 }], description: '15% off when you buy 5 or more items' }
];

const PRODUCT_ADS = [
    { title: 'Summer Collection', description: 'Check out our new summer arrivals', mediaUrl: 'https://picsum.photos/1200/400?random=101', position: 'hero' },
    { title: 'Flash Sale', description: 'Up to 50% off on electronics', mediaUrl: 'https://picsum.photos/1200/400?random=102', position: 'banner' },
    { title: 'New Gadgets', description: 'Upgrade your tech game', mediaUrl: 'https://picsum.photos/600/400?random=103', position: 'banner' }
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

const LONG_DESCRIPTIONS = [
    `## Product Overview
This premium product represents the pinnacle of quality and craftsmanship. Every aspect has been carefully considered to deliver an exceptional user experience.

### Key Features
- **Premium Materials**: Crafted using only the finest materials available
- **Durable Construction**: Built to withstand daily use for years to come
- **Modern Design**: Sleek aesthetics that complement any style
- **Easy Maintenance**: Simple care instructions for long-lasting beauty

### What's in the Box
- Main product unit
- User manual with detailed instructions
- Warranty card
- Accessories pack

### Care Instructions
Clean with a soft, damp cloth. Avoid harsh chemicals. Store in a cool, dry place when not in use.`,

    // ... (reused from before, kept concise here for file) ...
    `## Exceptional Quality, Unbeatable Value
Discover why thousands of customers have chosen this product. We've combined cutting-edge technology with timeless design principles.

### Technical Details
- Engineered for optimal performance
- Energy-efficient operation
- Low maintenance requirements

### User Experience
Our product is designed to be intuitive and user-friendly. Whether you're a first-time user or an experienced professional, you'll appreciate the thoughtful design choices we've made.`,

    `## The Perfect Choice for Discerning Customers
When only the best will do, this product delivers. We've spared no expense in creating something truly special.

### What Sets Us Apart
- **Attention to Detail**: Every component has been carefully selected
- **Quality Control**: Multiple inspection points ensure perfection
- **Customer Focus**: Designed based on real user feedback

### Ideal For
- Daily use in home or office
- Gift giving for special occasions
- Professional applications`
];

const REVIEW_COMMENTS = [
    "Absolutely love this product! Exceeded all my expectations.",
    "Great value for money. Works exactly as described.",
    "Good product overall. Minor issues with packaging but the item itself is perfect.",
    "Five stars! This is exactly what I was looking for.",
    "Very satisfied with this purchase. The product matches the description perfectly.",
    "Excellent quality! I've been using this for weeks now and it still performs like new.",
    "Amazing product at a reasonable price.",
    "Really impressed with the attention to detail.",
    "Perfect for my needs. Easy to use and the instructions were clear.",
    "Outstanding quality and fast delivery."
];

// ============================================
// MONGOOSE SCHEMAS (inline to avoid import issues)
// ============================================

// 1. Settings Schema
const SettingsSchema = new mongoose.Schema({
    isDemo: { type: Boolean, default: false },
    isMaintenance: { type: Boolean, default: false },
    payment: {
        razorpay: { keyId: { type: String, default: '' }, keySecret: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
        stripe: { publishableKey: { type: String, default: '' }, secretKey: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
        cod: { isEnabled: { type: Boolean, default: true } }
    },
    mail: { email: { type: String, default: '' }, password: { type: String, default: '' }, host: { type: String, default: '' }, port: { type: Number, default: 587 }, isSSL: { type: Boolean, default: false }, isEnabled: { type: Boolean, default: false } },
    gemini_ai: { apiKey: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
    shipping: {
        shiprocket: { isEnabled: { type: Boolean, default: false }, email: { type: String, default: '' }, password: { type: String, default: '' } },
        warehouse: { name: { type: String, default: '' } },
        rateCalculation: { type: String, enum: ['realtime', 'flat', 'free_threshold'], default: 'free_threshold' },
        flatRate: { type: Number, default: 50 },
        freeShippingThreshold: { type: Number, default: 499 },
        defaultWeight: { type: Number, default: 0.5 }
    }
}, { timestamps: true });

// 2. Coupon Schema
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed', 'buyXForY', 'buyXGetYFree', 'tierPricing'], required: true },
    discountValue: { type: Number, default: 0 },

    buyXForY: { requiredQty: { type: Number, default: 0 }, flatPrice: { type: Number, default: 0 } },
    buyXGetYFree: { buyQty: { type: Number, default: 0 }, freeQty: { type: Number, default: 0 } },
    quantityTiers: [{ minQty: { type: Number, required: true }, maxQty: { type: Number, default: null }, discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }, discountValue: { type: Number, required: true } }],

    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    maxUsage: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    showToUser: { type: Boolean, default: false }
}, { timestamps: true });

// 3. Address Schema
const AddressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// 4. Order Schema
const OrderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { attributes: { type: Map, of: String }, price: { type: Number, required: true }, sku: String },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    totalAmount: { type: Number, required: true },
    subtotal: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 }
}, { timestamps: true });

// 5. ProductAd Schema
const ProductAdSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    linkUrl: { type: String, default: '' },
    position: { type: String, enum: ['hero', 'banner', 'popup'], default: 'banner' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 6. Bundle Schema
const BundleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    btnTxt: { type: String, default: 'View Bundle' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Other Schemas (Existing)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    image: { type: String, default: '' }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

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
    long_description: { type: String, trim: true, maxlength: 10000, default: '' },
    variationTypes: { type: [VariationTypeSchema], default: [] },
    variants: { type: [VariantSchema], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
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
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomElement(array) { return array[Math.floor(Math.random() * array.length)]; }
function generatePicsumImageUrl(width, height, seed) { return `https://picsum.photos/seed/${seed}/${width}/${height}`; }

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
                generateCombinations(typeIndex + 1, { ...currentAttributes, [currentType.name]: option });
            }
        };
        generateCombinations(0, {});
    }
    return variants;
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function seedDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI + '/' + (process.env.NEXT_PUBLIC_SITE_NAME || 'arclay').toLowerCase();

    if (!MONGODB_URI) { console.error('❌ Error: MONGODB_URI not set.'); process.exit(1); }

    console.log('🚀 Starting database seeding...\n');
    console.log('📋 Configuration:', CONFIG);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { bufferCommands: false });
        console.log('✅ Connected\n');

        // Models
        const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
        const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
        const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
        const Address = mongoose.models.Address || mongoose.model('Address', AddressSchema);
        const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
        const ProductAd = mongoose.models.ProductAd || mongoose.model('ProductAd', ProductAdSchema);
        const Bundle = mongoose.models.Bundle || mongoose.model('Bundle', BundleSchema);

        if (CONFIG.clearExisting) {
            console.log('🗑️  Clearing existing data...');
            await Promise.all([
                Category.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Review.deleteMany({}),
                Settings.deleteMany({}), Coupon.deleteMany({}), Address.deleteMany({}), Order.deleteMany({}),
                ProductAd.deleteMany({}), Bundle.deleteMany({})
            ]);
            console.log('✅ Data cleared\n');
        }

        // 1. Settings
        console.log('⚙️  Creating settings...');
        await Settings.create({
            isDemo: false,
            payment: { cod: { isEnabled: true }, razorpay: { isEnabled: true }, stripe: { isEnabled: false } },
            shipping: { freeShippingThreshold: 500, flatRate: 40, rateCalculation: 'free_threshold' }
        });
        console.log('✅ Settings created\n');

        // 2. Users (Admin + Sample)
        console.log('� Creating users...');
        const users = [];
        const hashedAdminPwd = await hashPassword(CONFIG.admin.password);
        const admin = await User.create({
            name: CONFIG.admin.name, email: CONFIG.admin.email, phone: CONFIG.admin.phone,
            password: hashedAdminPwd, role: 'admin', isActive: true, isEmailVerified: true
        });
        users.push(admin);

        for (const u of SAMPLE_USERS) {
            const pwd = await hashPassword('User@123');
            const user = await User.create({
                name: u.name, email: u.email, password: pwd, role: 'user', isActive: true, isEmailVerified: true
            });
            users.push(user);
        }
        console.log(`✅ Created ${users.length} users\n`);

        // 3. Addresses
        console.log('🏠 Creating addresses...');
        for (const user of users) {
            await Address.create({
                user: user._id, label: 'Home', fullName: user.name, phone: user.phone || '9876543210',
                addressLine1: '123, Sample Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true
            });
        }
        console.log('✅ Addresses created\n');

        // 4. Categories & Products
        console.log('📦 Creating categories & products...');
        const products = [];
        const categories = [];

        for (let i = 0; i < CONFIG.categoriesCount; i++) {
            const cData = CATEGORIES[i];
            const cat = await Category.create({
                name: cData.name, description: cData.description,
                image: generatePicsumImageUrl(400, 400, `cat-${i}`), isActive: true
            });
            categories.push(cat);
        }

        let productsCreated = 0;
        while (productsCreated < CONFIG.productsCount) {
            const category = getRandomElement(categories);
            const template = getRandomElement(PRODUCT_TEMPLATES[category.name] || Object.values(PRODUCT_TEMPLATES).flat());
            const variations = template.variations || [];

            const product = await Product.create({
                name: template.name,
                description: getRandomElement(DESCRIPTIONS),
                long_description: getRandomElement(LONG_DESCRIPTIONS),
                images: generateImages(productsCreated, Math.random(), 3),
                variationTypes: variations,
                variants: generateVariants(variations, template.name),
                category: category._id,
                isActive: true,
                isFeatured: Math.random() < CONFIG.featuredProbability
            });
            products.push(product);
            productsCreated++;
        }
        console.log(`✅ Created ${products.length} products\n`);

        // 5. Product Ads & Bundles
        console.log('📢 Creating ads & bundles...');
        await ProductAd.insertMany(PRODUCT_ADS);

        for (let i = 0; i < CONFIG.bundlesCount; i++) {
            const bundleProducts = [getRandomElement(products), getRandomElement(products)];
            await Bundle.create({
                title: `Super Saver Bundle ${i + 1}`,
                slug: `super-saver-bundle-${i + 1}`,
                products: bundleProducts.map(p => p._id),
                isActive: true
            });
        }
        console.log('✅ Ads & bundles created\n');

        // 6. Coupons
        console.log('🎟️  Creating coupons...');
        const coupons = await Coupon.insertMany(COUPONS);
        console.log(`✅ Created ${coupons.length} coupons\n`);

        // 7. Orders & Reviews
        console.log('🛒 Creating orders & reviews...');
        const regularUsers = users.filter(u => u.role !== 'admin');

        for (const user of regularUsers) {
            // Orders
            const orderCount = getRandomInt(0, CONFIG.ordersPerUserMax);
            for (let i = 0; i < orderCount; i++) {
                const orderItems = [];
                const itemCount = getRandomInt(1, 3);
                let subtotal = 0;

                for (let j = 0; j < itemCount; j++) {
                    const prod = getRandomElement(products);
                    const variant = prod.variants[0];
                    const price = variant.salePrice || variant.regularPrice;
                    orderItems.push({
                        product: prod._id,
                        variant: { attributes: variant.attributes, price, sku: variant.sku },
                        quantity: 1,
                        priceAtOrder: price
                    });
                    subtotal += price;
                }

                // Randomly apply coupon
                let coupon = null;
                let discountAmount = 0;
                if (Math.random() > 0.5) {
                    coupon = getRandomElement(coupons);
                    // Simplified discount logic
                    if (coupon.discountType === 'percentage') discountAmount = (subtotal * coupon.discountValue) / 100;
                    else if (coupon.discountType === 'fixed') discountAmount = coupon.discountValue;
                    if (discountAmount > subtotal) discountAmount = subtotal;
                }

                await Order.create({
                    user: user._id,
                    items: orderItems,
                    shippingAddress: { fullName: user.name, phone: '9999999999', addressLine1: 'Main St', city: 'City', state: 'State', pincode: '123456' },
                    paymentMethod: 'razorpay',
                    paymentStatus: 'completed',
                    orderStatus: 'delivered',
                    subtotal,
                    totalAmount: subtotal - discountAmount + 40,
                    coupon: coupon?._id,
                    couponCode: coupon?.code,
                    discountAmount,
                    shippingFee: 40
                });
            }

            // Reviews
            for (let k = 0; k < 2; k++) {
                const prod = getRandomElement(products);
                try {
                    await Review.create({
                        stars: getRandomInt(4, 5), comment: getRandomElement(REVIEW_COMMENTS),
                        user: user._id, product: prod._id, isActive: true
                    });
                } catch (e) { }
            }
        }
        console.log('✅ Orders & reviews created\n');

        console.log('🎉 Database seeding COMPLETED!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();
