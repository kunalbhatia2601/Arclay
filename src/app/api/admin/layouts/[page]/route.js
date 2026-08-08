import connectDB from "@/lib/mongodb";
import PageLayout, { PAGE_KEYS, PAGE_SLOTS } from "@/models/PageLayout";
import { withAdminProtection } from "@/lib/auth";
import { clearLayoutCache, sanitizeSlots } from "@/lib/layout";
import { BLOCKS } from "@/lib/blocks/registry";

const MAX_HISTORY = 10;

async function getHandler(req, { params }) {
    try {
        const { page } = await params;
        if (!PAGE_KEYS.includes(page)) {
            return Response.json({ success: false, message: "Unknown page" }, { status: 404 });
        }

        await connectDB();
        const layout = await PageLayout.getPage(page);

        return Response.json({
            success: true,
            page,
            slots: PAGE_SLOTS[page],
            draft: layout.draft || {},
            published: layout.published || {},
            hasUnpublishedChanges: layout.hasUnpublishedChanges,
            publishedAt: layout.publishedAt,
            historyCount: layout.history?.length || 0,
            // Sent so the builder renders its palette and settings forms
            // straight from the registry instead of duplicating it.
            blocks: BLOCKS,
        });
    } catch (error) {
        console.error("Get layout error:", error);
        return Response.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

// Saves the draft. The live site is untouched until publish.
async function putHandler(req, { params }) {
    try {
        const { page } = await params;
        if (!PAGE_KEYS.includes(page)) {
            return Response.json({ success: false, message: "Unknown page" }, { status: 404 });
        }

        const { draft } = await req.json();
        await connectDB();

        const layout = await PageLayout.getPage(page);
        layout.draft = sanitizeSlots(page, draft);
        layout.hasUnpublishedChanges = true;
        layout.updatedBy = req.user._id;
        await layout.save();

        return Response.json({ success: true, message: "Draft saved", draft: layout.draft });
    } catch (error) {
        console.error("Save draft error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 400 }
        );
    }
}

// publish  — copy draft over published, keeping a rollback snapshot
// revert   — throw the draft away and start again from what is live
// rollback — restore the previous published version
async function postHandler(req, { params }) {
    try {
        const { page } = await params;
        if (!PAGE_KEYS.includes(page)) {
            return Response.json({ success: false, message: "Unknown page" }, { status: 404 });
        }

        const { action } = await req.json();
        await connectDB();
        const layout = await PageLayout.getPage(page);

        if (action === "publish") {
            if (layout.published && Object.keys(layout.published).length) {
                layout.history = [
                    {
                        slots: layout.published,
                        publishedAt: layout.publishedAt || new Date(),
                        publishedBy: layout.updatedBy,
                    },
                    ...(layout.history || []),
                ].slice(0, MAX_HISTORY);
            }

            layout.published = sanitizeSlots(page, layout.draft);
            layout.publishedAt = new Date();
            layout.hasUnpublishedChanges = false;
            layout.updatedBy = req.user._id;
            await layout.save();
            clearLayoutCache(page);

            return Response.json({ success: true, message: "Published" });
        }

        if (action === "revert") {
            layout.draft = layout.published || {};
            layout.hasUnpublishedChanges = false;
            await layout.save();
            return Response.json({ success: true, message: "Draft reset to the live version", draft: layout.draft });
        }

        if (action === "rollback") {
            const previous = layout.history?.[0];
            if (!previous) {
                return Response.json(
                    { success: false, message: "No previous version to roll back to" },
                    { status: 400 }
                );
            }

            layout.published = previous.slots;
            layout.draft = previous.slots;
            layout.history = layout.history.slice(1);
            layout.publishedAt = new Date();
            layout.hasUnpublishedChanges = false;
            await layout.save();
            clearLayoutCache(page);

            return Response.json({ success: true, message: "Rolled back to the previous version" });
        }

        return Response.json({ success: false, message: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Layout action error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 400 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
export const POST = withAdminProtection(postHandler);
