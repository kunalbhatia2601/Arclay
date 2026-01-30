import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductAd from '@/models/ProductAd';
import { withAdminProtection } from '@/lib/auth';

// GET - Fetch all product ads (admin)
export const GET = withAdminProtection(async (req) => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const isActive = searchParams.get('isActive');
        const position = searchParams.get('position');

        // Build query
        const query = {};
        if (isActive !== null && isActive !== '') {
            query.isActive = isActive === 'true';
        }
        if (position) {
            query.position = position;
        }

        const ads = await ProductAd.find(query)
            .sort({ order: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            ads
        });
    } catch (error) {
        console.error('Failed to fetch product ads:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch product ads' },
            { status: 500 }
        );
    }
});

// POST - Create new product ad
export const POST = withAdminProtection(async (req) => {
    try {
        await connectDB();

        const body = await req.json();
        const { title, description, mediaUrl, mediaType, linkUrl, position, order, isActive, startDate, endDate } = body;

        // Validation
        if (!title || !mediaUrl) {
            return NextResponse.json(
                { success: false, message: 'Title and media URL are required' },
                { status: 400 }
            );
        }

        const ad = await ProductAd.create({
            title,
            description: description || '',
            mediaUrl,
            mediaType: mediaType || 'image',
            linkUrl: linkUrl || '',
            position: position || 'banner',
            order: order || 0,
            isActive: isActive !== false,
            startDate: startDate || null,
            endDate: endDate || null
        });

        return NextResponse.json({
            success: true,
            ad,
            message: 'Product ad created successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to create product ad:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create product ad' },
            { status: 500 }
        );
    }
});
