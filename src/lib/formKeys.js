/**
 * Hardware barcode scanners append Enter after the code. Inside a <form> that
 * submits the whole product. Block Enter except in textareas and submit buttons.
 */
export function preventEnterSubmit(event) {
    if (event.key !== 'Enter') return;
    const tag = event.target?.tagName;
    if (tag === 'TEXTAREA') return;
    if (tag === 'BUTTON' && event.target.type === 'submit') return;
    if (tag === 'INPUT' && event.target.type === 'submit') return;
    event.preventDefault();
}
