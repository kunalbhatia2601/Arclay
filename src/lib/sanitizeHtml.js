/**
 * Minimal HTML sanitiser for admin-authored markup.
 *
 * The custom-HTML block is admin-only, but its output is rendered for every
 * visitor — a compromised or careless admin session would otherwise become
 * stored XSS on the storefront. Structural markup and styling are allowed;
 * anything that executes is not.
 *
 * Deliberately conservative and dependency-free. It is not a general-purpose
 * sanitiser for untrusted input.
 */

// Elements removed entirely, including their contents.
const FORBIDDEN_ELEMENTS = [
    'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta',
    'base', 'form', 'input', 'button', 'textarea', 'select', 'option',
];

export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';

    let clean = html;

    // Drop dangerous elements with their content.
    for (const tag of FORBIDDEN_ELEMENTS) {
        clean = clean.replace(
            new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'),
            ''
        );
        // ...and any unclosed/self-closing occurrence left behind.
        clean = clean.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
    }

    // Inline event handlers: onclick=, onerror=, onload=, ...
    clean = clean.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
    clean = clean.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
    clean = clean.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

    // URLs that execute: javascript:, vbscript:, and data: documents.
    clean = clean.replace(/(href|src|xlink:href)\s*=\s*"(\s*(?:javascript|vbscript|data:text\/html)[^"]*)"/gi, '$1="#"');
    clean = clean.replace(/(href|src|xlink:href)\s*=\s*'(\s*(?:javascript|vbscript|data:text\/html)[^']*)'/gi, "$1='#'");

    return clean;
}
