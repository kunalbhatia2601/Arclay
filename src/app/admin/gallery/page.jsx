"use client";

import { useState, useEffect, useCallback } from "react";
import ImageGeneratorModal from "@/app/components/ImageGeneratorModal";
import { toast } from "react-toastify";

export default function GalleryPage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [copiedId, setCopiedId] = useState(null);
    const [showAIGenerator, setShowAIGenerator] = useState(false);

    const fetchImages = useCallback(async (cursor = null) => {
        try {
            const url = cursor
                ? `/api/admin/gallery?cursor=${cursor}`
                : '/api/admin/gallery';
            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();

            if (data.success) {
                if (cursor) {
                    setImages(prev => [...prev, ...data.images]);
                } else {
                    setImages(data.images);
                }
                setNextCursor(data.nextCursor);
            }
        } catch (error) {
            console.error('Failed to fetch images:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

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
                    setImages(prev => [{
                        publicId: data.image.publicId,
                        url: data.image.url,
                        width: data.image.width,
                        height: data.image.height,
                        format: data.image.format,
                        createdAt: new Date().toISOString(),
                    }, ...prev]);
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        setUploading(false);
        e.target.value = '';
    };

    const handleDelete = async (publicId) => {
        if (!confirm('Delete this image? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/admin/gallery?publicId=${encodeURIComponent(publicId)}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await res.json();
            if (data.success) {
                setImages(prev => prev.filter(img => img.publicId !== publicId));
                setSelectedImages(prev => prev.filter(id => id !== publicId));
            } else {
                toast.error(data.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const copyToClipboard = async (url, publicId) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(publicId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const toggleSelect = (publicId) => {
        setSelectedImages(prev =>
            prev.includes(publicId)
                ? prev.filter(id => id !== publicId)
                : [...prev, publicId]
        );
    };

    const deleteSelected = async () => {
        if (selectedImages.length === 0) return;
        if (!confirm(`Delete ${selectedImages.length} selected image(s)?`)) return;

        for (const publicId of selectedImages) {
            await handleDelete(publicId);
        }
        setSelectedImages([]);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">Gallery</h1>
                    <p className="text-muted-foreground mt-1">
                        {images.length} images in Cloudinary
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedImages.length > 0 && (
                        <button
                            onClick={deleteSelected}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                        >
                            Delete {selectedImages.length} Selected
                        </button>
                    )}
                    <div className="flex rounded-lg overflow-hidden border border-border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                            ▦
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                            ☰
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAIGenerator(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                        ✨ Create with AI
                    </button>
                    <label className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                        {uploading ? 'Uploading...' : '+ Upload Images'}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* AI Generator Modal */}
            <ImageGeneratorModal
                isOpen={showAIGenerator}
                onClose={() => setShowAIGenerator(false)}
                onImagesGenerated={(newUrls) => {
                    // Add generated images to the gallery
                    const newImages = newUrls.map(url => ({
                        publicId: url.split('/').pop().split('.')[0],
                        url,
                        format: 'png',
                        createdAt: new Date().toISOString()
                    }));
                    setImages(prev => [...newImages, ...prev]);
                }}
            />

            {/* Gallery Grid/List */}
            {images.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                    <p className="text-4xl mb-4">🖼️</p>
                    <p className="text-muted-foreground">No images yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload images to get started</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map((image) => (
                        <div
                            key={image.publicId}
                            className={`group relative aspect-square bg-muted rounded-xl overflow-hidden border-2 transition-all ${selectedImages.includes(image.publicId)
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-transparent hover:border-border'
                                }`}
                        >
                            <img
                                src={image.url}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(image.url, image.publicId)}
                                    className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100"
                                >
                                    {copiedId === image.publicId ? '✓ Copied!' : 'Copy URL'}
                                </button>
                                <button
                                    onClick={() => handleDelete(image.publicId)}
                                    className="px-3 py-1.5 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90"
                                >
                                    Delete
                                </button>
                            </div>
                            {/* Select checkbox */}
                            <button
                                onClick={() => toggleSelect(image.publicId)}
                                className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedImages.includes(image.publicId)
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                {selectedImages.includes(image.publicId) && '✓'}
                            </button>
                            {/* Format badge */}
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded uppercase">
                                {image.format}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="w-10 p-3"></th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Preview</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Size</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Format</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Dimensions</th>
                                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {images.map((image) => (
                                <tr key={image.publicId} className="hover:bg-muted/50">
                                    <td className="p-3">
                                        <button
                                            onClick={() => toggleSelect(image.publicId)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedImages.includes(image.publicId)
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border-gray-300'
                                                }`}
                                        >
                                            {selectedImages.includes(image.publicId) && '✓'}
                                        </button>
                                    </td>
                                    <td className="p-3">
                                        <img src={image.url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                    </td>
                                    <td className="p-3">
                                        <p className="text-sm font-mono truncate max-w-[200px]">
                                            {image.publicId.split('/').pop()}
                                        </p>
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                        {image.bytes ? formatBytes(image.bytes) : '-'}
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 bg-muted rounded text-xs uppercase">
                                            {image.format}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                        {image.width} × {image.height}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => copyToClipboard(image.url, image.publicId)}
                                                className="px-3 py-1 text-sm bg-muted rounded-lg hover:bg-muted/70"
                                            >
                                                {copiedId === image.publicId ? '✓ Copied' : 'Copy URL'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(image.publicId)}
                                                className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Load More */}
            {nextCursor && (
                <div className="text-center">
                    <button
                        onClick={() => fetchImages(nextCursor)}
                        className="px-6 py-2 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
