import { withAdminProtection, getSettings } from '@/lib/auth';
import { 
    createShiprocketOrder, 
    assignAWB, 
    generateLabel, 
    schedulePickup,
    getRecommendedCourier 
} from '@/lib/shiprocket';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

// POST - Create shipment for an order
async function postHandler(req) {
    try {
        const { orderId, courierId } = await req.json();
        const settings = await getSettings();

        if (!settings.shipping?.shiprocket?.isEnabled) {
            return Response.json(
                { success: false, message: 'Shiprocket is not enabled' },
                { status: 400 }
            );
        }

        await connectDB();
        const order = await Order.findById(orderId).populate('user', 'email').populate('items.product', 'name');

        if (!order) {
            return Response.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if shipment already exists
        if (order.shipping?.shiprocketOrderId) {
            return Response.json(
                { success: false, message: 'Shipment already created for this order' },
                { status: 400 }
            );
        }

        // Create Shiprocket order
        const shiprocketOrder = await createShiprocketOrder(order, settings);

        // Determine courier ID
        let selectedCourierId = courierId;
        
        if (!selectedCourierId) {
            // Auto-select best courier
            const warehousePincode = settings.shipping?.warehouse?.pincode;
            const deliveryPincode = order.shippingAddress.pincode;
            const isCOD = order.paymentMethod === 'cod';
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const weight = (settings.shipping?.defaultWeight || 0.5) * itemCount;

            const recommended = await getRecommendedCourier(warehousePincode, deliveryPincode, weight, isCOD);
            
            if (recommended) {
                selectedCourierId = recommended.courierId;
            }
        }

        // Assign AWB if courier selected
        let awbData = null;
        if (selectedCourierId && shiprocketOrder.shipmentId) {
            awbData = await assignAWB(shiprocketOrder.shipmentId, selectedCourierId);
        }

        // Generate label
        let label = null;
        if (shiprocketOrder.shipmentId) {
            const labelResult = await generateLabel(shiprocketOrder.shipmentId);
            label = labelResult.labelUrl;
        }

        // Schedule pickup
        if (shiprocketOrder.shipmentId) {
            await schedulePickup(shiprocketOrder.shipmentId).catch(() => {}); // Non-blocking
        }

        // Update order with shipping info
        order.shipping = {
            shiprocketOrderId: shiprocketOrder.shiprocketOrderId,
            shipmentId: shiprocketOrder.shipmentId,
            awbCode: awbData?.awbCode || '',
            courierName: awbData?.courierName || '',
            courierId: selectedCourierId || null,
            label: label || '',
            trackingUrl: awbData?.awbCode ? `https://shiprocket.co/tracking/${awbData.awbCode}` : '',
            status: 'Shipment Created',
            lastUpdate: new Date()
        };
        order.orderStatus = 'shipped';
        await order.save();

        return Response.json({
            success: true,
            message: 'Shipment created successfully',
            shipping: order.shipping
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        return Response.json(
            { success: false, message: error.message || 'Failed to create shipment' },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
