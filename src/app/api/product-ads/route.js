import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductAd from '@/models/ProductAd';
import { withPublicProtection } from '@/lib/auth';

// GET - Fetch active product ads for public display
export const GET = withPublicProtection(async (req) => {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const position = searchParams.get('position');

        const now = new Date();

        // Build query for active and scheduled ads
        const query = {
            isActive: true,
            $or: [
                // No date restrictions
                { startDate: null, endDate: null },
                // Started but no end date
                { startDate: { $lte: now }, endDate: null },
                // No start date but hasn't ended
                { startDate: null, endDate: { $gte: now } },
                // Within date range
                { startDate: { $lte: now }, endDate: { $gte: now } }
            ]
        };

        if (position) {
            query.position = position;
        }

        const ads = await ProductAd.find(query)
            .select('title description mediaUrl mediaType linkUrl position order')
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
