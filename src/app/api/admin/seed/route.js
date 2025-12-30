import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Seed an admin user - DELETE THIS FILE AFTER USE IN PRODUCTION
export async function POST(req) {
    try {
        const { secretKey } = await req.json();

        // Simple protection - change this key before running
        if (secretKey !== "create-admin-2024") {
            return Response.json(
                { success: false, message: "Invalid secret key" },
                { status: 401 }
            );
        }

        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: "admin" });

        if (existingAdmin) {
            return Response.json({
                success: false,
                message: "Admin user already exists",
            });
        }

        // Create admin user
        const admin = await User.create({
            name: "Admin",
            email: "admin@essvora.com",
            password: "admin123",
            phone: "",
            role: "admin",
            isActive: true,
        });

        return Response.json({
            success: true,
            message: "Admin user created successfully",
            user: {
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        console.error("Seed admin error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
