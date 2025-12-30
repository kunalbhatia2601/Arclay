import jwt from 'jsonwebtoken';
import connectDB from './mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT token
export function generateToken(userId) {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: '7d'
    });
}

// Verify JWT token
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Get user from token (for server-side)
export async function getUserFromToken(token) {
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) return null;

    return user;
}

// withAuth - Requires authentication
export function withAuth(handler) {
    return async (req, context) => {
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('token')?.value;

            if (!token) {
                return Response.json(
                    { success: false, message: 'Authentication required' },
                    { status: 401 }
                );
            }

            const user = await getUserFromToken(token);

            if (!user) {
                return Response.json(
                    { success: false, message: 'Invalid or expired token' },
                    { status: 401 }
                );
            }

            // Attach user to request
            req.user = user;
            return handler(req, context);
        } catch (error) {
            console.error('Auth middleware error:', error);
            return Response.json(
                { success: false, message: 'Authentication failed' },
                { status: 401 }
            );
        }
    };
}

// optionalAuth - Attaches user if available, continues otherwise
export function optionalAuth(handler) {
    return async (req, context) => {
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('token')?.value;

            if (token) {
                const user = await getUserFromToken(token);
                if (user) {
                    req.user = user;
                }
            }

            return handler(req, context);
        } catch (error) {
            // Continue without user on error
            return handler(req, context);
        }
    };
}

// withAdmin - Requires admin role
export function withAdmin(handler) {
    return withAuth(async (req, context) => {
        if (req.user.role !== 'admin') {
            return Response.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        return handler(req, context);
    });
}
