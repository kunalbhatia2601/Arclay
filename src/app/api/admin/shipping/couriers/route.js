import { withAdminProtection, getSettings } from '@/lib/auth';
import { getShippingRates, checkServiceability } from '@/lib/shiprocket';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

// POST - Get available couriers for an order
async function postHandler(req) {
    try {
        const { orderId } = await req.json();
        const settings = await getSettings();

        if (!settings.shipping?.shiprocket?.isEnabled) {
            return Response.json(
                { success: false, message: 'Shiprocket is not enabled' },
                { status: 400 }
            );
        }

        await connectDB();
        const order = await Order.findById(orderId).populate('user', 'email');

        if (!order) {
            return Response.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        const warehousePincode = settings.shipping?.warehouse?.pincode;
        const deliveryPincode = order.shippingAddress.pincode;
        const isCOD = order.paymentMethod === 'cod';
        
        // Calculate weight
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const weight = (settings.shipping?.defaultWeight || 0.5) * itemCount;

        const { available, rates, message } = await getShippingRates(
            warehousePincode,
            deliveryPincode,
            weight,
            isCOD
        );

        if (!available) {
            return Response.json({
                success: false,
                message: message || 'Delivery not available to this pincode'
            });
        }

        return Response.json({
            success: true,
            couriers: rates,
            orderId: order._id
        });
    } catch (error) {
        console.error('Get couriers error:', error);
        return Response.json(
            { success: false, message: error.message || 'Failed to get couriers' },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
