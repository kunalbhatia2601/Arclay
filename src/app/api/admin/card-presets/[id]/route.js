import connectDB from "@/lib/mongodb";
import CardPreset from "@/models/CardPreset";
import { withAdminProtection } from "@/lib/auth";
import { clearCardPresetCache } from "@/lib/cardPresetServer";
import { CARD_SCHEMA } from "@/lib/cardPreset";

function sanitize(settings = {}) {
    const clean = {};
    for (const field of CARD_SCHEMA) {
        if (settings[field.key] !== undefined) clean[field.key] = settings[field.key];
    }
    return clean;
}

async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const { name, settings, isDefault } = await req.json();

        await connectDB();
        const preset = await CardPreset.findById(id);
        if (!preset) {
            return Response.json({ success: false, message: "Preset not found" }, { status: 404 });
        }

        if (name !== undefined) preset.name = String(name).trim();
        if (settings !== undefined) preset.settings = sanitize(settings);
        if (isDefault !== undefined) preset.isDefault = !!isDefault;

        await preset.save();
        clearCardPresetCache();

        return Response.json({ success: true, message: "Preset saved", preset });
    } catch (error) {
        console.error("Update card preset error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: 400 });
    }
}

async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();

        const preset = await CardPreset.findById(id);
        if (!preset) {
            return Response.json({ success: false, message: "Preset not found" }, { status: 404 });
        }

        // Removing the default would leave blocks with nothing to fall back to.
        if (preset.isDefault) {
            return Response.json(
                { success: false, message: "Make another preset the default before deleting this one" },
                { status: 400 }
            );
        }

        await preset.deleteOne();
        clearCardPresetCache();

        return Response.json({ success: true, message: "Preset deleted" });
    } catch (error) {
        console.error("Delete card preset error:", error);
        return Response.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export const PUT = withAdminProtection(putHandler);
export const DELETE = withAdminProtection(deleteHandler);
