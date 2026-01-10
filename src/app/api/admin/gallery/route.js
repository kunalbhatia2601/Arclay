import { listImages, deleteImage } from '@/lib/cloudinary';
import { withAdminProtection } from '@/lib/auth';

// GET list all images from Cloudinary
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');
        const limit = parseInt(searchParams.get('limit')) || 50;

        const result = await listImages({
            maxResults: limit,
            nextCursor: cursor || undefined,
        });

        const images = result.resources.map(img => ({
            publicId: img.public_id,
            url: img.secure_url,
            width: img.width,
            height: img.height,
            format: img.format,
            createdAt: img.created_at,
            bytes: img.bytes,
        }));

        return Response.json({
            success: true,
            images,
            nextCursor: result.next_cursor || null,
            totalCount: result.rate_limit_remaining,
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
