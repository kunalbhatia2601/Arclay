"use client";

import { createContext, useContext } from "react";

/**
 * Makes the default card preset available to every ProductCard on the site.
 *
 * Block-built pages pass a preset explicitly, but cards also render from
 * places the page builder does not own — the legacy home sections, search
 * results, the wishlist, the cart. Without this they would silently fall back
 * to the built-in defaults and ignore whatever the admin configured.
 */
const CardPresetContext = createContext(null);

export function useDefaultCardPreset() {
    return useContext(CardPresetContext);
}

export default function CardPresetProvider({ preset, children }) {
    return (
        <CardPresetContext.Provider value={preset || null}>
            {children}
        </CardPresetContext.Provider>
    );
}
