import connectDB from "@/lib/mongodb";
import Theme, { DEFAULT_TOKENS, TOKEN_GROUPS, TOKEN_MAP } from "@/models/Theme";
import { withAdminProtection } from "@/lib/auth";
import { clearThemeCache } from "@/lib/theme";

async function getHandler() {
    try {
        await connectDB();
        const theme = await Theme.getTheme();

        const stored = theme.tokens instanceof Map
            ? Object.fromEntries(theme.tokens)
            : (theme.tokens || {});

        // Send the full resolved set plus the definitions, so the editor can
        // render itself without duplicating the token list on the client.
        const tokens = { ...DEFAULT_TOKENS };
        for (const [key, value] of Object.entries(stored)) {
            if (key in TOKEN_MAP && value) tokens[key] = value;
        }

        return Response.json({
            success: true,
            tokens,
            defaults: DEFAULT_TOKENS,
            groups: TOKEN_GROUPS,
            customCss: theme.customCss || "",
        });
    } catch (error) {
        console.error("Get theme error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

async function putHandler(req) {
    try {
        const { tokens, customCss } = await req.json();
        await connectDB();

        const theme = await Theme.getTheme();

        if (tokens && typeof tokens === "object") {
            const next = new Map();
            for (const [key, value] of Object.entries(tokens)) {
                // Unknown keys are dropped: the token list is the contract, and
                // anything else would never be rendered anyway.
                if (!(key in TOKEN_MAP)) continue;
                if (value === null || value === "" || value === DEFAULT_TOKENS[key]) continue;
                next.set(key, String(value).slice(0, 200));
            }
            theme.tokens = next;
        }

        if (customCss !== undefined) {
            theme.customCss = String(customCss || "").slice(0, 20000);
        }

        await theme.save();
        clearThemeCache();

        return Response.json({ success: true, message: "Theme saved" });
    } catch (error) {
        console.error("Update theme error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 400 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
