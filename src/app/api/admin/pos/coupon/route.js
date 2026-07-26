import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import Customer from "@/models/Customer";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";
import { validateCouponForCart } from "@/lib/coupons";
import { resolveCartLines, toCouponItems } from "@/lib/posCart";

// POST - preview a coupon against the POS cart.
// Read-only: nothing is claimed here, the sale endpoint re-validates and claims.
async function postHandler(req) {
    try {
        const { code, items, phone } = await req.json();

        if (!code) {
            return Response.json(
                { success: false, message: "Coupon code is required" },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json(
                { success: false, message: "Add items to the bill before applying a coupon" },
                { status: 400 }
            );
        }

        await connectDB();

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true })
            .populate('applicableCategories applicableProducts applicableUsers');

        if (!coupon) {
            return Response.json(
                { success: false, message: "Invalid or inactive coupon code" },
                { status: 400 }
            );
        }

        const resolved = await resolveCartLines(items);
        if (!resolved.ok) {
            return Response.json({ success: false, message: resolved.message }, { status: 400 });
        }

        const customer = phone?.trim() ? await Customer.findOne({ phone: phone.trim() }) : null;

        const couponItems = toCouponItems(resolved.lines);
        const cartTotal = couponItems.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0);

        const validation = await validateCouponForCart({
            coupon,
            customerId: customer?._id,
            cartItems: couponItems,
            cartTotal,
        });

        if (!validation.valid) {
            return Response.json(
                { success: false, message: validation.message },
                { status: 400 }
            );
        }

        const discountAmount = coupon.calculateDiscount(couponItems, cartTotal);

        return Response.json({
            success: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
            },
            discountAmount,
        });
    } catch (error) {
        console.error("POS coupon error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAdmin(postHandler);
