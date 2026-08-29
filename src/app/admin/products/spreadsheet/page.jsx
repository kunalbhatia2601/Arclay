"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import MediaPicker from "@/app/components/ImagePicker";

// Same 4 tabs, same column names, as Product_Catalog_Template*.xlsx — fill
// this exactly like the workbook, hit Save, it's live on the site.

let nextKey = 1;
// New rows start dirty (they've never been saved); rows loaded from the
// server start clean — only what you actually touch gets sent on Save.
const withKey = (row, dirty = false) => ({ ...row, _key: nextKey++, _dirty: dirty });

const BLANK_CATEGORY = { categoryId: null, "Category Name": "", "Description (optional)": "" };
const BLANK_SUBCATEGORY = { subcategoryId: null, Category: "", "Sub-Category Name": "", "Description (optional)": "" };
const BLANK_PRODUCT = {
    productId: null,
    "Product Name": "",
    "Image URL": "",
    Category: "",
    "Sub-Category": "",
    "Short Description": "",
    "Long Description": "",
    MRP: "",
    CP: "",
    SP: "",
    Barcode: "",
    "GST %": "",
    HSN: "",
    "Is Variated": "No",
    isActive: true,
};
const BLANK_VARIATION = {
    "Product Name": "",
    "Opt 1 Name": "",
    "Opt 1 Value": "",
    "Opt 2 Name": "",
    "Opt 2 Value": "",
    "Opt 3 Name": "",
    "Opt 3 Value": "",
    Barcode: "",
    MRP: "",
    CP: "",
    SP: "",
    "Variant Label": "",
};

const CATEGORY_SEARCH_FIELDS = ["Category Name", "Description (optional)"];
const SUBCATEGORY_SEARCH_FIELDS = ["Category", "Sub-Category Name", "Description (optional)"];
const PRODUCT_SEARCH_FIELDS = ["Product Name", "Category", "Sub-Category", "Barcode", "HSN"];
const VARIATION_SEARCH_FIELDS = ["Product Name", "Opt 1 Value", "Opt 2 Value", "Opt 3 Value", "Barcode", "Variant Label"];

const TABS = [
    { id: "categories", label: "Categories" },
    { id: "subCategories", label: "Sub-Categories" },
    { id: "products", label: "Products" },
    { id: "variations", label: "Variations" },
];

/** Generic editable row table — one instance per tab. */
function SheetTable({ columns, rows, onChange, onRemove, onEditImages }) {
    return (
        <div className="border border-border rounded-xl overflow-auto max-h-[65vh]">
            <table className="text-sm border-collapse w-max">
                <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className="p-2 border-b border-border text-left font-semibold text-muted-foreground whitespace-nowrap"
                                style={{ minWidth: c.width }}
                            >
                                {c.key}
                            </th>
                        ))}
                        <th className="p-2 border-b border-border w-10" />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row._key} className="hover:bg-muted/40">
                            {columns.map((c) => (
                                <td key={c.key} className="p-1 border-b border-border">
                                    {c.type === "images" ? (
                                        <button
                                            type="button"
                                            onClick={() => onEditImages(row._key)}
                                            className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-muted text-left"
                                        >
                                            {row[c.key] ? (
                                                <>
                                                    <img
                                                        src={row[c.key].split(",")[0].trim()}
                                                        alt=""
                                                        className="w-6 h-6 rounded object-cover border border-border shrink-0"
                                                    />
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {row[c.key].split(",").filter(Boolean).length} image
                                                        {row[c.key].split(",").filter(Boolean).length === 1 ? "" : "s"}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <ImagePlus className="w-3.5 h-3.5" /> Add
                                                </span>
                                            )}
                                        </button>
                                    ) : c.type === "select" ? (
                                        <select
                                            value={row[c.key] ?? ""}
                                            onChange={(e) => onChange(row._key, c.key, e.target.value)}
                                            className="w-full bg-transparent px-1.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                            style={{ minWidth: c.width }}
                                        >
                                            {(c.options || []).map((o) => (
                                                <option key={o} value={o}>
                                                    {o}
                                                </option>
                                            ))}
                                        </select>
                                    ) : c.type === "checkbox" ? (
                                        <input
                                            type="checkbox"
                                            checked={row[c.key] !== false}
                                            onChange={(e) => onChange(row._key, c.key, e.target.checked)}
                                        />
                                    ) : (
                                        <input
                                            type={c.type === "number" ? "number" : "text"}
                                            list={c.list}
                                            value={row[c.key] ?? ""}
                                            placeholder={c.placeholder}
                                            onChange={(e) => onChange(row._key, c.key, e.target.value)}
                                            className="w-full bg-transparent px-1.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                            style={{ minWidth: c.width }}
                                        />
                                    )}
                                </td>
                            ))}
                            <td className="p-1 border-b border-border">
                                <button
                                    onClick={() => onRemove(row._key)}
                                    title="Remove row"
                                    className="p-1.5 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function CatalogSheetPage() {
    const [tab, setTab] = useState("categories");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [variations, setVariations] = useState([]);
    const [variationProductPick, setVariationProductPick] = useState("");
    const [editingImagesKey, setEditingImagesKey] = useState(null);
    // One search box, scoped to whichever tab is open — clears on tab switch.
    // Client-side only, filters what's already loaded, no request involved.
    const [search, setSearch] = useState("");
    const switchTab = (id) => {
        setTab(id);
        setSearch("");
    };
    // Product names touched this session (edited, added, or had a variant row
    // added/removed) — Save only resends these, not the whole catalog. A
    // product+its Variations-tab rows travel together because the server
    // rebuilds that product's variants from whatever rows are sent for it.
    const [touchedProductNames, setTouchedProductNames] = useState(new Set());
    const touch = (name) => {
        if (!trim(name)) return;
        setTouchedProductNames((prev) => new Set(prev).add(trim(name)));
    };

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/products/spreadsheet", { credentials: "include" });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            // Not `.map(withKey)` directly — map() passes (row, index), and
            // index would land in withKey's `dirty` param, marking every row
            // but the first as dirty (index > 0 is truthy).
            setCategories(data.categories.map((row) => withKey(row)));
            setSubCategories(data.subCategories.map((row) => withKey(row)));
            setProducts(data.products.map((row) => withKey(row)));
            setVariations(data.variations.map((row) => withKey(row)));
            setErrors([]);
        } catch (err) {
            toast.error(err.message || "Could not load catalog");
        } finally {
            setLoading(false);
        }
    };

    const categoryNames = useMemo(() => [...new Set(categories.map((c) => c["Category Name"]).filter(Boolean))], [categories]);
    const subcategoryNames = useMemo(() => [...new Set(subCategories.map((c) => c["Sub-Category Name"]).filter(Boolean))], [subCategories]);

    // The whole point: only variated products show up here to pick from —
    // flip a product to "Is Variated = Yes" on the Products tab and it
    // appears; flip it back and its rows stay saved but drop out of view.
    const variatedProductNames = useMemo(
        () =>
            products
                .filter((p) => trim(p["Is Variated"]).toLowerCase() === "yes" && trim(p["Product Name"]))
                .map((p) => p["Product Name"]),
        [products]
    );
    const visibleVariations = useMemo(
        () => variations.filter((v) => variatedProductNames.includes(v["Product Name"])),
        [variations, variatedProductNames]
    );

    useEffect(() => {
        if (!variatedProductNames.includes(variationProductPick)) {
            setVariationProductPick(variatedProductNames[0] || "");
        }
    }, [variatedProductNames, variationProductPick]);

    // Local-only filter — matches if the query appears in any of the given
    // fields, case-insensitive. Nothing goes over the network for this.
    const matchesSearch = (row, fields, query) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return fields.some((f) => String(row[f] ?? "").toLowerCase().includes(q));
    };
    const filteredCategories = useMemo(
        () => categories.filter((r) => matchesSearch(r, CATEGORY_SEARCH_FIELDS, search)),
        [categories, search]
    );
    const filteredSubCategories = useMemo(
        () => subCategories.filter((r) => matchesSearch(r, SUBCATEGORY_SEARCH_FIELDS, search)),
        [subCategories, search]
    );
    const filteredProducts = useMemo(
        () => products.filter((r) => matchesSearch(r, PRODUCT_SEARCH_FIELDS, search)),
        [products, search]
    );
    const filteredVariations = useMemo(
        () => visibleVariations.filter((r) => matchesSearch(r, VARIATION_SEARCH_FIELDS, search)),
        [visibleVariations, search]
    );

    // Categories/Sub-Categories: each row is independent, plain dirty flag is enough.
    const makeChangeHandler = (setter) => (key, col, value) => {
        setter((prev) => prev.map((r) => (r._key === key ? { ...r, [col]: value, _dirty: true } : r)));
    };
    const makeRemoveHandler = (setter) => (key) => setter((prev) => prev.filter((r) => r._key !== key));

    // Products/Variations: also mark the product name touched (both old and
    // new, in case the edit was a rename) so its full row set gets resent.
    const changeProductCell = (key, col, value) => {
        setProducts((prev) =>
            prev.map((r) => {
                if (r._key !== key) return r;
                touch(r["Product Name"]);
                // Renaming the product itself — touch the new name too, so the
                // row saves under it instead of only the stale old name.
                if (col === "Product Name") touch(value);
                return { ...r, [col]: value, _dirty: true };
            })
        );
    };
    const changeVariationCell = (key, col, value) => {
        setVariations((prev) =>
            prev.map((r) => {
                if (r._key !== key) return r;
                touch(r["Product Name"]);
                return { ...r, [col]: value, _dirty: true };
            })
        );
    };
    const removeVariationRow = (key) => {
        setVariations((prev) => {
            const row = prev.find((r) => r._key === key);
            if (row) touch(row["Product Name"]);
            return prev.filter((r) => r._key !== key);
        });
    };

    const dirtyCategories = categories.filter((c) => c._dirty);
    const dirtySubCategories = subCategories.filter((c) => c._dirty);
    const dirtyProducts = products.filter((p) => p._dirty || touchedProductNames.has(trim(p["Product Name"])));
    const dirtyVariations = variations.filter((v) => touchedProductNames.has(trim(v["Product Name"])));
    const dirtyCount = dirtyCategories.length + dirtySubCategories.length + touchedProductNames.size;

    const save = async () => {
        if (!dirtyCount) return toast.error("Nothing to save");

        setSaving(true);
        setErrors([]);
        try {
            const res = await fetch("/api/admin/products/spreadsheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    categories: dirtyCategories,
                    subCategories: dirtySubCategories,
                    products: dirtyProducts,
                    variations: dirtyVariations,
                }),
            });
            const data = await res.json();
            if (data.errors?.length) setErrors(data.errors);

            if (data.saved) {
                toast.success(`Saved ${data.saved} product${data.saved === 1 ? "" : "s"}`);
                setTouchedProductNames(new Set());
                await load();
            } else if (!data.errors?.length) {
                toast.error(data.message || "Save failed");
            }
        } catch (err) {
            toast.error(err.message || "Network error");
        } finally {
            setSaving(false);
        }
    };

    const CATEGORY_COLUMNS = [
        { key: "Category Name", width: 220 },
        { key: "Description (optional)", width: 320 },
    ];
    const SUBCATEGORY_COLUMNS = [
        { key: "Category", width: 200, list: "category-options" },
        { key: "Sub-Category Name", width: 220 },
        { key: "Description (optional)", width: 320 },
    ];
    const PRODUCT_COLUMNS = [
        { key: "Product Name", width: 220 },
        { key: "Image URL", width: 130, type: "images" },
        { key: "Category", width: 160, list: "category-options" },
        { key: "Sub-Category", width: 160, list: "subcategory-options" },
        { key: "Short Description", width: 200 },
        { key: "Long Description", width: 200 },
        { key: "MRP", width: 90, type: "number" },
        { key: "CP", width: 90, type: "number" },
        { key: "SP", width: 90, type: "number" },
        { key: "Barcode", width: 140 },
        { key: "GST %", width: 80, type: "number" },
        { key: "HSN", width: 100 },
        { key: "Is Variated", width: 90, type: "select", options: ["No", "Yes"] },
        { key: "isActive", width: 60, type: "checkbox" },
    ];
    const VARIATION_COLUMNS = [
        { key: "Product Name", width: 200, type: "select", options: variatedProductNames },
        { key: "Opt 1 Name", width: 110, placeholder: "Flavour" },
        { key: "Opt 1 Value", width: 130, placeholder: "Choco" },
        { key: "Opt 2 Name", width: 110 },
        { key: "Opt 2 Value", width: 130 },
        { key: "Opt 3 Name", width: 110 },
        { key: "Opt 3 Value", width: 130 },
        { key: "Barcode", width: 140 },
        { key: "MRP", width: 90, type: "number" },
        { key: "CP", width: 90, type: "number" },
        { key: "SP", width: 90, type: "number" },
        { key: "Variant Label", width: 160 },
    ];

    return (
        <div className="p-6 max-w-full">
            <datalist id="category-options">
                {categoryNames.map((n) => (
                    <option key={n} value={n} />
                ))}
            </datalist>
            <datalist id="subcategory-options">
                {subcategoryNames.map((n) => (
                    <option key={n} value={n} />
                ))}
            </datalist>

            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Link href="/admin/products" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Catalog Sheet</h1>
                        <p className="text-sm text-muted-foreground">
                            Same 4 tabs as the Excel workbook. Fill Categories → Sub-Categories → Products → Variations.
                        </p>
                    </div>
                </div>
                <Button onClick={save} disabled={saving || !dirtyCount}>
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? "Saving..." : dirtyCount ? `Save Changes (${dirtyCount})` : "No Changes"}
                </Button>
            </div>

            {errors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                    <p className="font-semibold mb-1">{errors.length} issue{errors.length === 1 ? "" : "s"}:</p>
                    <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center gap-1 mb-4 border-b border-border">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => switchTab(t.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === t.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t.label}
                        {t.id === "categories" && ` (${categories.length})`}
                        {t.id === "subCategories" && ` (${subCategories.length})`}
                        {t.id === "products" && ` (${products.length})`}
                        {t.id === "variations" && ` (${visibleVariations.length})`}
                    </button>
                ))}
            </div>

            {!loading && (
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${TABS.find((t) => t.id === tab)?.label.toLowerCase()}...`}
                    className="mb-3 px-3 py-2 rounded-lg border border-border bg-background text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                />
            )}

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "categories" && (
                        <>
                            <SheetTable
                                columns={CATEGORY_COLUMNS}
                                rows={filteredCategories}
                                onChange={makeChangeHandler(setCategories)}
                                onRemove={makeRemoveHandler(setCategories)}
                            />
                            <Button variant="outline" className="mt-3" onClick={() => setCategories((p) => [...p, withKey({ ...BLANK_CATEGORY }, true)])}>
                                <Plus className="w-4 h-4 mr-1" /> Add Category
                            </Button>
                        </>
                    )}

                    {tab === "subCategories" && (
                        <>
                            <SheetTable
                                columns={SUBCATEGORY_COLUMNS}
                                rows={filteredSubCategories}
                                onChange={makeChangeHandler(setSubCategories)}
                                onRemove={makeRemoveHandler(setSubCategories)}
                            />
                            <Button variant="outline" className="mt-3" onClick={() => setSubCategories((p) => [...p, withKey({ ...BLANK_SUBCATEGORY }, true)])}>
                                <Plus className="w-4 h-4 mr-1" /> Add Sub-Category
                            </Button>
                        </>
                    )}

                    {tab === "products" && (
                        <>
                            <SheetTable
                                columns={PRODUCT_COLUMNS}
                                rows={filteredProducts}
                                onChange={changeProductCell}
                                onRemove={makeRemoveHandler(setProducts)}
                                onEditImages={setEditingImagesKey}
                            />
                            <Button variant="outline" className="mt-3" onClick={() => setProducts((p) => [...p, withKey({ ...BLANK_PRODUCT }, true)])}>
                                <Plus className="w-4 h-4 mr-1" /> Add Product
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Set <strong>Is Variated</strong> to Yes and it shows up on the Variations tab to add
                                its sizes/flavours; leave it No and MRP/CP/SP/Barcode here are the whole product.
                            </p>
                        </>
                    )}

                    {tab === "variations" && (
                        <>
                            {variatedProductNames.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-xl">
                                    No products are marked <strong>Is Variated = Yes</strong> yet. Set that on the
                                    Products tab first, then come back here to add its variants.
                                </p>
                            ) : (
                                <>
                                    <SheetTable
                                        columns={VARIATION_COLUMNS}
                                        rows={filteredVariations}
                                        onChange={changeVariationCell}
                                        onRemove={removeVariationRow}
                                    />
                                    <div className="flex items-center gap-2 mt-3">
                                        <select
                                            value={variationProductPick}
                                            onChange={(e) => setVariationProductPick(e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                        >
                                            {variatedProductNames.map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                {
                                                    touch(variationProductPick);
                                                    setVariations((p) => [
                                                        ...p,
                                                        withKey({ ...BLANK_VARIATION, "Product Name": variationProductPick }, true),
                                                    ]);
                                                }
                                            }
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Add Variant Row
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {editingImagesKey != null && (() => {
                const row = products.find((p) => p._key === editingImagesKey);
                if (!row) return null;
                const urls = (row["Image URL"] || "").split(",").map((s) => s.trim()).filter(Boolean);
                return (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <p className="font-semibold text-foreground truncate pr-4">
                                    {row["Product Name"] || "Images"}
                                </p>
                                <button
                                    onClick={() => setEditingImagesKey(null)}
                                    className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <MediaPicker
                                    value={urls}
                                    onChange={(next) =>
                                        changeProductCell(editingImagesKey, "Image URL", next.join(", "))
                                    }
                                    multiple
                                    type="all"
                                    label="Product Images"
                                />
                            </div>
                            <div className="p-4 border-t border-border flex justify-end">
                                <Button onClick={() => setEditingImagesKey(null)}>Done</Button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function trim(v) {
    return String(v ?? "").trim();
}
