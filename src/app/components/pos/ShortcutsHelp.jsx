"use client";

import { X } from "lucide-react";

export const SHORTCUTS = [
    ["F2", "New bill"],
    ["F3", "Focus product search"],
    ["F4", "Focus barcode box"],
    ["F6", "Cycle payment method"],
    ["F7", "Quick item (not in catalog)"],
    ["F8", "Day report"],
    ["F9", "Complete sale"],
    ["Ctrl + ←/→", "Previous / next bill"],
    ["Esc", "Close dialog"],
    ["?", "This help"],
];

export default function ShortcutsHelp({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-sm">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-bold text-lg">Keyboard shortcuts</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <ul className="p-4 space-y-2">
                    {SHORTCUTS.map(([key, label]) => (
                        <li key={key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <kbd className="px-2 py-1 rounded-md border border-border bg-muted font-mono text-xs">
                                {key}
                            </kbd>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
