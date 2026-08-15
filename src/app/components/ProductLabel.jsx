"use client";

import { barcodeToSvg } from "@/lib/barcode";

export const LABEL_SIZES = {
    thermal: {
        label: "Thermal die-cut (50 × 25 mm)",
        widthMm: 50,
        heightMm: 25,
        moduleWidth: 0.85,
        barHeight: 14,
        showBarcodeText: false,
        layout: "stack",
        // Portable label printers map CSS "width" to the feed direction, so the
        // print document uses a swapped page box and rotates the face 90°.
        rotateForPrinter: true,
    },
    thermal50x30: {
        label: "Thermal die-cut (50 × 30 mm)",
        widthMm: 50,
        heightMm: 30,
        moduleWidth: 0.9,
        barHeight: 16,
        showBarcodeText: false,
        layout: "stack",
        rotateForPrinter: true,
    },
    a4: {
        label: "A4 sheet (65 × 38 mm grid)",
        widthMm: 65,
        heightMm: 38,
        moduleWidth: 1.2,
        barHeight: 40,
        showBarcodeText: true,
        layout: "grid",
        rotateForPrinter: false,
    },
};

export function variantLabel(attributes) {
    if (!attributes) return "";
    return Object.values(attributes).join(" / ");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[<>&"']/g, (c) => (
        { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

function priceHtml(variant, showSalePrice) {
    const hasSale =
        showSalePrice && variant.salePrice != null && variant.salePrice !== "";
    if (hasSale) {
        return (
            `<span style="font-size:5.5pt;text-decoration:line-through;margin-right:1mm">` +
            `₹${Number(variant.regularPrice).toLocaleString("en-IN")}</span>` +
            `<span style="font-size:9pt;font-weight:700">` +
            `₹${Number(variant.salePrice).toLocaleString("en-IN")}</span>`
        );
    }
    return (
        `<span style="font-size:9pt;font-weight:700">` +
        `₹${Number(variant.regularPrice).toLocaleString("en-IN")}</span>`
    );
}

function labelFaceHtml({ productName, variant, size, showSalePrice }) {
    const variantName = variantLabel(variant.attributes);
    const subtitle =
        variantName &&
        variantName.trim().toLowerCase() !== String(productName || "").trim().toLowerCase()
            ? variantName
            : "";

    const svg = variant.barcode
        ? barcodeToSvg(variant.barcode, {
              moduleWidth: size.moduleWidth,
              height: size.barHeight,
              showText: false,
          })
        : null;

    const barcodeBlock = svg
        ? `<div style="flex:0 0 auto;max-width:48%;max-height:100%;overflow:hidden;line-height:0;text-align:center">
             <div style="max-width:100%;max-height:${size.heightMm - 4}mm;overflow:hidden">${svg}</div>
             <div style="font-size:5pt;font-family:ui-monospace,monospace;margin-top:0.4mm;line-height:1">
               ${escapeHtml(variant.barcode)}
             </div>
           </div>`
        : `<div style="font-size:5pt">No barcode</div>`;

    return `
      <div style="
        width:${size.widthMm}mm;
        height:${size.heightMm}mm;
        box-sizing:border-box;
        padding:1mm 1.5mm;
        display:flex;
        flex-direction:row;
        align-items:center;
        gap:1.5mm;
        overflow:hidden;
        background:#fff;
        color:#000;
        font-family:system-ui,sans-serif;
      ">
        <div style="flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:0.5mm">
          <div style="font-size:7.5pt;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15">
            ${escapeHtml(productName)}
          </div>
          ${
              subtitle
                  ? `<div style="font-size:5.5pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1">${escapeHtml(subtitle)}</div>`
                  : ""
          }
          <div style="line-height:1.1">${priceHtml(variant, showSalePrice)}</div>
        </div>
        ${barcodeBlock}
      </div>
    `;
}

/**
 * Opens a dedicated print document (iframe) so die-cut thermal printers get
 * exact mm pages — not the tall admin UI. Portable label drivers treat CSS
 * width as the feed axis, so thermal pages are swapped + rotated.
 */
export function printLabelRoll(items, size, { showSalePrice = true } = {}) {
    if (!items?.length) return;

    const rotate = !!size.rotateForPrinter;
    // Physical sticker: widthMm × heightMm (as you read it after peeling).
    // Printer page box when rotate=true: feed(heightMm) × across(widthMm).
    const pageW = rotate ? size.heightMm : size.widthMm;
    const pageH = rotate ? size.widthMm : size.heightMm;

    const pages = items
        .map((item) => {
            const face = labelFaceHtml({
                productName: item.productName,
                variant: item.variant,
                size,
                showSalePrice,
            });

            if (!rotate) {
                return `<div class="page">${face}</div>`;
            }

            // Face is designed in reading orientation (wide × short). Rotate into
            // the feed-oriented page box so one sticker = one gap advance.
            return `
              <div class="page">
                <div class="rotator">${face}</div>
              </div>
            `;
        })
        .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Labels</title>
<style>
  @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${pageW}mm;
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .page {
    width: ${pageW}mm;
    height: ${pageH}mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    position: relative;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .rotator {
    width: ${size.widthMm}mm;
    height: ${size.heightMm}mm;
    transform: rotate(90deg);
    transform-origin: top left;
    position: absolute;
    top: 0;
    left: ${pageW}mm;
  }
  .page svg { max-width: 100%; max-height: ${Math.max(10, size.heightMm - 6)}mm; height: auto; }
</style>
</head>
<body>
${pages}
<script>
  window.onload = function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 50);
  };
</script>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
        setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1000);
    };

    iframe.contentWindow?.addEventListener?.("afterprint", cleanup);
    // Fallback if afterprint never fires (some WebKit builds).
    setTimeout(cleanup, 60_000);
}

/** Preview-only for thermal (prints via printLabelRoll). A4 keeps on-page print. */
export function LabelPrintSheet({ size, children, className = "" }) {
    if (size.layout === "grid") {
        return (
            <>
                <style>{`
                    @media print {
                        @page { size: A4; margin: 8mm; }
                        body * { visibility: hidden; }
                        #label-sheet, #label-sheet * { visibility: visible; }
                        #label-sheet {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            display: flex !important;
                            flex-wrap: wrap !important;
                            gap: 2mm !important;
                        }
                        .label-cell {
                            border: none !important;
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                    }
                `}</style>
                <div
                    id="label-sheet"
                    data-layout="grid"
                    className={`flex flex-wrap gap-2 ${className}`.trim()}
                >
                    {children}
                </div>
            </>
        );
    }

    return (
        <div className={`flex flex-wrap gap-2 print:hidden ${className}`.trim()}>
            {children}
        </div>
    );
}

export default function ProductLabel({ productName, variant, size, showSalePrice = true }) {
    const svg = variant.barcode
        ? barcodeToSvg(variant.barcode, {
              moduleWidth: size.moduleWidth,
              height: size.barHeight,
              showText: !!size.showBarcodeText,
          })
        : null;

    const variantName = variantLabel(variant.attributes);
    const subtitle =
        variantName &&
        variantName.trim().toLowerCase() !== String(productName || "").trim().toLowerCase()
            ? variantName
            : "";

    const hasSale =
        showSalePrice && variant.salePrice != null && variant.salePrice !== "";

    const isThermal = size.layout === "stack";

    if (isThermal) {
        return (
            <div
                className="label-cell border border-dashed border-border bg-white text-black overflow-hidden"
                style={{
                    width: `${size.widthMm}mm`,
                    height: `${size.heightMm}mm`,
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
                        className="font-semibold"
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
                    <div className="flex items-baseline gap-1" style={{ lineHeight: 1.1 }}>
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
                            style={{ lineHeight: 0, maxWidth: "100%", overflow: "hidden" }}
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
                            }}
                        >
                            {variant.barcode}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="label-cell border border-dashed border-border bg-white text-black flex flex-col items-center justify-between overflow-hidden"
            style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
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
