import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { withAdmin } from "@/lib/auth";

async function handler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (role && ["user", "admin"].includes(role)) {
            query.role = role;
        }

        const total = await User.countDocuments(query);
        const pages = Math.ceil(total / limit);

        const users = await User.find(query)
            .select("name email phone role isActive createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return Response.json({
            success: true,
            users,
            pagination: {
                page,
                pages,
                total,
                limit,
            },
        });
    } catch (error) {
        console.error("Users list error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(handler);
