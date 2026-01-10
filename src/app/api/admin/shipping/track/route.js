import { withAdminProtection, getSettings } from '@/lib/auth';
import { trackShipment } from '@/lib/shiprocket';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

// GET - Track shipment by AWB or order ID
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const awb = searchParams.get('awb');
        const orderId = searchParams.get('orderId');

        const settings = await getSettings();

        if (!settings.shipping?.shiprocket?.isEnabled) {
            return Response.json(
                { success: false, message: 'Shiprocket is not enabled' },
                { status: 400 }
            );
        }

        let awbCode = awb;

        // If orderId provided, get AWB from order
        if (!awbCode && orderId) {
            await connectDB();
            const order = await Order.findById(orderId);
            
            if (!order) {
                return Response.json(
                    { success: false, message: 'Order not found' },
                    { status: 404 }
                );
            }

            awbCode = order.shipping?.awbCode;
        }

        if (!awbCode) {
            return Response.json(
                { success: false, message: 'AWB code required' },
                { status: 400 }
            );
        }

        const { tracking } = await trackShipment(awbCode);

        if (!tracking) {
            return Response.json({
                success: false,
                message: 'Tracking info not available'
            });
        }

        // Update order with latest status if orderId provided
        if (orderId && tracking.status) {
            await connectDB();
            await Order.findByIdAndUpdate(orderId, {
                'shipping.status': tracking.statusText,
                'shipping.lastUpdate': new Date()
            });
        }

        return Response.json({
            success: true,
            tracking
        });
    } catch (error) {
        console.error('Track shipment error:', error);
        return Response.json(
            { success: false, message: error.message || 'Failed to track shipment' },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
