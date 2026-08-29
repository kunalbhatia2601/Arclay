import { uploadImage } from '@/lib/cloudinary';
import { compressImage } from '@/lib/imageCompress';
import { withAdminProtection } from '@/lib/auth';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // raw file, before compression

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
        if (file.size > MAX_UPLOAD_BYTES) {
            return Response.json(
                { success: false, message: `File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Images are resized + recompressed to WebP before they ever leave
        // this route — same quality, far fewer bytes on the wire and in
        // Cloudinary storage. Videos pass through untouched.
        let uploadBuffer = buffer;
        let originalBytes = buffer.length;
        if (!isVideo) {
            try {
                uploadBuffer = await compressImage(buffer);
            } catch (err) {
                console.error('Image compression failed, uploading original:', err);
            }
        }

        const result = await uploadImage(uploadBuffer, {
            folder,
            resource_type: resourceType,
        });

        return Response.json({
            success: true,
            image: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
                originalBytes,
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
