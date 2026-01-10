"use client";

import { useState, useRef } from "react";

/**
 * ImageGeneratorModal - AI image generation using Gemini
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {function} props.onImagesGenerated - Callback with generated image URLs
 */
export default function ImageGeneratorModal({ isOpen, onClose, onImagesGenerated }) {
    const [prompt, setPrompt] = useState("");
    const [referenceImages, setReferenceImages] = useState([]);
    const [numImages, setNumImages] = useState(1);
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [generatedImages, setGeneratedImages] = useState([]);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const aspectRatios = [
        { value: "1:1", label: "Square (1:1)" },
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "9:16", label: "Portrait (9:16)" },
        { value: "4:3", label: "Standard (4:3)" },
        { value: "3:4", label: "Portrait (3:4)" },
    ];

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Max 4 reference images
        const remaining = 4 - referenceImages.length;
        const toProcess = files.slice(0, remaining);

        for (const file of toProcess) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setReferenceImages(prev => [...prev, {
                    base64: event.target.result,
                    mimeType: file.type,
                    name: file.name
                }]);
            };
            reader.readAsDataURL(file);
        }

        e.target.value = '';
    };

    const removeReferenceImage = (index) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        setGenerating(true);
        setError("");
        setGeneratedImages([]);
        setProgress(0);

        const allGenerated = [];

        // Loop for number of images requested
        for (let i = 0; i < numImages; i++) {
            setProgress(Math.round(((i) / numImages) * 100));

            try {
                const res = await fetch('/api/admin/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        prompt,
                        referenceImages,
                        aspectRatio
                    })
                });

                const data = await res.json();

                if (data.success && data.images) {
                    allGenerated.push(...data.images);
                    setGeneratedImages([...allGenerated]);
                } else if (!data.success) {
                    setError(data.message || 'Generation failed');
                    break;
                }
            } catch (err) {
                console.error('Generation error:', err);
                setError('Failed to generate image');
                break;
            }
        }

        setProgress(100);
        setGenerating(false);
    };

    const handleAddToSelection = () => {
        if (onImagesGenerated && generatedImages.length > 0) {
            onImagesGenerated(generatedImages.map(img => img.url));
        }
        handleClose();
    };

    const handleClose = () => {
        setPrompt("");
        setReferenceImages([]);
        setGeneratedImages([]);
        setError("");
        setProgress(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-bold text-foreground">
                        ✨ AI Image Generator
                    </h2>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Prompt *
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Describe the image you want to create..."
                            disabled={generating}
                        />
                    </div>

                    {/* Reference Images */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Reference Images (Optional, max 4)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {referenceImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={img.base64}
                                        alt={`Reference ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg border border-border"
                                    />
                                    <button
                                        onClick={() => removeReferenceImage(idx)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {referenceImages.length < 4 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                    disabled={generating}
                                >
                                    +
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Number of Images
                            </label>
                            <select
                                value={numImages}
                                onChange={(e) => setNumImages(parseInt(e.target.value))}
                                className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={generating}
                            >
                                {[1, 2, 3, 4].map(n => (
                                    <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Aspect Ratio
                            </label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={generating}
                            >
                                {aspectRatios.map(ar => (
                                    <option key={ar.value} value={ar.value}>{ar.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim()}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generating ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Generating... {progress}%
                            </span>
                        ) : (
                            '✨ Generate Image'
                        )}
                    </button>

                    {/* Progress Bar */}
                    {generating && (
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* Generated Images */}
                    {generatedImages.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Generated Images ({generatedImages.length})
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                        <img
                                            src={img.url}
                                            alt={`Generated ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddToSelection}
                                className="mt-3 w-full py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/70 transition-colors"
                            >
                                ✓ Add {generatedImages.length} Image{generatedImages.length > 1 ? 's' : ''} to Selection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
