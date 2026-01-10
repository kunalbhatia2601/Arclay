import { getSettings } from '@/lib/auth';
import { calculateShippingFee, getShippingRates } from '@/lib/shiprocket';

// POST - Calculate shipping rates for checkout
export async function POST(req) {
    try {
        const { pincode, cartTotal, weight } = await req.json();
        const settings = await getSettings();

        if (!settings.shipping?.shiprocket?.isEnabled) {
            // Return default flat rate if Shiprocket not enabled
            const { freeShippingThreshold, flatRate } = settings.shipping || {};

            if (cartTotal >= (freeShippingThreshold || 499)) {
                return Response.json({
                    success: true,
                    fee: 0,
                    isFree: true,
                    message: 'Free shipping!'
                });
            }

            return Response.json({
                success: true,
                fee: flatRate || 50,
                isFree: false,
                freeAt: freeShippingThreshold || 499
            });
        }

        // Calculate shipping fee based on settings
        const result = await calculateShippingFee(settings, cartTotal, pincode);

        return Response.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Shipping rates error:', error);
        return Response.json(
            { success: false, message: 'Failed to calculate shipping' },
            { status: 500 }
        );
    }
}
