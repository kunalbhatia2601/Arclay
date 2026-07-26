"use client";

import { barcodeToSvg } from "@/lib/barcode";

export const LABEL_SIZES = {
    thermal: {
        label: "Thermal roll (50 × 25 mm)",
        widthMm: 50,
        heightMm: 25,
        moduleWidth: 1,
        barHeight: 34,
        pageCss: "@page { size: 50mm 25mm; margin: 0; }",
    },
    a4: {
        label: "A4 sheet (65 mm × 38 mm grid)",
        widthMm: 65,
        heightMm: 38,
        moduleWidth: 1.2,
        barHeight: 46,
        pageCss: "@page { size: A4; margin: 8mm; }",
    },
};

export function variantLabel(attributes) {
    if (!attributes) return "";
    return Object.values(attributes).join(" / ");
}

// CSS applied while printing: hide the app chrome and let only the label sheet
// through, keeping individual labels from splitting across pages.
export const PRINT_SHEET_CSS = `
    @media print {
        body * { visibility: hidden; }
        #label-sheet, #label-sheet * { visibility: visible; }
        #label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            gap: 0;
        }
        .label-cell {
            border: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
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
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                padding: "1.5mm",
            }}
        >
            <div className="w-full text-center leading-tight">
                <p className="font-semibold truncate" style={{ fontSize: "8pt" }}>
                    {productName}
                </p>
                {name && (
                    <p className="truncate" style={{ fontSize: "6pt" }}>
                        {name}
                    </p>
                )}
            </div>

            <div className="flex items-baseline justify-center gap-1.5" style={{ lineHeight: 1 }}>
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
                    className="w-full flex justify-center"
                    style={{ maxHeight: `${size.barHeight + 18}px`, overflow: "hidden" }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            ) : (
                <p style={{ fontSize: "6pt" }}>No barcode assigned</p>
            )}
        </div>
    );
}
