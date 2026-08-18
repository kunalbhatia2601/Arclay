"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera } from "lucide-react";

export default function BarcodeScanner({ value, onChange, onScanSuccess }) {
    const [isScanning, setIsScanning] = useState(false);
    const sdkRef = useRef(null);

    const LICENSE_KEY =
  "YkxNvJ6a7AbhwhzwqZ4XxO44qBa8Tu" +
  "oqJUOnIErCwk+VP1bYDlMCMQWdFVtF" +
  "EnTudf2QD2LXBZL9vdUoHWyRtpkkAs" +
  "FBHTLf7J/EC4Oz6ZgFAHaRhIAlrv7i" +
  "zTqGaOzamPbu2N+2fIMA1lnhBUm+nX" +
  "0LErUb8b0XA1CyNaIWM/rAA3JVWQux" +
  "cNZDoUsxTv2gPXFoaCeAcuZ9wkmQkK" +
  "7e0T4U/m6UaAw2g3tpCR6NPOOaPqS7" +
  "Fp7jIoEzAyF4sttuP/9JO4rBQvBQMn" +
  "UHTDKEgPm5kP4QFaZu5cRL3e0gZ+Lt" +
  "YxqBR1+e8aLTrh+W3oYeRjIpxZLHIZ" +
  "9Cezr89/nq9Q==\nU2NhbmJvdFNESw" +
  "psb2NhbGhvc3R8dmVyY2VsLmFwcAox" +
  "Nzc0MzEwMzk5CjgzODg2MDcKOA==\n";

    // Load Scanbot SDK script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/scanbot-web-sdk@latest/bundle/ScanbotSDK.ui2.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup
        };
    }, []);

    const startScanning = useCallback(async () => {
        if (!window.ScanbotSDK) {
            alert('Scanner not loaded. Please refresh and try again.');
            return;
        }

        setIsScanning(true);

        try {
            const sdk = await window.ScanbotSDK.initialize({
                licenseKey: "",
                enginePath: 'https://cdn.jsdelivr.net/npm/scanbot-web-sdk@latest/bundle/bin/complete/'
            });

            sdkRef.current = sdk;

            // Configure barcode scanner
            const config = new window.ScanbotSDK.UI.Config.BarcodeScannerScreenConfiguration();
            config.barcodeFormats = [
                'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E',
                'CODE_128', 'CODE_39', 'CODE_93', 'ITF',
                'QR_CODE', 'DATA_MATRIX'
            ];
            config.cancelButtonTitle = 'Cancel';
            config.topBarBackButtonTitle = 'Back';

            // Open scanner
            const result = await window.ScanbotSDK.UI.createBarcodeScanner(config);

            if (result.items && result.items.length > 0) {
                const barcode = result.items[0].barcode;
                onChange(barcode.text);
                if (onScanSuccess) {
                    onScanSuccess(barcode.text);
                }
            }
        } catch (err) {
            console.error('Scanner error:', err);
            alert('Error: ' + err.message);
        } finally {
            setIsScanning(false);
        }
    }, [onChange, onScanSuccess]);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter or scan barcode"
                />
                <button
                    type="button"
                    onClick={startScanning}
                    disabled={isScanning}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                >
                    <Camera className="w-4 h-4" />
                    {isScanning ? 'Opening...' : 'Scan'}
                </button>
            </div>
        </div>
    );
}
