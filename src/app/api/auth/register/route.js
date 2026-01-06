import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { generateToken } from "@/lib/auth";
import { generateOTP, getOTPExpiry, sendOTPEmail } from "@/lib/mailer";
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

        // Get settings to check if email verification is enabled
        const settings = await Settings.getSettings();
        const isEmailVerificationEnabled = settings.mail?.isEnabled &&
            settings.mail?.email &&
            settings.mail?.password &&
            settings.mail?.host;

        if (isEmailVerificationEnabled) {
            // Create user with isActive: false and unverified
            const otp = generateOTP();
            const otpExpiry = getOTPExpiry();

            const user = await User.create({
                name,
                email,
                password,
                phone: phone || "",
                isActive: false,
                isEmailVerified: false,
                otp: {
                    code: otp,
                    expiresAt: otpExpiry,
                },
            });

            // Send OTP email
            const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
            const emailResult = await sendOTPEmail(email, otp, settings.mail, siteName);

            if (!emailResult.success) {
                // Delete user if email sending fails
                await User.findByIdAndDelete(user._id);
                return Response.json(
                    { success: false, message: "Failed to send verification email. Please try again." },
                    { status: 500 }
                );
            }

            return Response.json({
                success: true,
                message: "Registration successful. Please verify your email.",
                requiresVerification: true,
                email: email,
            });
        } else {
            // Email verification disabled - original flow
            const user = await User.create({
                name,
                email,
                password,
                phone: phone || "",
                isEmailVerified: true, // No verification needed
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
                isEmailVerified: user.isEmailVerified,
            };

            return Response.json({
                success: true,
                message: "Registration successful",
                user: userResponse,
            });
        }
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

