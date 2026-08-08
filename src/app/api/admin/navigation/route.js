import connectDB from "@/lib/mongodb";
import Navigation from "@/models/Navigation";
import { withAdminProtection } from "@/lib/auth";
import { clearNavigationCache } from "@/lib/navigationServer";
import {
    DEFAULT_NAVIGATION, FOOTER_SCHEMA, MOBILE_BAR_SCHEMA, NAVBAR_SCHEMA,
    resolveNavigation, sanitizeNavigation,
} from "@/lib/navigation";

async function getHandler() {
    try {
        await connectDB();
        const doc = await Navigation.getNavigation();

        return Response.json({
            success: true,
            navigation: resolveNavigation({
                navbar: doc.navbar,
                mobileBar: doc.mobileBar,
                footer: doc.footer,
            }),
            defaults: DEFAULT_NAVIGATION,
            schemas: {
                navbar: NAVBAR_SCHEMA,
                mobileBar: MOBILE_BAR_SCHEMA,
                footer: FOOTER_SCHEMA,
            },
        });
    } catch (error) {
        console.error("Get navigation error:", error);
        return Response.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

async function putHandler(req) {
    try {
        const body = await req.json();
        await connectDB();

        const doc = await Navigation.getNavigation();
        const clean = sanitizeNavigation(body.navigation || {});

        if (clean.navbar) doc.navbar = clean.navbar;
        if (clean.mobileBar) doc.mobileBar = clean.mobileBar;
        if (clean.footer) doc.footer = clean.footer;

        await doc.save();
        clearNavigationCache();

        return Response.json({ success: true, message: "Navigation saved" });
    } catch (error) {
        console.error("Update navigation error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: 400 });
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
