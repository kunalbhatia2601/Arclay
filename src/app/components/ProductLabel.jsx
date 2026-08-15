"use client";

import { barcodeToSvg } from "@/lib/barcode";

export const LABEL_SIZES = {
    thermal: {
        label: "Thermal roll (one label per page)",
        widthMm: 50,
        heightMm: 25,
        moduleWidth: 1,
        barHeight: 34,
        // One physical sticker per printed page; page size comes from the printer.
        layout: "stack",
    },
    a4: {
        label: "Sheet grid (tiled on page)",
        widthMm: 65,
        heightMm: 38,
        moduleWidth: 1.2,
        barHeight: 46,
        // Many labels per sheet; paper size comes from the printer dialog.
        layout: "grid",
    },
};

export function variantLabel(attributes) {
    if (!attributes) return "";
    return Object.values(attributes).join(" / ");
}

// Hide app chrome; fill the printer's page. Do not force @page size — the
// dialog / driver already knows the roll or sheet. Thermal stacks one label
// per page; sheet mode tiles and avoids splitting a label across pages.
export const PRINT_SHEET_CSS = `
    @media print {
        @page { margin: 0; }
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            background: #fff;
        }
        body * { visibility: hidden; }
        #label-sheet, #label-sheet * { visibility: visible; }
        #label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            gap: 0 !important;
            box-sizing: border-box;
        }
        .label-cell {
            border: none !important;
            box-sizing: border-box !important;
            overflow: hidden;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .label-cell * {
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
        }

        /* Thermal: one label fills each printer page, then advance. */
        #label-sheet[data-layout="stack"] {
            display: block;
        }
        #label-sheet[data-layout="stack"] .label-cell {
            width: 100% !important;
            height: 100vh !important;
            max-width: 100%;
            margin: 0;
            padding: 2mm 3mm !important;
            page-break-after: always;
            break-after: page;
        }
        #label-sheet[data-layout="stack"] .label-cell:last-child {
            page-break-after: auto;
            break-after: auto;
        }

        /* Sheet: tile labels; keep physical mm size for sticker cutters. */
        #label-sheet[data-layout="grid"] {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            padding: 4mm;
            gap: 2mm !important;
        }
        #label-sheet[data-layout="grid"] .label-cell {
            page-break-inside: avoid;
            break-inside: avoid;
        }
    }
`;

export default function ProductLabel({ productName, variant, size, showSalePrice = true }) {
    const svg = variant.barcode
        ? barcodeToSvg(variant.barcode, {
              moduleWidth: size.moduleWidth,
              height: size.barHeight,
              showText: true,
          })
        : null;

    const name = variantLabel(variant.attributes);
    const hasSale =
        showSalePrice && variant.salePrice != null && variant.salePrice !== "";

    return (
        <div
            className="label-cell border border-dashed border-border bg-white text-black flex flex-col items-center justify-between overflow-hidden"
            style={{
                // Preview dimensions only — print CSS overrides for thermal stack.
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
                {name && (
                    <p className="truncate" style={{ fontSize: "6pt" }}>
                        {name}
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
