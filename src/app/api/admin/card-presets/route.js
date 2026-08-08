import connectDB from "@/lib/mongodb";
import CardPreset from "@/models/CardPreset";
import { withAdminProtection } from "@/lib/auth";
import { clearCardPresetCache } from "@/lib/cardPresetServer";
import { CARD_SCHEMA, DEFAULT_CARD, resolveCardPreset } from "@/lib/cardPreset";

async function getHandler() {
    try {
        await connectDB();
        let presets = await CardPreset.find().sort({ isDefault: -1, name: 1 }).lean();

        // Seed the first preset from the schema defaults so the editor always
        // has something to open. Upserted on the name rather than created
        // outright: two admin tabs loading at once would otherwise both see an
        // empty collection and each insert their own copy.
        if (presets.length === 0) {
            await CardPreset.findOneAndUpdate(
                { name: "Default card" },
                { $setOnInsert: { name: "Default card", isDefault: true, settings: { ...DEFAULT_CARD } } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            presets = await CardPreset.find().sort({ isDefault: -1, name: 1 }).lean();
        }

        return Response.json({
            success: true,
            presets: presets.map(p => ({ ...p, settings: resolveCardPreset(p) })),
            schema: CARD_SCHEMA,
            defaults: DEFAULT_CARD,
        });
    } catch (error) {
        console.error("Get card presets error:", error);
        return Response.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

async function postHandler(req) {
    try {
        const { name, settings, isDefault } = await req.json();
        if (!name?.trim()) {
            return Response.json({ success: false, message: "Name is required" }, { status: 400 });
        }

        await connectDB();
        const preset = await CardPreset.create({
            name: name.trim(),
            isDefault: !!isDefault,
            settings: sanitize(settings),
        });

        clearCardPresetCache();
        return Response.json({ success: true, message: "Preset created", preset });
    } catch (error) {
        console.error("Create card preset error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: 400 });
    }
}

// Only keys the schema declares are stored, so a stale client cannot write
// arbitrary options onto a preset.
function sanitize(settings = {}) {
    const clean = {};
    for (const field of CARD_SCHEMA) {
        if (settings[field.key] !== undefined) clean[field.key] = settings[field.key];
    }
    return clean;
}

export const GET = withAdminProtection(getHandler);
export const POST = withAdminProtection(postHandler);
