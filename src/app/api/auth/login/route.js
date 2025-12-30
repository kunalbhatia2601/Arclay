import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return Response.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user with password
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return Response.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return Response.json(
                { success: false, message: "Account is deactivated" },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return Response.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
        };

        return Response.json({
            success: true,
            message: "Login successful",
            user: userResponse,
        });
    } catch (error) {
        console.error("Login error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
