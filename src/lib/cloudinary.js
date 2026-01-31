import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder for all uploads
const UPLOAD_FOLDER = process.env.NEXT_PUBLIC_SITE_NAME || 'ecommerce';

/**
 * Upload a file to Cloudinary
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export async function uploadImage(file, options = {}) {
    const resourceType = options.resource_type || 'image';

    const uploadOptions = {
        folder: UPLOAD_FOLDER,
        resource_type: resourceType,
        ...options,
    };

    // Only apply image optimizations if we are strictly uploading an image
    if (resourceType === 'image') {
        uploadOptions.format = 'webp';
        uploadOptions.transformation = [
            {
                quality: 'auto:good',
                fetch_format: 'webp',
            }
        ];
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        // Handle base64 or buffer
        if (typeof file === 'string') {
            // It's a base64 string
            cloudinary.uploader.upload(file, uploadOptions)
                .then(resolve)
                .catch(reject);
        } else {
            // It's a buffer
            uploadStream.end(file);
        }
    });
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Delete result
 */
export async function deleteImage(publicId) {
    return cloudinary.uploader.destroy(publicId);
}

/**
 * Get all images from Cloudinary folder
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - List of images
 */
export async function listImages(options = {}) {
    const { folder = UPLOAD_FOLDER, maxResults = 100, nextCursor = null, resource_type = 'image' } = options;

    return cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
        next_cursor: nextCursor,
        resource_type: resource_type,
    });
}

export default cloudinary;
