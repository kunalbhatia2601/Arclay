import crypto from 'crypto';

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (100 paise = 1 INR)
 * @param {string} orderId - Our internal order ID
 * @param {string} keyId - Razorpay Key ID from settings
 * @param {string} keySecret - Razorpay Key Secret from settings
 * @param {string} currency - Currency code (default: INR)
 * @returns {Promise<object>} Razorpay order object
 */
export async function createRazorpayOrder(amount, orderId, keyId, keySecret, currency = 'INR') {
    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured');
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount,
            currency,
            receipt: orderId,
            notes: {
                order_id: orderId
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.description || 'Failed to create Razorpay order');
    }

    return await response.json();
}

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @param {string} keySecret - Razorpay Key Secret from settings
 * @returns {boolean} True if signature is valid
 */
export function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, keySecret) {
    if (!keySecret) {
        throw new Error('Razorpay secret key not configured');
    }

    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated_signature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

    return generated_signature === razorpaySignature;
}
