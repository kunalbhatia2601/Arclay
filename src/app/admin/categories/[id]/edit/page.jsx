"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ImagePicker from "@/app/components/ImagePicker";

export default function EditCategoryPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        image: "",
        description: "",
        isActive: true,
    });

    useEffect(() => {
        fetchCategory();
    }, [id]);

    const fetchCategory = async () => {
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setFormData({
                    name: data.category.name || "",
                    image: data.category.image || "",
                    description: data.category.description || "",
                    isActive: data.category.isActive,
                });
            } else {
                setError("Category not found");
            }
        } catch (error) {
            console.error("Fetch category error:", error);
            setError("Failed to load category");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/admin/categories");
            } else {
                setError(data.message || "Failed to update category");
            }
        } catch (error) {
            console.error("Update category error:", error);
            setError("Failed to update category");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            {/* Page Header */}
            <div className="mb-8">
                <Link
                    href="/admin/categories"
                    className="text-muted-foreground hover:text-primary transition-colors text-sm mb-4 inline-block"
                >
                    ← Back to Categories
                </Link>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    Edit Category
                </h1>
                <p className="text-muted-foreground mt-1">
                    Update category details
                </p>
            </div>

            {/* Form */}
            <div className="bg-card rounded-2xl p-6 border border-border">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Signature Pickles"
                        />
                    </div>

                    <div>
                        <ImagePicker
                            value={formData.image}
                            onChange={(image) => setFormData({ ...formData, image })}
                            multiple={false}
                            label="Category Image"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Describe this category..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="text-foreground">
                            Active (visible on store)
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Link href="/admin/categories">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8"
                            >
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
