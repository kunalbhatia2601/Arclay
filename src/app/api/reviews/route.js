import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { withAuth } from "@/lib/auth";

// POST create review
async function postHandler(req) {
    try {
        const { productId, stars, comment } = await req.json();
        const userId = req.user._id;

        if (!productId || !stars || !comment) {
            return Response.json(
                { success: false, message: "Product ID, stars, and comment are required" },
                { status: 400 }
            );
        }

        if (stars < 1 || stars > 5) {
            return Response.json(
                { success: false, message: "Stars must be between 1 and 5" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // Check if user has a delivered order with this product
        const deliveredOrder = await Order.findOne({
            user: userId,
            orderStatus: 'delivered',
            'items.product': productId
        });

        if (!deliveredOrder) {
            return Response.json(
                { success: false, message: "You can only review products you have purchased and received" },
                { status: 403 }
            );
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return Response.json(
                { success: false, message: "You have already reviewed this product" },
                { status: 400 }
            );
        }

        // Create review (isActive defaults to false)
        const review = await Review.create({
            user: userId,
            product: productId,
            stars,
            comment
        });

        return Response.json({
            success: true,
            message: "Review submitted successfully. It will be visible after admin approval.",
            review
        });
    } catch (error) {
        console.error("Create review error:", error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return Response.json(
                { success: false, message: "You have already reviewed this product" },
                { status: 400 }
            );
        }

        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

// GET check if user can review a product
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return Response.json(
                { success: false, message: "Product ID is required" },
                { status: 400 }
            );
        }

        const userId = req.user._id;

        await connectDB();

        // Check if user has a delivered order with this product
        const deliveredOrder = await Order.findOne({
            user: userId,
            orderStatus: 'delivered',
            'items.product': productId
        });

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        return Response.json({
            success: true,
            canReview: !!deliveredOrder && !existingReview,
            hasDeliveredOrder: !!deliveredOrder,
            hasReviewed: !!existingReview
        });
    } catch (error) {
        console.error("Check review eligibility error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
