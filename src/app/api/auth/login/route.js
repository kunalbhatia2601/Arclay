import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { generateToken } from "@/lib/auth";
import { generateOTP, getOTPExpiry, sendOTPEmail, isOTPExpired } from "@/lib/mailer";
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

        // Find user with password and OTP fields
        const user = await User.findOne({ email }).select("+password +otp.code +otp.expiresAt");

        if (!user) {
            return Response.json(
                { success: false, message: "Invalid email or password" },
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

        // Get settings to check if email verification is enabled
        const settings = await Settings.getSettings();
        const isEmailVerificationEnabled = settings.mail?.isEnabled &&
            settings.mail?.email &&
            settings.mail?.password &&
            settings.mail?.host;

        // Check if user is verified when email verification is enabled
        if (isEmailVerificationEnabled && !user.isEmailVerified) {
            // Generate new OTP if expired or doesn't exist
            let needNewOTP = !user.otp?.code || !user.otp?.expiresAt || isOTPExpired(user.otp.expiresAt);

            if (needNewOTP) {
                const otp = generateOTP();
                const otpExpiry = getOTPExpiry();

                await User.findByIdAndUpdate(user._id, {
                    otp: { code: otp, expiresAt: otpExpiry }
                });

                // Send OTP email
                const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
                await sendOTPEmail(email, otp, settings.mail, siteName);
            }

            return Response.json({
                success: false,
                message: "Please verify your email to continue",
                requiresVerification: true,
                email: email,
            });
        }

        // Check if account is active (for manual deactivation)
        if (!user.isActive && user.isEmailVerified) {
            return Response.json(
                { success: false, message: "Account is deactivated" },
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
            isEmailVerified: user.isEmailVerified,
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

