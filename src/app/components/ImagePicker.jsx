"use client";

import { useState, useEffect } from "react";

/**
 * ImagePicker component - allows upload, select from gallery, or enter URL
 * @param {Object} props
 * @param {string|string[]} props.value - Current image URL(s)
 * @param {function} props.onChange - Callback when image(s) change
 * @param {boolean} props.multiple - Allow multiple images
 * @param {string} props.label - Label text
 */
export default function ImagePicker({ value, onChange, multiple = false, label = "Image" }) {
    const [mode, setMode] = useState('gallery'); // 'gallery', 'upload', 'url'
    const [showGallery, setShowGallery] = useState(false);
    const [galleryImages, setGalleryImages] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // Normalize value to array
    const images = multiple
        ? (Array.isArray(value) ? value : [])
        : (value ? [value] : []);

    const fetchGallery = async () => {
        setLoadingGallery(true);
        try {
            const res = await fetch('/api/admin/gallery', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setGalleryImages(data.images);
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
                onChange([...images, ...uploadedUrls]);
            } else {
                onChange(uploadedUrls[0]);
            }
        }

        setUploading(false);
        e.target.value = '';
    };

    const handleSelectFromGallery = (url) => {
        if (multiple) {
            if (images.includes(url)) {
                onChange(images.filter(img => img !== url));
            } else {
                onChange([...images, url]);
            }
        } else {
            onChange(url);
            setShowGallery(false);
        }
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;

        if (multiple) {
            onChange([...images, urlInput.trim()]);
        } else {
            onChange(urlInput.trim());
        }
        setUrlInput('');
    };

    const handleRemoveImage = (urlToRemove) => {
        if (multiple) {
            onChange(images.filter(img => img !== urlToRemove));
        } else {
            onChange('');
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">{label}</label>

            {/* Current Images */}
            {images.length > 0 && (
                <div className={`flex ${multiple ? 'flex-wrap gap-2' : ''}`}>
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                            <img
                                src={img}
                                alt=""
                                className={`object-cover rounded-lg border border-border ${multiple ? 'w-20 h-20' : 'w-32 h-32'}`}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(img)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
                            ) : galleryImages.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-4">No images in gallery</p>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {galleryImages.map((img) => (
                                        <button
                                            key={img.publicId}
                                            type="button"
                                            onClick={() => handleSelectFromGallery(img.url)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${images.includes(img.url)
                                                    ? 'border-primary ring-2 ring-primary/30'
                                                    : 'border-transparent hover:border-border'
                                                }`}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
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
                    {uploading ? 'Uploading...' : `Upload ${multiple ? 'Images' : 'Image'}`}
                    <input
                        type="file"
                        multiple={multiple}
                        accept="image/*"
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
                        placeholder="https://example.com/image.jpg"
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
