"use client";

import { useState } from "react";

/**
 * MediaPicker component - allows upload, select from gallery, or enter URL for both images and videos
 * @param {Object} props
 * @param {string|string[]} props.value - Current media URL(s)
 * @param {function} props.onChange - Callback when media(s) change
 * @param {boolean} props.multiple - Allow multiple files
 * @param {string} props.label - Label text
 * @param {'image' | 'video'} props.type - Type of media (image or video)
 */
export default function MediaPicker({ value, onChange, multiple = false, label = "Media", type = 'image' }) {
    const [mode, setMode] = useState('gallery'); // 'gallery', 'upload', 'url'
    const [showGallery, setShowGallery] = useState(false);
    const [galleryMedia, setGalleryMedia] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // Normalize value to array
    const mediaList = multiple
        ? (Array.isArray(value) ? value : [])
        : (value ? [value] : []);

    const fetchGallery = async () => {
        setLoadingGallery(true);
        try {
            // Updated to support type filtering if needed backend side, currently assuming gallery returns all
            // Ideally backend should support ?type=video filtering
            const res = await fetch(`/api/admin/gallery?type=${type}`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                // Client-side filtering if backend doesn't support it yet
                // Assuming gallery returns objects with { url, format, resource_type }
                // If resource_type is missing, we might need to rely on file extension

                if (type === 'all') {
                    setGalleryMedia(data.images);
                } else {
                    const filtered = data.images.filter(item => {
                        const isVideo = item.url.includes('.mp4') || item.url.includes('.webm') || item.format === 'mp4' || item.resource_type === 'video';
                        return type === 'video' ? isVideo : !isVideo;
                    });
                    setGalleryMedia(filtered);
                }
            }
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
        } finally {
            setLoadingGallery(false);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                const data = await res.json();
                if (data.success) {
                    uploadedUrls.push(data.image.url);
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        if (uploadedUrls.length > 0) {
            if (multiple) {
                onChange([...mediaList, ...uploadedUrls]);
            } else {
                onChange(uploadedUrls[0]);
            }
        }

        setUploading(false);
        e.target.value = '';
    };

    const handleSelectFromGallery = (url) => {
        if (multiple) {
            if (mediaList.includes(url)) {
                onChange(mediaList.filter(item => item !== url));
            } else {
                onChange([...mediaList, url]);
            }
        } else {
            onChange(url);
            setShowGallery(false);
        }
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;

        if (multiple) {
            onChange([...mediaList, urlInput.trim()]);
        } else {
            onChange(urlInput.trim());
        }
        setUrlInput('');
    };

    const handleRemoveMedia = (urlToRemove) => {
        if (multiple) {
            onChange(mediaList.filter(item => item !== urlToRemove));
        } else {
            onChange('');
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">{label}</label>

            {/* Current Media Preview */}
            {mediaList.length > 0 && (
                <div className={`flex ${multiple ? 'flex-wrap gap-2' : ''}`}>
                    {mediaList.map((url, idx) => (
                        <div key={idx} className="relative group">
                            {type === 'video' ? (
                                <video
                                    src={url}
                                    className={`object-cover rounded-lg border border-border ${multiple ? 'w-20 h-20' : 'w-32 h-32'}`}
                                    muted
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt=""
                                    className={`object-cover rounded-lg border border-border ${multiple ? 'w-20 h-20' : 'w-32 h-32'}`}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemoveMedia(url)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mode Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => setMode('gallery')}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${mode === 'gallery' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                >
                    📁 Gallery
                </button>
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${mode === 'upload' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                >
                    ⬆️ Upload
                </button>
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${mode === 'url' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                >
                    🔗 URL
                </button>
            </div>

            {/* Mode Content */}
            {mode === 'gallery' && (
                <div>
                    <button
                        type="button"
                        onClick={() => { setShowGallery(!showGallery); if (!showGallery) fetchGallery(); }}
                        className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/70 transition-colors text-sm"
                    >
                        {showGallery ? 'Hide Gallery' : 'Select from Gallery'}
                    </button>

                    {showGallery && (
                        <div className="mt-3 p-3 bg-muted rounded-lg max-h-64 overflow-y-auto">
                            {loadingGallery ? (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : galleryMedia.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-4">No media found in gallery</p>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {galleryMedia.map((item) => (
                                        <button
                                            key={item.publicId || item.url}
                                            type="button"
                                            onClick={() => handleSelectFromGallery(item.url)}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${mediaList.includes(item.url)
                                                ? 'border-primary ring-2 ring-primary/30'
                                                : 'border-transparent hover:border-border'
                                                }`}
                                        >
                                            {type === 'video' ? (
                                                <>
                                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                                        <span className="text-white text-xl">▶️</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {mode === 'upload' && (
                <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer w-fit text-sm">
                    {uploading ? 'Uploading...' : `Upload ${multiple ? (type === 'video' ? 'Videos' : 'Images') : (type === 'video' ? 'Video' : 'Image')}`}
                    <input
                        type="file"
                        multiple={multiple}
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                </label>
            )}

            {mode === 'url' && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder={type === 'video' ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleAddUrl}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );
}
