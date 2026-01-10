import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

// Shiprocket webhook status mapping
const STATUS_MAP = {
    1: 'Pickup Scheduled',
    2: 'Pickup Generated', 
    3: 'Pickup Queued',
    4: 'Manifested',
    5: 'Shipped',
    6: 'In Transit',
    7: 'Out For Delivery',
    8: 'Delivered',
    9: 'Undelivered',
    10: 'Delayed',
    12: 'Lost',
    13: 'Pickup Error',
    14: 'RTO Initiated',
    15: 'RTO Delivered',
    16: 'RTO Acknowledged',
    17: 'Cancelled',
    18: 'Pickup Rescheduled',
    19: 'OFD Attempt Failed',
    20: 'RTO In Transit',
    21: 'Self Fulfilled'
};

// POST - Shiprocket webhook for status updates
export async function POST(req) {
    try {
        const data = await req.json();
        
        // Shiprocket sends various events
        // Common fields: awb, order_id, current_status, current_status_id
        const { awb, order_id, current_status, current_status_id, etd } = data;

        if (!awb && !order_id) {
            return Response.json({ success: true }); // Just acknowledge
        }

        await connectDB();

        // Find order by AWB or Shiprocket order ID
        let order;
        if (awb) {
            order = await Order.findOne({ 'shipping.awbCode': awb });
        }
        if (!order && order_id) {
            order = await Order.findOne({ 'shipping.shiprocketOrderId': order_id.toString() });
        }

        if (!order) {
            console.log('Webhook: Order not found for', { awb, order_id });
            return Response.json({ success: true }); // Still acknowledge
        }

        // Update shipping status
        const statusText = STATUS_MAP[current_status_id] || current_status || 'Unknown';
        
        order.shipping.status = statusText;
        order.shipping.lastUpdate = new Date();
        
        if (etd) {
            order.shipping.estimatedDelivery = new Date(etd);
        }

        // Update order status based on shipment status
        if (current_status_id === 8) {
            order.orderStatus = 'delivered';
        } else if (current_status_id === 17) {
            order.orderStatus = 'cancelled';
        } else if ([14, 15, 16, 20].includes(current_status_id)) {
            // RTO statuses - keep as processing
            order.orderStatus = 'processing';
        }

        await order.save();

        console.log(`Webhook: Updated order ${order._id} - Status: ${statusText}`);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Shiprocket webhook error:', error);
        // Still return 200 to acknowledge receipt
        return Response.json({ success: true });
    }
}
