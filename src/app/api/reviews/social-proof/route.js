import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { withPublicProtection } from "@/lib/auth";

// GET random reviews for social proof (active, stars > 3)
async function getHandler(req) {
    try {
        await connectDB();

        // Get total count of active reviews with stars > 3
        const totalCount = await Review.countDocuments({
            isActive: true,
            stars: { $gt: 3 }
        });

        // Get 3 random active reviews with stars > 3
        const reviews = await Review.aggregate([
            {
                $match: {
                    isActive: true,
                    stars: { $gt: 3 }
                }
            },
            { $sample: { size: 3 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 1,
                    stars: 1,
                    comment: 1,
                    createdAt: 1,
                    userName: '$userInfo.name'
                }
            }
        ]);

        // Calculate average rating of all active reviews
        const avgResult = await Review.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$stars' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const avgRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;
        const totalReviews = avgResult.length > 0 ? avgResult[0].totalReviews : 0;

        return Response.json({
            success: true,
            reviews,
            stats: {
                totalCount,
                totalReviews,
                avgRating: Math.round(avgRating * 10) / 10
            }
        });
    } catch (error) {
        console.error("Get social proof reviews error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withPublicProtection(getHandler);
