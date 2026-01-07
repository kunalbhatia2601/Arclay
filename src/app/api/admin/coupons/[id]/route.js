import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { withAdminProtection } from "@/lib/auth";

// GET single coupon
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const coupon = await Coupon.findById(id)
            .populate('applicableCategories', 'name')
            .populate('applicableProducts', 'name')
            .populate('applicableUsers', 'name email')
            .lean();

        if (!coupon) {
            return Response.json(
                { success: false, message: "Coupon not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error("Get coupon error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update coupon
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const updates = await req.json();

        await connectDB();

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return Response.json(
                { success: false, message: "Coupon not found" },
                { status: 404 }
            );
        }

        // Check if code is being changed and already exists
        if (updates.code && updates.code.toUpperCase() !== coupon.code) {
            const existing = await Coupon.findOne({
                code: updates.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existing) {
                return Response.json(
                    { success: false, message: "Coupon code already exists" },
                    { status: 400 }
                );
            }
            coupon.code = updates.code.toUpperCase();
        }

        // Update fields
        const fields = [
            'description', 'discountType', 'discountValue', 'minPurchase',
            'maxDiscount', 'maxUsage', 'perUserLimit', 'validFrom', 'validUntil',
            'applicableCategories', 'applicableProducts', 'applicableUsers',
            'firstPurchaseOnly', 'isActive', 'showToUser'
        ];

        fields.forEach(field => {
            if (updates[field] !== undefined) {
                coupon[field] = updates[field];
            }
        });

        await coupon.save();

        return Response.json({
            success: true,
            message: "Coupon updated successfully",
            coupon
        });
    } catch (error) {
        console.error("Update coupon error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

// DELETE coupon
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return Response.json(
                { success: false, message: "Coupon not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        console.error("Delete coupon error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
export const DELETE = withAdminProtection(deleteHandler);
