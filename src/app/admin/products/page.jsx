"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BulkUploadModal from "./BulkUploadModal";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Package, 
    Plus, 
    Upload, 
    Search, 
    Star, 
    Eye, 
    Pencil, 
    Trash2, 
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Filter,
    Boxes,
    Printer
} from "lucide-react";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [categories, setCategories] = useState([]);

    // Debounce search value
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [pagination.page, debouncedSearch]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/products?limit=1");
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10,
                search: debouncedSearch,
            });
            const res = await fetch(`/api/admin/products?${params}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
                toast.success("Product deleted successfully");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete product");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
            }
        } catch (error) {
            console.error("Toggle status failed:", error);
        }
    };

    const toggleFeatured = async (id, currentFeatured) => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isFeatured: !currentFeatured }),
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p =>
                    p._id === id ? { ...p, isFeatured: !currentFeatured } : p
                ));
            }
        } catch (error) {
            console.error("Toggle featured failed:", error);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="font-serif text-[42px] font-bold text-[#2A2F25] leading-tight mb-2">
                        Inventory
                    </h1>
                    <p className="text-[#767B71] font-medium flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#869661]" />
                        Managing <span className="text-[#4A5D23] font-bold">{pagination.total}</span> total products
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="flex items-center gap-2 px-6 py-3 border-2 border-[#869661]/30 text-[#4A5D23] rounded-2xl font-bold uppercase tracking-widest text-[13px] hover:bg-[#869661]/10 transition-all active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Bulk Upload</span>
                    </button>
                    <Link href="/admin/products/new">
                        <button className="flex items-center gap-2 px-8 py-3 bg-[#869661] text-white rounded-2xl font-bold uppercase tracking-widest text-[13px] hover:bg-[#4A5D23] shadow-lg shadow-[#869661]/20 transition-all active:scale-95">
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    </Link>
                </div>
            </div>

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                    fetchProducts();
                    setShowBulkUpload(false);
                }}
            />

            {/* Premium Filter Bar */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-4 border border-[#ECE8E0]/60 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767B71]" />
                    <input
                        type="text"
                        placeholder="Search product name, SKU or brand..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination({ ...pagination, page: 1 });
                        }}
                        className="w-full pl-14 pr-6 py-4 bg-white/50 border-none rounded-2xl text-[15px] font-medium text-[#2A2F25] placeholder:text-[#767B71]/50 focus:ring-2 focus:ring-[#869661]/20 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-4 bg-white border border-[#ECE8E0] rounded-2xl text-[14px] font-bold text-[#767B71] hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Products Table Container */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#ECE8E0]/60 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-12 h-12 border-4 border-[#869661] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[#767B71] font-medium">Refreshing catalog...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Boxes className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#2A2F25] mb-2">No products found</h3>
                        <p className="text-[#767B71] mb-8 max-w-sm mx-auto">Your selection criteria didn't match any items in our vault. Try refining your search.</p>
                        <Link href="/admin/products/new">
                            <button className="px-8 py-3 bg-[#2A2F25] text-white rounded-2xl font-bold uppercase tracking-widest text-[13px] hover:bg-black transition-all">
                                Create New Product
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#ECE8E0]/60">
                                    <th className="text-left px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em]">
                                        Product Details
                                    </th>
                                    <th className="text-left px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em] hidden lg:table-cell">
                                        Collection
                                    </th>
                                    <th className="text-left px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em]">
                                        Pricing & Stock
                                    </th>
                                    <th className="text-center px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em]">
                                        Featured
                                    </th>
                                    <th className="text-left px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em]">
                                        Visibility
                                    </th>
                                    <th className="text-right px-8 py-6 text-[12px] font-bold text-[#869661] uppercase tracking-[0.2em]">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ECE8E0]/40">
                                <AnimatePresence mode="popLayout">
                                    {products.map((product, index) => (
                                        <motion.tr 
                                            key={product._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-[#869661]/5 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 bg-white rounded-2xl border border-[#ECE8E0] p-1 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover rounded-xl"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-serif text-[18px] font-bold text-[#2A2F25] group-hover:text-[#4A5D23] transition-colors line-clamp-1">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-[12px] text-[#767B71] uppercase tracking-wider font-bold mt-0.5">
                                                            ID: {product._id.slice(-8).toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 hidden lg:table-cell">
                                                <span className="px-4 py-1.5 bg-[#869661]/10 text-[#4A5D23] rounded-full text-[13px] font-bold whitespace-nowrap">
                                                    {product.subcategory?.name
                                                        ? `${product.category?.name || "General"} / ${product.subcategory.name}`
                                                        : (product.category?.name || "General")}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const variants = product.variants || [];
                                                    const prices = variants.map(v => v.salePrice || v.regularPrice).filter(p => p != null);
                                                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                                                    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                                                    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

                                                    return (
                                                        <div>
                                                            <p className="text-[18px] font-black text-[#2A2F25]">
                                                                {minPrice === maxPrice
                                                                    ? `₹${minPrice.toLocaleString()}`
                                                                    : `₹${minPrice.toLocaleString()}+`
                                                                }
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${totalStock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                <span className="text-[12px] font-bold text-[#767B71] uppercase tracking-widest">
                                                                    {totalStock} in Stock
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => toggleFeatured(product._id, product.isFeatured)}
                                                    className={`p-3 rounded-xl transition-all ${product.isFeatured 
                                                        ? "bg-[#F9BC16]/10 text-[#F9BC16] shadow-sm" 
                                                        : "bg-gray-100 text-gray-300 hover:text-[#F9BC16]/40"}`}
                                                    title={product.isFeatured ? "Remove from highlights" : "Add to highlights"}
                                                >
                                                    <Star className={`w-5 h-5 ${product.isFeatured ? "fill-[#F9BC16]" : ""}`} />
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => toggleStatus(product._id, product.isActive)}
                                                    className={`px-5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-[0.1em] transition-all hover:scale-[1.05] active:scale-[0.95] ${product.isActive
                                                        ? "bg-[#869661] text-white shadow-lg shadow-[#869661]/20"
                                                        : "bg-[#767B71]/10 text-[#767B71] border border-[#767B71]/20 cursor-not-allowed opacity-60"
                                                        }`}
                                                >
                                                    {product.isActive ? "Visible" : "Hidden"}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        rel="noopener noreferrer"
                                                        target="_blank"
                                                        href={`/products/${product._id}`}
                                                        className="p-2.5 text-[#767B71] hover:text-[#869661] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#ECE8E0]"
                                                        title="Launch Preview"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/products/${product._id}/edit`}
                                                        className="p-2.5 text-[#767B71] hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#ECE8E0]"
                                                        title="Edit Details"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/products/${product._id}/labels`}
                                                        className="p-2.5 text-[#767B71] hover:text-[#869661] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#ECE8E0]"
                                                        title="Print Barcode Labels"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="p-2.5 text-[#767B71] hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#ECE8E0]"
                                                        title="Remove Product"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modern Pagination Footer */}
                {pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-8 border-t border-[#ECE8E0]/60 bg-white/30 backdrop-blur-sm gap-6">
                        <div className="flex flex-col">
                            <p className="text-[14px] font-bold text-[#2A2F25]">
                                Page {pagination.page} <span className="text-[#767B71] font-medium">of {pagination.pages}</span>
                            </p>
                            <p className="text-[12px] text-[#767B71] mt-1">
                                Viewing entries {(pagination.page - 1) * 10 + 1} — {Math.min(pagination.page * 10, pagination.total)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="p-4 rounded-2xl border border-[#ECE8E0] text-[#767B71] hover:bg-white hover:text-[#869661] hover:border-[#869661] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#767B71] transition-all group"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="flex items-center px-6 py-4 bg-white border border-[#ECE8E0] rounded-2xl gap-4">
                                {[...Array(pagination.pages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Basic logic to show limited numbers if many pages
                                    if (pagination.pages > 5 && Math.abs(pageNum - pagination.page) > 1 && pageNum !== 1 && pageNum !== pagination.pages) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                                            className={`text-[14px] font-black transition-colors ${pagination.page === pageNum ? "text-[#869661]" : "text-[#767B71] hover:text-[#2A2F25]"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.pages}
                                className="p-4 rounded-2xl border border-[#ECE8E0] text-[#767B71] hover:bg-white hover:text-[#869661] hover:border-[#869661] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#767B71] transition-all group"
                            >
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
