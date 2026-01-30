import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductAd from '@/models/ProductAd';
import { withAdminProtection } from '@/lib/auth';

// GET - Fetch single product ad
export const GET = withAdminProtection(async (req, { params }) => {
    try {
        await connectDB();

        const { id } = await params;
        const ad = await ProductAd.findById(id);

        if (!ad) {
            return NextResponse.json(
                { success: false, message: 'Product ad not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            ad
        });
    } catch (error) {
        console.error('Failed to fetch product ad:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch product ad' },
            { status: 500 }
        );
    }
});

// PUT - Update product ad
export const PUT = withAdminProtection(async (req, { params }) => {
    try {
        await connectDB();

        const { id } = await params;
        const body = await req.json();

        const ad = await ProductAd.findById(id);
        if (!ad) {
            return NextResponse.json(
                { success: false, message: 'Product ad not found' },
                { status: 404 }
            );
        }

        // Update fields
        const updateFields = ['title', 'description', 'mediaUrl', 'mediaType', 'linkUrl', 'position', 'order', 'isActive', 'startDate', 'endDate'];

        updateFields.forEach(field => {
            if (body[field] !== undefined) {
                ad[field] = body[field];
            }
        });

        await ad.save();

        return NextResponse.json({
            success: true,
            ad,
            message: 'Product ad updated successfully'
        });
    } catch (error) {
        console.error('Failed to update product ad:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update product ad' },
            { status: 500 }
        );
    }
});

// DELETE - Delete product ad
export const DELETE = withAdminProtection(async (req, { params }) => {
    try {
        await connectDB();

        const { id } = await params;
        const ad = await ProductAd.findByIdAndDelete(id);

        if (!ad) {
            return NextResponse.json(
                { success: false, message: 'Product ad not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product ad deleted successfully'
        });
    } catch (error) {
        console.error('Failed to delete product ad:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete product ad' },
            { status: 500 }
        );
    }
});
