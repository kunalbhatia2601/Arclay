"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyOtp, resendOtp, pendingVerificationEmail } = useUser();

    const email = searchParams.get("email") || pendingVerificationEmail || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cooldown, setCooldown] = useState(0);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            router.push("/login");
        }
    }, [email, router]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError("");

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);

        // Focus last filled input or next empty
        const lastIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }

        setLoading(true);
        setError("");

        const result = await verifyOtp(email, otpCode);

        if (result.success) {
            setSuccess("Email verified successfully! Redirecting...");
            setTimeout(() => router.push("/"), 1500);
        } else {
            setError(result.message || "Verification failed");
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;

        setResending(true);
        setError("");
        setSuccess("");

        const result = await resendOtp(email);

        if (result.success) {
            setSuccess("OTP sent successfully!");
            setCooldown(60); // 60 second cooldown
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } else {
            setError(result.message || "Failed to resend OTP");
        }

        setResending(false);
    };

    if (!email) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="font-serif text-3xl font-bold text-primary">
                            {siteName}
                        </span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-foreground">
                            Verify Your Email
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-primary font-medium">
                            {email}
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-input bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-xl text-sm text-center">
                                {success}
                            </div>
                        )}

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.join("").length !== 6}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </>
                            ) : (
                                "Verify Email"
                            )}
                        </button>

                        {/* Resend Link */}
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Didn't receive the code?
                            </p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || cooldown > 0}
                                className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resending ? (
                                    "Sending..."
                                ) : cooldown > 0 ? (
                                    `Resend in ${cooldown}s`
                                ) : (
                                    "Resend OTP"
                                )}
                            </button>
                        </div>

                        {/* Expiry Note */}
                        <p className="text-xs text-muted-foreground text-center">
                            Code expires in 10 minutes
                        </p>
                    </form>
                </div>

                {/* Back to Login */}
                <div className="text-center mt-6">
                    <Link
                        href="/login"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
