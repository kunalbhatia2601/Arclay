import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { generateOTP, getOTPExpiry, sendOTPEmail } from "@/lib/mailer";

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return Response.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user
        const user = await User.findOne({ email });

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

        // Get settings
        const settings = await Settings.getSettings();

        if (!settings.mail?.isEnabled || !settings.mail?.email || !settings.mail?.password || !settings.mail?.host) {
            return Response.json(
                { success: false, message: "Email service not configured" },
                { status: 500 }
            );
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Update user with new OTP
        await User.findByIdAndUpdate(user._id, {
            otp: { code: otp, expiresAt: otpExpiry }
        });

        // Send OTP email
        const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";
        const emailResult = await sendOTPEmail(email, otp, settings.mail, siteName);

        if (!emailResult.success) {
            return Response.json(
                { success: false, message: "Failed to send verification email. Please try again." },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Resend OTP error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
