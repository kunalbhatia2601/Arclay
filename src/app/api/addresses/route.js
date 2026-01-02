import connectDB from "@/lib/mongodb";
import Address from "@/models/Address";
import { withProtection } from "@/lib/auth";

// GET user's addresses
async function getHandler(req) {
    try {
        await connectDB();

        const addresses = await Address.find({ user: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();

        return Response.json({
            success: true,
            addresses
        });
    } catch (error) {
        console.error("Get addresses error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create new address
async function postHandler(req) {
    try {
        const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = await req.json();

        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            return Response.json(
                { success: false, message: "Required fields missing" },
                { status: 400 }
            );
        }

        await connectDB();

        const address = await Address.create({
            user: req.user._id,
            label: label || 'Home',
            fullName,
            phone,
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state,
            pincode,
            country: country || 'India',
            isDefault: isDefault || false
        });

        return Response.json({
            success: true,
            message: "Address created",
            address
        });
    } catch (error) {
        console.error("Create address error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withProtection(getHandler);
export const POST = withProtection(postHandler);
