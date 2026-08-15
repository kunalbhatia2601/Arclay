"use client";

import { barcodeToSvg, encodeCode128B } from "@/lib/barcode";

export const LABEL_SIZES = {
    thermal: {
        label: "Thermal die-cut (50 × 25 mm)",
        widthMm: 50,
        heightMm: 25,
        moduleWidth: 0.85,
        barHeight: 14,
        showBarcodeText: false,
        layout: "stack",
    },
    thermal50x30: {
        label: "Thermal die-cut (50 × 30 mm)",
        widthMm: 50,
        heightMm: 30,
        moduleWidth: 0.9,
        barHeight: 16,
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

/** 203 dpi — common thermal print head density */
const THERMAL_DPI = 203;

function mmToPx(mm) {
    return Math.max(1, Math.round((Number(mm) / 25.4) * THERMAL_DPI));
}

function subtitleFor(productName, variant) {
    const variantName = variantLabel(variant.attributes);
    if (
        !variantName ||
        variantName.trim().toLowerCase() === String(productName || "").trim().toLowerCase()
    ) {
        return "";
    }
    return variantName;
}

function drawBarcode(ctx, text, x, y, maxW, barH) {
    const widths = encodeCode128B(text);
    if (!widths) return;

    const modules = [...widths].reduce((s, w) => s + Number(w), 0) + 20; // quiet zones
    const moduleW = Math.max(0.7, maxW / modules);

    let cursor = x + 10 * moduleW;
    let isBar = true;
    for (const ch of widths) {
        const w = Number(ch) * moduleW;
        if (isBar) {
            ctx.fillStyle = "#000";
            ctx.fillRect(cursor, y, w, barH);
        }
        cursor += w;
        isBar = !isBar;
    }
}

function renderLabelCanvas(item, size, showSalePrice) {
    const w = mmToPx(size.widthMm);
    const h = mmToPx(size.heightMm);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";

    const pad = mmToPx(1.2);
    const colGap = mmToPx(1.5);
    const textW = Math.floor((w - pad * 2) * 0.52);
    const codeW = w - pad * 2 - textW - colGap;

    const productName = String(item.productName || "");
    const subtitle = subtitleFor(productName, item.variant);
    const variant = item.variant || {};

    // --- text column ---
    let ty = pad;
    ctx.font = `bold ${Math.round(mmToPx(2.6))}px sans-serif`;
    ctx.fillText(productName, pad, ty, textW);
    ty += mmToPx(3.2);

    if (subtitle) {
        ctx.font = `${Math.round(mmToPx(1.9))}px sans-serif`;
        ctx.fillText(subtitle, pad, ty, textW);
        ty += mmToPx(2.4);
    }

    const hasSale =
        showSalePrice && variant.salePrice != null && variant.salePrice !== "";
    if (hasSale) {
        const mrp = `₹${Number(variant.regularPrice).toLocaleString("en-IN")}`;
        const sale = `₹${Number(variant.salePrice).toLocaleString("en-IN")}`;
        ctx.font = `${Math.round(mmToPx(1.8))}px sans-serif`;
        ctx.fillText(mrp, pad, ty, textW);
        const mrpW = ctx.measureText(mrp).width;
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(pad, ty + mmToPx(1.1));
        ctx.lineTo(pad + mrpW, ty + mmToPx(1.1));
        ctx.stroke();
        ctx.font = `bold ${Math.round(mmToPx(2.8))}px sans-serif`;
        ctx.fillText(sale, pad + mrpW + mmToPx(1), ty - mmToPx(0.3), textW);
    } else {
        ctx.font = `bold ${Math.round(mmToPx(2.8))}px sans-serif`;
        ctx.fillText(
            `₹${Number(variant.regularPrice).toLocaleString("en-IN")}`,
            pad,
            ty,
            textW
        );
    }

    // --- barcode column ---
    const codeX = pad + textW + colGap;
    const barH = Math.min(mmToPx(size.barHeight * 0.35), h - pad * 2 - mmToPx(3));
    const barY = Math.round((h - barH - mmToPx(2.5)) / 2);

    if (variant.barcode) {
        drawBarcode(ctx, String(variant.barcode), codeX, barY, codeW, barH);
        ctx.font = `${Math.round(mmToPx(1.6))}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(
            String(variant.barcode),
            codeX + codeW / 2,
            barY + barH + mmToPx(0.6),
            codeW
        );
        ctx.textAlign = "left";
    }

    return canvas.toDataURL("image/png");
}

/**
 * Thermal die-cut labels: rasterise each sticker to an exact-mm PNG at 203 dpi,
 * then print one image per page. Avoids CSS rotation / @page quirks that were
 * stretching one label across two stickers on portable label printers.
 */
export function printLabelRoll(items, size, { showSalePrice = true } = {}) {
    if (!items?.length || typeof document === "undefined") return;

    const w = size.widthMm;
    const h = size.heightMm;

    const imgs = items
        .map((item) => {
            const src = renderLabelCanvas(item, size, showSalePrice);
            return `<div class="page"><img src="${src}" width="${w}mm" height="${h}mm" alt="" /></div>`;
        })
        .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Labels</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  * { margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page {
    width: ${w}mm;
    height: ${h}mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  img {
    display: block;
    width: ${w}mm;
    height: ${h}mm;
    max-width: ${w}mm;
    max-height: ${h}mm;
  }
</style>
</head>
<body>
${imgs}
<script>
  window.onload = function () {
    var imgs = Array.prototype.slice.call(document.images || []);
    var left = imgs.length;
    function go() {
      setTimeout(function () { window.focus(); window.print(); }, 30);
    }
    if (!left) return go();
    imgs.forEach(function (img) {
      if (img.complete) { if (--left === 0) go(); }
      else {
        img.onload = img.onerror = function () { if (--left === 0) go(); };
      }
    });
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

    const subtitle = subtitleFor(productName, variant);
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
