import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { withAdminProtection } from "@/lib/auth";

// GET single review
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const review = await Review.findById(id)
            .populate('user', 'name email')
            .populate('product', 'name images')
            .lean();

        if (!review) {
            return Response.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            review
        });
    } catch (error) {
        console.error("Get review error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update review (toggle active, edit if needed)
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const updates = await req.json();

        await connectDB();

        const review = await Review.findById(id);

        if (!review) {
            return Response.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        // Update allowed fields
        if (updates.isActive !== undefined) review.isActive = updates.isActive;
        if (updates.stars !== undefined) review.stars = updates.stars;
        if (updates.comment !== undefined) review.comment = updates.comment;

        await review.save();

        const updatedReview = await Review.findById(id)
            .populate('user', 'name email')
            .populate('product', 'name images')
            .lean();

        return Response.json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview
        });
    } catch (error) {
        console.error("Update review error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

// DELETE review
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return Response.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Delete review error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
export const DELETE = withAdminProtection(deleteHandler);
