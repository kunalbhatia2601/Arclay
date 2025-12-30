import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const { name, email, password, phone } = await req.json();

        if (!name || !email || !password) {
            return Response.json(
                { success: false, message: "Name, email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return Response.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return Response.json(
                { success: false, message: "Email already registered" },
                { status: 400 }
            );
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone: phone || "",
        });

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
            message: "Registration successful",
            user: userResponse,
        });
    } catch (error) {
        console.error("Register error:", error);

        if (error.code === 11000) {
            return Response.json(
                { success: false, message: "Email already registered" },
                { status: 400 }
            );
        }

        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
