import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";
import { isOTPExpired } from "@/lib/mailer";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return Response.json(
                { success: false, message: "Email and OTP are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user with OTP fields
        const user = await User.findOne({ email }).select("+otp.code +otp.expiresAt");

        if (!user) {
            return Response.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (user.isEmailVerified) {
            return Response.json(
                { success: false, message: "Email already verified" },
                { status: 400 }
            );
        }

        // Check if OTP exists
        if (!user.otp?.code || !user.otp?.expiresAt) {
            return Response.json(
                { success: false, message: "No OTP found. Please request a new one." },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        if (isOTPExpired(user.otp.expiresAt)) {
            return Response.json(
                { success: false, message: "OTP has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Verify OTP
        if (user.otp.code !== otp) {
            return Response.json(
                { success: false, message: "Invalid OTP" },
                { status: 400 }
            );
        }

        // OTP is valid - activate user and clear OTP
        await User.findByIdAndUpdate(user._id, {
            isActive: true,
            isEmailVerified: true,
            $unset: { otp: 1 }
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

        // Return user
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: true,
            isEmailVerified: true,
        };

        return Response.json({
            success: true,
            message: "Email verified successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
