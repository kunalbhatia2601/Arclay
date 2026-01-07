import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { withPublicProtection } from "@/lib/auth";

// GET available coupons for checkout (showToUser = true)
async function getHandler(req) {
    try {
        await connectDB();

        const now = new Date();

        const coupons = await Coupon.find({
            isActive: true,
            showToUser: true,
            $or: [
                { validFrom: null },
                { validFrom: { $lte: now } }
            ],
            $or: [
                { validUntil: null },
                { validUntil: { $gte: now } }
            ],
            $or: [
                { maxUsage: null },
                { $expr: { $lt: ['$usageCount', '$maxUsage'] } }
            ]
        })
            .select('code description discountType discountValue minPurchase maxDiscount')
            .lean();

        return Response.json({
            success: true,
            coupons
        });
    } catch (error) {
        console.error("Get available coupons error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withPublicProtection(getHandler);
