import { listImages, deleteImage } from '@/lib/cloudinary';
import { withAdminProtection } from '@/lib/auth';

// GET list all images from Cloudinary
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const type = searchParams.get('type'); // 'image', 'video', or 'all'

        let resources = [];
        let nextCursor = null;
        let totalCount = 0;

        if (type === 'video') {
            const result = await listImages({
                maxResults: limit,
                nextCursor: cursor || undefined,
                resource_type: 'video'
            });
            resources = result.resources;
            nextCursor = result.next_cursor;
            totalCount = result.rate_limit_remaining; // Approximation
        } else if (type === 'image') {
            const result = await listImages({
                maxResults: limit,
                nextCursor: cursor || undefined,
                resource_type: 'image'
            });
            resources = result.resources;
            nextCursor = result.next_cursor;
            totalCount = result.rate_limit_remaining;
        } else {
            // Fetch both if 'all' or specific type not provided
            // Note: Pagination is tricky with merged results, simple implementation for now
            const [images, videos] = await Promise.all([
                listImages({ maxResults: limit, resource_type: 'image' }),
                listImages({ maxResults: limit, resource_type: 'video' })
            ]);
            resources = [...videos.resources, ...images.resources].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );
            // We lose cursor capability for merged results in this simple implementation
        }

        const images = resources.map(img => ({
            publicId: img.public_id,
            url: img.secure_url,
            width: img.width,
            height: img.height,
            format: img.format,
            createdAt: img.created_at,
            bytes: img.bytes,
            resource_type: img.resource_type
        }));

        return Response.json({
            success: true,
            images,
            nextCursor: nextCursor || null,
            totalCount: totalCount,
        });
    } catch (error) {
        console.error('List gallery error:', error);
        return Response.json(
            { success: false, message: error.message || 'Failed to load gallery' },
            { status: 500 }
        );
    }
}

// DELETE remove image from Cloudinary
async function deleteHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const publicId = searchParams.get('publicId');

        if (!publicId) {
            return Response.json(
                { success: false, message: 'Public ID is required' },
                { status: 400 }
            );
        }

        const result = await deleteImage(publicId);

        if (result.result === 'ok') {
            return Response.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            return Response.json(
                { success: false, message: 'Failed to delete image' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Delete image error:', error);
        return Response.json(
            { success: false, message: error.message || 'Delete failed' },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const DELETE = withAdminProtection(deleteHandler);
