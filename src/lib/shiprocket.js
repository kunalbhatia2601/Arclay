import { getSettings } from './auth';

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Token cache
let tokenCache = {
    token: null,
    expiresAt: 0
};

/**
 * Get Shiprocket authentication token
 */
export async function getShiprocketToken() {
    const now = Date.now();
    
    // Return cached token if still valid (with 5 min buffer)
    if (tokenCache.token && tokenCache.expiresAt > now + 300000) {
        return tokenCache.token;
    }

    const settings = await getSettings();
    const { email, password } = settings.shipping?.shiprocket || {};

    if (!email || !password) {
        throw new Error('Shiprocket credentials not configured');
    }

    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to authenticate with Shiprocket');
    }

    const data = await response.json();
    
    // Cache token for 24 hours (Shiprocket tokens are valid for 10 days)
    tokenCache = {
        token: data.token,
        expiresAt: now + 24 * 60 * 60 * 1000
    };

    return data.token;
}

/**
 * Check if pincode is serviceable
 */
export async function checkServiceability(pickupPincode, deliveryPincode, weight = 0.5, cod = false) {
    const token = await getShiprocketToken();

    const params = new URLSearchParams({
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight.toString(),
        cod: cod ? '1' : '0'
    });

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/serviceability?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return { serviceable: false, couriers: [] };
    }

    const data = await response.json();
    
    return {
        serviceable: data.data?.available_courier_companies?.length > 0,
        couriers: data.data?.available_courier_companies || []
    };
}

/**
 * Get shipping rates for checkout
 */
export async function getShippingRates(pickupPincode, deliveryPincode, weight = 0.5, cod = false) {
    const { serviceable, couriers } = await checkServiceability(pickupPincode, deliveryPincode, weight, cod);

    if (!serviceable) {
        return {
            available: false,
            message: 'Delivery not available to this pincode',
            rates: []
        };
    }

    // Sort by price and return top options
    const sortedCouriers = couriers.sort((a, b) => a.rate - b.rate);

    return {
        available: true,
        rates: sortedCouriers.map(c => ({
            courierId: c.courier_company_id,
            courierName: c.courier_name,
            rate: c.rate,
            estimatedDays: c.estimated_delivery_days,
            cod: c.cod === 1,
            minWeight: c.min_weight,
            rating: c.rating
        }))
    };
}

/**
 * Create Shiprocket order
 */
export async function createShiprocketOrder(order, settings) {
    const token = await getShiprocketToken();
    const warehouse = settings.shipping?.warehouse || {};

    console.log('Warehouse:', warehouse);

    // Build order items
    const orderItems = order.items.map(item => ({
        name: item.product?.name || 'Product',
        sku: item.variant?.sku || `SKU-${item.product?._id}`,
        units: item.quantity,
        selling_price: item.priceAtOrder,
        discount: 0,
        tax: 0,
        hsn: ''
    }));

    // Calculate total weight
    const totalWeight = settings.shipping?.defaultWeight * order.items.reduce((sum, item) => sum + item.quantity, 0) || 0.5;

    const shiprocketOrder = {
        order_id: order._id.toString(),
        order_date: new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location: warehouse.name || 'Primary',
        channel_id: settings.shipping?.shiprocket?.channelId || '',
        billing_customer_name: order.shippingAddress.fullName.split(' ')[0],
        billing_last_name: order.shippingAddress.fullName.split(' ').slice(1).join(' ') || '',
        billing_address: order.shippingAddress.addressLine1,
        billing_address_2: order.shippingAddress.addressLine2 || '',
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country || 'India',
        billing_email: order.user?.email || '',
        billing_phone: order.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.subtotal || order.totalAmount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: totalWeight
    };

    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shiprocketOrder)
    });

    const data = await response.json();
    console.log('Shiprocket Create Order Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create Shiprocket order');
    }
    
    return {
        orderId: data.order_id,
        shiprocketOrderId: data.order_id?.toString(),
        shipmentId: data.shipment_id?.toString(),
        status: data.status
    };
}

/**
 * Assign courier and generate AWB
 */
export async function assignAWB(shipmentId, courierId) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            shipment_id: shipmentId,
            courier_id: courierId
        })
    });

    const data = await response.json();
    console.log('Shiprocket Assign AWB Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        throw new Error(data.message || 'Failed to assign AWB');
    }
    
    // Handle different response structures from Shiprocket
    const awbCode = data.response?.data?.awb_code || data.awb_code || data.awb_assign_status?.awb_code || '';
    const courierName = data.response?.data?.courier_name || data.courier_name || data.awb_assign_status?.courier_name || '';

    return {
        awbCode,
        courierName,
        courierId: courierId
    };
}

/**
 * Generate shipping label
 */
export async function generateLabel(shipmentId) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/label`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            shipment_id: [shipmentId]
        })
    });

    if (!response.ok) {
        return { labelUrl: null };
    }

    const data = await response.json();
    
    return {
        labelUrl: data.label_url || null
    };
}

/**
 * Schedule pickup
 */
export async function schedulePickup(shipmentId) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            shipment_id: [shipmentId]
        })
    });

    if (!response.ok) {
        return { scheduled: false };
    }

    const data = await response.json();
    
    return {
        scheduled: true,
        pickupStatus: data.pickup_status
    };
}

/**
 * Track shipment
 */
export async function trackShipment(awbCode) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return { tracking: null };
    }

    const data = await response.json();
    const trackingData = data.tracking_data;

    return {
        tracking: {
            status: trackingData?.shipment_status_id,
            statusText: trackingData?.shipment_status,
            currentLocation: trackingData?.current_location,
            deliveredDate: trackingData?.delivered_date,
            etd: trackingData?.etd,
            activities: trackingData?.shipment_track_activities || []
        }
    };
}

/**
 * Cancel shipment
 */
export async function cancelShipment(awbCodes) {
    const token = await getShiprocketToken();

    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel/shipment/awbs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            awbs: Array.isArray(awbCodes) ? awbCodes : [awbCodes]
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to cancel shipment');
    }

    return { cancelled: true };
}

/**
 * Get recommended courier (cheapest with good rating)
 */
export async function getRecommendedCourier(pickupPincode, deliveryPincode, weight = 0.5, cod = false) {
    const { available, rates } = await getShippingRates(pickupPincode, deliveryPincode, weight, cod);

    console.log(available, rates);

    if (!available || rates.length === 0) {
        return null;
    }

    // Get cheapest courier with rating >= 3
    const goodCouriers = rates.filter(r => r.rating >= 3);

    // If no good couriers, return null
    if (goodCouriers.length === 0) {
        return null;
    }

    // increase the rate of good couriers by 10%
    const increasedRates = goodCouriers.map(r => ({
        ...r,
        rate: parseInt((r.rate * 1.1).toFixed(0))
    }));
    
    if (increasedRates.length > 0) {
        return increasedRates[0]; // Already sorted by price
    }

    // Fallback to cheapest
    return {
        ...rates[0],
        rate: parseInt((rates[0].rate * 1.1).toFixed(0))
    }
}

/**
 * Calculate shipping fee based on settings
 */
export async function calculateShippingFee(settings, cartTotal, deliveryPincode = null) {
    const { rateCalculation, flatRate, freeShippingThreshold, warehouse } = settings.shipping || {};

    console.log(rateCalculation, flatRate, freeShippingThreshold, warehouse, deliveryPincode);

    // Free shipping threshold
    if (rateCalculation === 'free_threshold') {
        if (cartTotal >= (freeShippingThreshold || 499)) {
            return { fee: 0, isFree: true, message: 'Free shipping!' };
        }
        return { 
            fee: flatRate || 50, 
            isFree: false, 
            freeAt: freeShippingThreshold,
            message: `Add ₹${(freeShippingThreshold - cartTotal).toFixed(0)} more for free shipping`
        };
    }

    // Flat rate
    if (rateCalculation === 'flat') {
        return { fee: flatRate || 50, isFree: false };
    }

    // Real-time rates
    if (rateCalculation === 'realtime' && deliveryPincode && warehouse?.pincode) {
        try {
            const recommended = await getRecommendedCourier(warehouse.pincode, deliveryPincode);
            if (recommended) {
                return { 
                    fee: recommended.rate, 
                    isFree: false,
                    courier: recommended.courierName,
                    estimatedDays: recommended.estimatedDays
                };
            }
        } catch (error) {
            console.error('Real-time shipping rate error:', error);
        }
        // Fallback to flat rate
        return { fee: flatRate || 50, isFree: false };
    }

    // Default
    return { fee: flatRate || 50, isFree: false };
}
