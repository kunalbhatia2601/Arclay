"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                setPendingVerificationEmail(null);
                return { success: true, user: data.user };
            } else if (data.requiresVerification) {
                setPendingVerificationEmail(data.email);
                return {
                    success: false,
                    requiresVerification: true,
                    email: data.email,
                    message: data.message
                };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: "Login failed" };
        }
    };

    const register = async (name, email, password, phone = "") => {
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ name, email, password, phone }),
            });

            const data = await res.json();

            if (data.success) {
                if (data.requiresVerification) {
                    setPendingVerificationEmail(data.email);
                    return {
                        success: true,
                        requiresVerification: true,
                        email: data.email,
                        message: data.message
                    };
                } else {
                    setUser(data.user);
                    return { success: true, user: data.user };
                }
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Register error:", error);
            return { success: false, message: "Registration failed" };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                setPendingVerificationEmail(null);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Verify OTP error:", error);
            return { success: false, message: "Verification failed" };
        }
    };

    const resendOtp = async (email) => {
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Resend OTP error:", error);
            return { success: false, message: "Failed to resend OTP" };
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            setUser(null);
            setPendingVerificationEmail(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const refreshUser = () => {
        fetchUser();
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        verifyOtp,
        resendOtp,
        pendingVerificationEmail,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export default UserContext;

