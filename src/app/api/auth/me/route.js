import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return Response.json(
                { success: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const user = await getUserFromToken(token);

        if (!user) {
            return Response.json(
                { success: false, message: "Invalid or expired token" },
                { status: 401 }
            );
        }

        return Response.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        console.error("Get user error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
