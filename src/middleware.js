import { NextResponse } from 'next/server';

// Methods that cannot change server state, so they need no CSRF protection.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Requests that legitimately arrive without a browser Origin from a third-party
// server (payment/shipping callbacks). They authenticate via their own signature.
const WEBHOOK_PREFIXES = ['/api/webhooks/'];

function buildAllowedOrigins(req) {
    const allowed = new Set();

    const host = req.headers.get('host');
    if (host) {
        allowed.add(`https://${host}`);
        allowed.add(`http://${host}`);
    }

    const configured =
        process.env.ALLOWED_ORIGINS ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        '';

    configured
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean)
        .forEach((o) => allowed.add(o));

    return allowed;
}

function originOf(value) {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

export function middleware(req) {
    if (SAFE_METHODS.has(req.method)) {
        return NextResponse.next();
    }

    const { pathname } = req.nextUrl;
    if (WEBHOOK_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    const originHeader = req.headers.get('origin');
    const refererHeader = req.headers.get('referer');

    // The Flutter app (and other non-browser clients) send neither header.
    // Browsers always attach Origin to cross-site state-changing requests and a
    // page cannot suppress it, so an absent Origin is never a browser CSRF.
    if (!originHeader && !refererHeader) {
        return NextResponse.next();
    }

    const candidate = originHeader
        ? originOf(originHeader) || originHeader.replace(/\/$/, '')
        : originOf(refererHeader);

    if (!candidate || !buildAllowedOrigins(req).has(candidate)) {
        return NextResponse.json(
            { success: false, message: 'Request blocked: untrusted origin' },
            { status: 403 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
