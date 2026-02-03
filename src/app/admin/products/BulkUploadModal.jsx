"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const PRODUCT_FIELDS = [
    { key: "name", label: "Product Name", required: true },
    { key: "category", label: "Category Name", required: false },
    { key: "description", label: "Short Description", required: false },
    { key: "long_description", label: "Long Description", required: false },
    { key: "regularPrice", label: "Regular Price", required: true },
    { key: "salePrice", label: "Sale Price", required: false },
    { key: "stock", label: "Stock", required: false },
    { key: "sku", label: "SKU", required: false },
    { key: "image1", label: "Image URL 1", required: false },
    { key: "image2", label: "Image URL 2", required: false },
    { key: "image3", label: "Image URL 3", required: false },
    { key: "isActive", label: "Is Active (true/false)", required: false },
    { key: "isFeatured", label: "Is Featured (true/false)", required: false },
];

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
    const [file, setFile] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFile(null);
            setExcelData([]);
            setColumns([]);
            setMapping({});
            setResult(null);
        }
    }, [isOpen]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                toast.error("File must have headers and at least one data row");
                return;
            }

            const headers = jsonData[0].map(h => String(h || "").trim());
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ""));

            setColumns(headers);
            setExcelData(rows);

            // Auto-map columns with matching names
            const autoMapping = {};
            headers.forEach((header, idx) => {
                const headerLower = header.toLowerCase().replace(/[_\s]/g, "");
                PRODUCT_FIELDS.forEach(field => {
                    const fieldLower = field.key.toLowerCase();
                    if (headerLower === fieldLower || headerLower.includes(fieldLower)) {
                        autoMapping[field.key] = idx;
                    }
                });
            });
            setMapping(autoMapping);
            setStep(2);
        } catch (error) {
            console.error("Failed to parse file:", error);
            toast.error("Failed to parse file. Please check the format.");
        }
    };

    const getMappedData = () => {
        return excelData.map(row => {
            const product = {};
            PRODUCT_FIELDS.forEach(field => {
                if (mapping[field.key] !== undefined && mapping[field.key] !== "") {
                    product[field.key] = row[mapping[field.key]];
                }
            });
            return product;
        });
    };

    const handleImport = async () => {
        const mappedData = getMappedData();
        
        // Validate required fields (category is optional, defaults to SITE_NAME)
        const invalidRows = mappedData.filter((p, i) => !p.name || !p.regularPrice);
        if (invalidRows.length > 0) {
            toast.error(`${invalidRows.length} rows are missing required fields (name or regularPrice)`);
            return;
        }

        setImporting(true);

        try {
            const res = await fetch("/api/admin/products/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    products: mappedData
                })
            });

            const data = await res.json();
            setResult(data);

            if (data.success) {
                onSuccess?.();
            }
        } catch (error) {
            console.error("Import error:", error);
            setResult({ success: false, message: "Failed to import products" });
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-serif text-xl font-bold">
                        📥 Bulk Upload Products
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            Step {step} of 3
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Upload File */}
                    {step === 1 && (
                        <div className="text-center py-12">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-4">
                                    📁
                                </div>
                                <h3 className="text-lg font-medium mb-2">Upload Excel or CSV File</h3>
                                <p className="text-muted-foreground text-sm">
                                    Supported formats: .xlsx, .xls, .csv
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition"
                            >
                                Select File
                            </button>
                        </div>
                    )}

                    {/* Step 2: Map Columns */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-muted rounded-xl">
                                <p className="text-sm text-muted-foreground">
                                    📊 Found <strong>{columns.length}</strong> columns and <strong>{excelData.length}</strong> rows in "{file?.name}"
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    💡 Categories will be auto-created if they don't exist
                                </p>
                            </div>

                            {/* Column Mapping */}
                            <div>
                                <h3 className="font-medium mb-3">Map Excel Columns to Product Fields</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {PRODUCT_FIELDS.map(field => (
                                        <div key={field.key} className="flex items-center gap-3">
                                            <label className="w-1/2 text-sm">
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <select
                                                value={mapping[field.key] ?? ""}
                                                onChange={(e) => setMapping(prev => ({
                                                    ...prev,
                                                    [field.key]: e.target.value === "" ? "" : parseInt(e.target.value)
                                                }))}
                                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="">-- Skip --</option>
                                                {columns.map((col, idx) => (
                                                    <option key={idx} value={idx}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!mapping.name || !mapping.regularPrice}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                                >
                                    Preview →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview & Import */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {result ? (
                                <div className={`p-6 rounded-xl text-center ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="text-4xl mb-3">{result.success ? '✅' : '❌'}</div>
                                    <h3 className="font-medium text-lg mb-2">
                                        {result.success ? 'Import Complete!' : 'Import Failed'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {result.message}
                                    </p>
                                    {result.created > 0 && (
                                        <p className="mt-2 font-medium text-green-700">
                                            {result.created} products created
                                        </p>
                                    )}
                                    {result.errors?.length > 0 && (
                                        <div className="mt-4 text-left max-h-40 overflow-y-auto text-sm text-red-700">
                                            {result.errors.map((err, i) => (
                                                <p key={i}>Row {err.row}: {err.error}</p>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-muted rounded-xl">
                                        <p className="text-sm">
                                            Ready to import <strong>{excelData.length}</strong> products
                                        </p>
                                    </div>

                                    {/* Preview Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted">
                                                    <th className="px-3 py-2 text-left">#</th>
                                                    <th className="px-3 py-2 text-left">Name</th>
                                                    <th className="px-3 py-2 text-left">Category</th>
                                                    <th className="px-3 py-2 text-left">Price</th>
                                                    <th className="px-3 py-2 text-left">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getMappedData().slice(0, 10).map((product, idx) => (
                                                    <tr key={idx} className="border-b border-border">
                                                        <td className="px-3 py-2">{idx + 1}</td>
                                                        <td className="px-3 py-2">{product.name || '-'}</td>
                                                        <td className="px-3 py-2">{product.category || '-'}</td>
                                                        <td className="px-3 py-2">₹{product.regularPrice || '-'}</td>
                                                        <td className="px-3 py-2">{product.stock || '0'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {excelData.length > 10 && (
                                            <p className="text-center text-sm text-muted-foreground mt-2">
                                                ... and {excelData.length - 10} more rows
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="px-4 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={importing}
                                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                                        >
                                            {importing ? 'Importing...' : `Import ${excelData.length} Products`}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
