/**
 * Create a Stripe Payment Intent
 * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR, cents for USD)
 * @param {string} orderId - Our internal order ID
 * @param {string} secretKey - Stripe Secret Key from settings
 * @param {string} currency - Currency code (default: INR)
 * @returns {Promise<object>} Payment Intent object
 */
export async function createStripePaymentIntent(amount, orderId, secretKey, currency = 'inr') {
    if (!secretKey) {
        throw new Error('Stripe secret key not configured');
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            amount: amount.toString(),
            currency,
            'metadata[order_id]': orderId,
            automatic_payment_methods: 'enabled'
        }).toString()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create Stripe payment intent');
    }

    return await response.json();
}

/**
 * Retrieve a Stripe Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {string} secretKey - Stripe Secret Key from settings
 * @returns {Promise<object>} Payment Intent object
 */
export async function retrieveStripePaymentIntent(paymentIntentId, secretKey) {
    if (!secretKey) {
        throw new Error('Stripe secret key not configured');
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        headers: {
            'Authorization': `Bearer ${secretKey}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to retrieve payment intent');
    }

    return await response.json();
}
