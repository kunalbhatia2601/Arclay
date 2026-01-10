import { getSettings } from '@/lib/auth';
import { checkServiceability } from '@/lib/shiprocket';

// POST - Check if pincode is serviceable
export async function POST(req) {
    try {
        const { pincode, cod = false } = await req.json();
        const settings = await getSettings();

        if (!settings.shipping?.shiprocket?.isEnabled) {
            // If Shiprocket not enabled, assume all pincodes are serviceable
            return Response.json({
                success: true,
                serviceable: true,
                estimatedDays: null
            });
        }

        const warehousePincode = settings.shipping?.warehouse?.pincode;
        
        if (!warehousePincode) {
            return Response.json({
                success: true,
                serviceable: true, // Assume serviceable if no warehouse configured
                estimatedDays: null
            });
        }

        const weight = settings.shipping?.defaultWeight || 0.5;
        const result = await checkServiceability(warehousePincode, pincode, weight, cod);

        // Get estimated delivery from fastest courier
        let estimatedDays = null;
        if (result.couriers && result.couriers.length > 0) {
            // Sort by estimated delivery days and get the fastest
            const sorted = result.couriers.sort((a, b) => 
                (a.estimated_delivery_days || 99) - (b.estimated_delivery_days || 99)
            );
            estimatedDays = sorted[0]?.estimated_delivery_days || null;
        }

        return Response.json({
            success: true,
            serviceable: result.serviceable,
            couriers: result.couriers?.length || 0,
            estimatedDays
        });
    } catch (error) {
        console.error('Serviceability check error:', error);
        return Response.json({
            success: true,
            serviceable: true, // Default to serviceable on error
            estimatedDays: null
        });
    }
}
