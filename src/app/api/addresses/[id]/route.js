import connectDB from "@/lib/mongodb";
import Address from "@/models/Address";
import { withProtection } from "@/lib/auth";

// GET address by ID
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const address = await Address.findById(id).lean();

        if (!address) {
            return Response.json(
                { success: false, message: "Address not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (address.user.toString() !== req.user._id.toString()) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        return Response.json({
            success: true,
            address
        });
    } catch (error) {
        console.error("Get address error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update address
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const updates = await req.json();

        await connectDB();

        const address = await Address.findById(id);

        if (!address) {
            return Response.json(
                { success: false, message: "Address not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (address.user.toString() !== req.user._id.toString()) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        // Update fields
        const allowedFields = ['label', 'fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'country', 'isDefault'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                address[field] = updates[field];
            }
        });

        await address.save();

        return Response.json({
            success: true,
            message: "Address updated",
            address
        });
    } catch (error) {
        console.error("Update address error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE address
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const address = await Address.findById(id);

        if (!address) {
            return Response.json(
                { success: false, message: "Address not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (address.user.toString() !== req.user._id.toString()) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        await address.deleteOne();

        return Response.json({
            success: true,
            message: "Address deleted"
        });
    } catch (error) {
        console.error("Delete address error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withProtection(getHandler);
export const PUT = withProtection(putHandler);
export const DELETE = withProtection(deleteHandler);
