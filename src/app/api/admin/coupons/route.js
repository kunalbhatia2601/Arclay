import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { withAdminProtection } from "@/lib/auth";

// GET all coupons (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const status = searchParams.get("status");

        await connectDB();

        const query = {};
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        const skip = (page - 1) * limit;

        const [coupons, total] = await Promise.all([
            Coupon.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Coupon.countDocuments(query)
        ]);

        return Response.json({
            success: true,
            coupons,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get admin coupons error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create coupon
async function postHandler(req) {
    try {
        const data = await req.json();

        if (!data.code || !data.discountType || data.discountValue === undefined) {
            return Response.json(
                { success: false, message: "Code, discount type, and value are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if code already exists
        const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
        if (existing) {
            return Response.json(
                { success: false, message: "Coupon code already exists" },
                { status: 400 }
            );
        }

        const coupon = await Coupon.create({
            code: data.code.toUpperCase(),
            description: data.description || '',
            discountType: data.discountType,
            discountValue: data.discountValue,
            minPurchase: data.minPurchase || 0,
            maxDiscount: data.maxDiscount || null,
            maxUsage: data.maxUsage || null,
            perUserLimit: data.perUserLimit || 1,
            validFrom: data.validFrom || new Date(),
            validUntil: data.validUntil || null,
            applicableCategories: data.applicableCategories || [],
            applicableProducts: data.applicableProducts || [],
            applicableUsers: data.applicableUsers || [],
            firstPurchaseOnly: data.firstPurchaseOnly || false,
            isActive: data.isActive !== false,
            showToUser: data.showToUser || false
        });

        return Response.json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });
    } catch (error) {
        console.error("Create coupon error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const POST = withAdminProtection(postHandler);
