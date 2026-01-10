import { withAdminProtection, getSettings } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { GoogleGenAI } from '@google/genai';

// POST generate image using Gemini AI
async function postHandler(req) {
    try {
        // Check if Gemini AI is enabled in settings
        const settings = await getSettings();
        
        if (!settings.gemini_ai?.isEnabled || !settings.gemini_ai?.apiKey) {
            return Response.json(
                { success: false, message: 'AI image generation is not enabled. Configure Gemini API key in Settings.' },
                { status: 400 }
            );
        }

        const { prompt, referenceImages = [], aspectRatio = '1:1' } = await req.json();

        if (!prompt || !prompt.trim()) {
            return Response.json(
                { success: false, message: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Initialize Gemini AI client
        const ai = new GoogleGenAI({ apiKey: settings.gemini_ai.apiKey });

        // Build contents array - text first, then images
        const contents = [
            { text: prompt }
        ];
        
        // Add reference images if provided (max 4)
        const validImages = referenceImages.slice(0, 4);
        for (const img of validImages) {
            if (img.base64 && img.mimeType) {
                contents.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.base64.replace(/^data:image\/\w+;base64,/, '')
                    }
                });
            }
        }

        // Call Gemini API using the SDK
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: contents,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: aspectRatio,
                },
            },
        });

        // Extract generated images
        const generatedImages = [];
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                // Upload to Cloudinary
                const imageData = part.inlineData.data;
                const base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${imageData}`;
                
                try {
                    const uploadResult = await uploadImage(base64Image, {
                        folder: process.env.NEXT_PUBLIC_SITE_NAME || 'ecommerce'
                    });

                    generatedImages.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        width: uploadResult.width,
                        height: uploadResult.height
                    });
                } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                }
            }
        }

        if (generatedImages.length === 0) {
            return Response.json(
                { success: false, message: 'No images were generated. Try a different prompt.' },
                { status: 400 }
            );
        }

        return Response.json({
            success: true,
            images: generatedImages,
            message: `Generated ${generatedImages.length} image(s)`
        });
    } catch (error) {
        return Response.json(
            { success: false, message: JSON.parse(error.message).error.message },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
