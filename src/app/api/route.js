import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET - Health check and auto-create admin if not exists
export async function GET() {
    try {
        await connectDB();

        // Check if admin exists
        const adminEmail = "admin@admin.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            // Create default admin user
            await User.create({
                name: "Admin",
                email: adminEmail,
                password: "admin123", // Will be hashed by pre-save hook
                phone: "9876543210",
                role: "admin",
                isActive: true,
                isEmailVerified: true,
            });
        }

        return Response.json({
            success: true,
            message: "API is running",
            siteName: process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA",
        });
    } catch (error) {
        console.error("API health check error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
