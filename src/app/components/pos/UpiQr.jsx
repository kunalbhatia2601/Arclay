"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle } from "lucide-react";
import { buildUpiLink } from "@/lib/upi";

/**
 * Scannable UPI collection code for the exact bill amount.
 *
 * Rendered at checkout so the customer pays before the sale is confirmed. The
 * amount is baked into the code, so there is nothing for either side to type.
 */
export default function UpiQr({ upiId, payeeName, amount, note, size = 190 }) {
    // Keyed to the link it was drawn for: when the total changes, the old code
    // is discarded rather than lingering on screen for the wrong amount.
    const [qr, setQr] = useState({ link: null, url: "" });
    const link = buildUpiLink({ upiId, payeeName, amount, note });
    const dataUrl = qr.link === link ? qr.url : "";

    useEffect(() => {
        if (!link) return undefined;
        let cancelled = false;
        QRCode.toDataURL(link, { width: size * 2, margin: 1, errorCorrectionLevel: "M" })
            .then((url) => {
                if (!cancelled) setQr({ link, url });
            })
            .catch(() => {
                if (!cancelled) setQr({ link, url: "" });
            });
        return () => {
            cancelled = true;
        };
    }, [link, size]);

    if (!upiId) {
        return (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    No UPI ID set. Add one under Settings → Store &amp; Billing to show a QR here.
                </span>
            </div>
        );
    }

    if (!link) {
        return (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    Cannot build a UPI code for this bill. Check the UPI ID looks like
                    name@bank and the total is above zero.
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background">
            {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={dataUrl}
                    alt={`UPI QR for ${money(amount)}`}
                    width={size}
                    height={size}
                    className="rounded-lg"
                />
            ) : (
                <div
                    style={{ width: size, height: size }}
                    className="flex items-center justify-center"
                >
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <p className="text-lg font-bold text-foreground">{money(amount)}</p>
            <p className="text-xs text-muted-foreground text-center">
                Scan to pay {payeeName ? `${payeeName} · ` : ""}
                <span className="font-mono">{upiId}</span>
            </p>
            <p className="text-[11px] text-muted-foreground text-center">
                Confirm the sale only after the payment shows as received.
            </p>
        </div>
    );
}

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
