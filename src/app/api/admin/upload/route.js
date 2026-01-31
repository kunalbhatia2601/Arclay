import { uploadImage } from '@/lib/cloudinary';
import { withAdminProtection } from '@/lib/auth';

// POST upload image to Cloudinary
async function postHandler(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const folder = process.env.NEXT_PUBLIC_SITE_NAME || 'ecommerce';

        if (!file) {
            return Response.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert to base64 for Cloudinary
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Determine resource type based on MIME type
        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Upload to Cloudinary
        const result = await uploadImage(base64, {
            folder,
            resource_type: resourceType
        });

        return Response.json({
            success: true,
            image: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        return Response.json(
            { success: false, message: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
