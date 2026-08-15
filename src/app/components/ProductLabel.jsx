"use client";

import { useEffect, useState, Children, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { barcodeToSvg } from "@/lib/barcode";

export const LABEL_SIZES = {
    thermal: {
        label: "Thermal die-cut (50 × 25 mm)",
        widthMm: 50,
        heightMm: 25,
        // Compact bars so name + price + barcode fit the short edge.
        moduleWidth: 0.9,
        barHeight: 18,
        showBarcodeText: false,
        layout: "stack",
    },
    a4: {
        label: "A4 sheet (65 × 38 mm grid)",
        widthMm: 65,
        heightMm: 38,
        moduleWidth: 1.2,
        barHeight: 40,
        showBarcodeText: true,
        layout: "grid",
    },
};

export function variantLabel(attributes) {
    if (!attributes) return "";
    return Object.values(attributes).join(" / ");
}

/** Print CSS for the active label size — die-cut thermal needs an exact page box. */
export function getLabelPrintCss(size) {
    const { widthMm, heightMm, layout } = size;
    const page =
        layout === "stack"
            ? `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`
            : `@page { size: A4; margin: 8mm; }`;

    return `
    ${page}
    @media print {
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            width: auto !important;
            height: auto !important;
        }
        /* Only the portaled sheet prints — avoids admin UI creating extra pages */
        body > *:not(#label-sheet) {
            display: none !important;
        }
        #label-sheet {
            display: block !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            background: #fff !important;
        }
        .label-cell {
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* One die-cut sticker = one page, exact physical size */
        #label-sheet[data-layout="stack"] {
            display: block !important;
        }
        #label-sheet[data-layout="stack"] .label-cell {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            max-width: ${widthMm}mm !important;
            max-height: ${heightMm}mm !important;
            margin: 0 !important;
            padding: 1mm 1.5mm !important;
            page-break-after: always;
            break-after: page;
        }
        #label-sheet[data-layout="stack"] .label-cell svg {
            max-width: 100% !important;
            max-height: 16mm !important;
            width: auto !important;
            height: auto !important;
        }
        #label-sheet[data-layout="stack"] .label-cell:last-child {
            page-break-after: auto;
            break-after: auto;
        }

        /* A4: tile stickers on the sheet */
        #label-sheet[data-layout="grid"] {
            display: flex !important;
            flex-wrap: wrap !important;
            align-content: flex-start !important;
            gap: 2mm !important;
        }
        #label-sheet[data-layout="grid"] .label-cell {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
        }
    }
`;
}

/** @deprecated use getLabelPrintCss(size) — kept so older imports do not explode */
export const PRINT_SHEET_CSS = getLabelPrintCss(LABEL_SIZES.thermal);

/**
 * Renders labels for screen preview and portals a print-only copy to
 * document.body so each thermal sticker is exactly one page.
 */
export function LabelPrintSheet({ size, children, className = "" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // children cannot mount in two parents — clone for the print portal.
    const preview = Children.map(children, (child, i) =>
        isValidElement(child)
            ? cloneElement(child, { key: `preview-${child.key ?? i}` })
            : child
    );
    const printable = Children.map(children, (child, i) =>
        isValidElement(child)
            ? cloneElement(child, { key: `print-${child.key ?? i}` })
            : child
    );

    return (
        <>
            <style>{getLabelPrintCss(size)}</style>

            <div className={`print:hidden flex flex-wrap gap-2 ${className}`.trim()}>
                {preview}
            </div>

            {mounted &&
                createPortal(
                    <div
                        id="label-sheet"
                        data-layout={size.layout}
                        className="hidden print:block"
                    >
                        {printable}
                    </div>,
                    document.body
                )}
        </>
    );
}

export default function ProductLabel({ productName, variant, size, showSalePrice = true }) {
    const showBarcodeText = size.showBarcodeText !== false;
    const svg = variant.barcode
        ? barcodeToSvg(variant.barcode, {
              moduleWidth: size.moduleWidth,
              height: size.barHeight,
              showText: showBarcodeText,
          })
        : null;

    const variantName = variantLabel(variant.attributes);
    // Avoid printing the same title twice when the variant text repeats the product name.
    const subtitle =
        variantName &&
        variantName.trim().toLowerCase() !== String(productName || "").trim().toLowerCase()
            ? variantName
            : "";

    const hasSale =
        showSalePrice && variant.salePrice != null && variant.salePrice !== "";

    const isThermal = size.layout === "stack";

    if (isThermal) {
        // Landscape die-cut: text on the left, barcode on the right.
        return (
            <div
                className="label-cell border border-dashed border-border bg-white text-black overflow-hidden"
                style={{
                    width: `${size.widthMm}mm`,
                    height: `${size.heightMm}mm`,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    padding: "1mm 1.5mm",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "1.5mm",
                }}
            >
                <div
                    className="min-w-0"
                    style={{
                        flex: "1 1 auto",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "0.6mm",
                    }}
                >
                    <p
                        className="font-semibold leading-tight"
                        style={{
                            fontSize: "7.5pt",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {productName}
                    </p>
                    {subtitle && (
                        <p
                            className="leading-tight"
                            style={{
                                fontSize: "5.5pt",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                    <div
                        className="flex items-baseline gap-1 min-w-0"
                        style={{ lineHeight: 1.1 }}
                    >
                        {hasSale ? (
                            <>
                                <span style={{ fontSize: "5.5pt", textDecoration: "line-through" }}>
                                    ₹{Number(variant.regularPrice).toLocaleString("en-IN")}
                                </span>
                                <span style={{ fontSize: "8.5pt", fontWeight: 700 }}>
                                    ₹{Number(variant.salePrice).toLocaleString("en-IN")}
                                </span>
                            </>
                        ) : (
                            <span style={{ fontSize: "8.5pt", fontWeight: 700 }}>
                                ₹{Number(variant.regularPrice).toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                </div>

                <div
                    className="shrink-0 flex flex-col items-center justify-center"
                    style={{ maxWidth: "48%", overflow: "hidden" }}
                >
                    {svg ? (
                        <div
                            style={{
                                maxHeight: `${size.heightMm - 3}mm`,
                                maxWidth: "100%",
                                overflow: "hidden",
                                lineHeight: 0,
                            }}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    ) : (
                        <p style={{ fontSize: "5pt", margin: 0 }}>No barcode</p>
                    )}
                    {variant.barcode && (
                        <p
                            style={{
                                fontSize: "5pt",
                                margin: "0.4mm 0 0",
                                fontFamily: "ui-monospace, monospace",
                                letterSpacing: "0.02em",
                            }}
                        >
                            {variant.barcode}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // A4 / sheet: stacked layout with room for a taller barcode.
    return (
        <div
            className="label-cell border border-dashed border-border bg-white text-black flex flex-col items-center justify-between overflow-hidden"
            style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "1.5mm",
            }}
        >
            <div className="w-full text-center leading-tight min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: "8pt" }}>
                    {productName}
                </p>
                {subtitle && (
                    <p className="truncate" style={{ fontSize: "6pt" }}>
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex items-baseline justify-center gap-1.5 min-w-0" style={{ lineHeight: 1 }}>
                {hasSale ? (
                    <>
                        <span style={{ fontSize: "7pt", textDecoration: "line-through" }}>
                            MRP ₹{Number(variant.regularPrice).toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "10pt", fontWeight: 700 }}>
                            ₹{Number(variant.salePrice).toLocaleString("en-IN")}
                        </span>
                    </>
                ) : (
                    <span style={{ fontSize: "10pt", fontWeight: 700 }}>
                        MRP ₹{Number(variant.regularPrice).toLocaleString("en-IN")}
                    </span>
                )}
            </div>

            {svg ? (
                <div
                    className="w-full flex justify-center min-w-0"
                    style={{ maxHeight: `${size.barHeight + 18}px`, overflow: "hidden" }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            ) : (
                <p style={{ fontSize: "6pt" }}>No barcode assigned</p>
            )}
        </div>
    );
}
