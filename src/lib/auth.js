import jwt from 'jsonwebtoken';
import connectDB from './mongodb';
import User from '@/models/User';
import Settings from '@/models/Settings';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

// Settings cache with TTL
let settingsCache = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute

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

// Get settings with caching
export async function getSettings() {
    const now = Date.now();

    // Return cached settings if still valid
    if (settingsCache && (now - settingsCacheTime) < SETTINGS_CACHE_TTL) {
        return settingsCache;
    }

    await connectDB();
    settingsCache = await Settings.getSettings();
    settingsCacheTime = now;

    return settingsCache;
}

// Clear settings cache (call when settings are updated)
export function clearSettingsCache() {
    settingsCache = null;
    settingsCacheTime = 0;
}

// Maintenance mode check middleware
export function withMaintenance(handler) {
    return async (req, context) => {
        try {
            const settings = await getSettings();

            // Allow admin users to bypass maintenance mode
            if (settings.isMaintenance) {
                const cookieStore = await cookies();
                const token = cookieStore.get('token')?.value;

                if (token) {
                    const user = await getUserFromToken(token);
                    if (user && user.role === 'admin') {
                        req.user = user;
                        req.settings = settings;
                        return handler(req, context);
                    }
                }

                return Response.json(
                    {
                        success: false,
                        message: 'Site is under maintenance. Please check back later.'
                    },
                    { status: 503 }
                );
            }

            req.settings = settings;
            return handler(req, context);
        } catch (error) {
            console.error('Maintenance check error:', error);
            return handler(req, context);
        }
    };
}

// Demo mode check middleware (blocks non-GET requests)
export function withDemo(handler) {
    return async (req, context) => {
        try {
            const settings = await getSettings();

            if (settings.isDemo && req.method !== 'GET') {
                return Response.json(
                    {
                        success: false,
                        message: 'Demo mode is active. Modifications are not allowed.'
                    },
                    { status: 403 }
                );
            }

            req.settings = settings;
            return handler(req, context);
        } catch (error) {
            console.error('Demo check error:', error);
            return handler(req, context);
        }
    };
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

// Composite middleware: Auth + Maintenance + Demo check
export function withProtection(handler) {
    return withMaintenance(withDemo(withAuth(handler)));
}

// Composite middleware: Admin + Maintenance check (no demo check to allow admin modifications)
export function withAdminProtection(handler) {
    return withMaintenance(withAdmin(handler));
}

// Composite middleware: Optional auth + Maintenance check
export function withPublicProtection(handler) {
    return withMaintenance(optionalAuth(handler));
}
