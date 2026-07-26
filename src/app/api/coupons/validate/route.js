import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { withAuth } from "@/lib/auth";
import { validateCouponForCart } from "@/lib/coupons";

// POST validate coupon and calculate discount
async function postHandler(req) {
    try {
        const { code, cartItems, cartTotal } = await req.json();
        const userId = req.user._id;

        if (!code) {
            return Response.json(
                { success: false, message: "Coupon code is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        }).populate('applicableCategories applicableProducts applicableUsers');

        if (!coupon) {
            return Response.json(
                { success: false, message: "Invalid or inactive coupon code" },
                { status: 400 }
            );
        }

        // Same validation the order endpoint enforces, so the preview shown at
        // checkout can never disagree with what the server will accept.
        const validation = await validateCouponForCart({
            coupon,
            userId,
            cartItems: cartItems || [],
            cartTotal
        });

        if (!validation.valid) {
            return Response.json(
                { success: false, message: validation.message },
                { status: 400 }
            );
        }

        const discountAmount = coupon.calculateDiscount(cartItems || [], cartTotal);
        const finalTotal = Math.max(0, cartTotal - discountAmount);

        return Response.json({
            success: true,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            discountAmount,
            subtotal: cartTotal,
            finalTotal
        });
    } catch (error) {
        console.error("Validate coupon error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAuth(postHandler);
