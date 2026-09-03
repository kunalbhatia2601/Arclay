/**
 * Page numbers to render for a pager: always 1 and the last page, a window
 * around the current page, and "…" where pages are skipped.
 *   pageWindow(7, 20) → [1, "…", 6, 7, 8, "…", 20]
 *   pageWindow(2, 5)  → [1, 2, 3, 4, 5]
 */
export function pageWindow(current, total, around = 1) {
    if (total <= 1) return [1];
    // Few enough to just show them all — no point hiding page 4 of 5.
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total]);
    for (let p = current - around; p <= current + around; p++) {
        if (p >= 1 && p <= total) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
        out.push(sorted[i]);
    }
    return out;
}
