import nodemailer from 'nodemailer';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
}

/**
 * Create nodemailer transporter from settings
 */
function createTransporter(mailSettings) {
    return nodemailer.createTransport({
        host: mailSettings.host,
        port: mailSettings.port,
        secure: mailSettings.isSSL,
        auth: {
            user: mailSettings.email,
            pass: mailSettings.password,
        },
    });
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(toEmail, otp, mailSettings, siteName = 'ESSVORA') {
    try {
        const transporter = createTransporter(mailSettings);

        const mailOptions = {
            from: `"${siteName}" <${mailSettings.email}>`,
            to: toEmail,
            subject: `Your Verification Code - ${siteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Email Verification</h2>
                    <p style="color: #666; font-size: 16px;">Hello,</p>
                    <p style="color: #666; font-size: 16px;">Your verification code is:</p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                </div>
            `,
            text: `Your ${siteName} verification code is: ${otp}. This code will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order, userEmail, mailSettings, siteName = 'ESSVORA') {
    try {
        const transporter = createTransporter(mailSettings);
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const orderUrl = `${baseUrl}/orders/${order._id}`;

        // Calculate items HTML
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>${item.product?.name || 'Product'}</strong>
                    ${item.variant?.attributes ? `<br><span style="color: #666; font-size: 12px;">${Array.from(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>` : ''}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.priceAtOrder * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"${siteName}" <${mailSettings.email}>`,
            to: userEmail,
            subject: `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()} - ${siteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                    <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">${siteName}</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order Confirmation</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 30px;">✓</span>
                                </div>
                                <h2 style="color: #333; margin: 15px 0 5px 0;">Thank you for your order!</h2>
                                <p style="color: #666; margin: 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
                            </div>

                            <!-- Order Details -->
                            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <h3 style="margin: 0 0 15px 0; color: #333;">Order Summary</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #eee;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: center;">Qty</th>
                                            <th style="padding: 10px; text-align: right;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="2" style="padding: 15px 12px; font-weight: bold;">Total</td>
                                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">₹${order.totalAmount.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- Shipping Address -->
                            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <h3 style="margin: 0 0 10px 0; color: #333;">Shipping Address</h3>
                                <p style="color: #666; margin: 0; line-height: 1.6;">
                                    ${order.shippingAddress.fullName}<br>
                                    ${order.shippingAddress.addressLine1}<br>
                                    ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                                    ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                                    Phone: ${order.shippingAddress.phone}
                                </p>
                            </div>

                            <!-- Payment Info -->
                            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <p style="margin: 0; color: #666;">
                                    <strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center;">
                                <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">View Order Details</a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `,
            text: `Thank you for your order!\n\nOrder #${order._id.toString().slice(-8).toUpperCase()}\nTotal: ₹${order.totalAmount.toLocaleString()}\n\nView your order: ${orderUrl}`,
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Order confirmation email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send cart reminder email
 */
export async function sendCartReminderEmail(toEmail, userName, cartItems, totalValue, mailSettings, siteName = 'ESSVORA') {
    try {
        const transporter = createTransporter(mailSettings);
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const cartUrl = `${baseUrl}/cart`;

        // Calculate items HTML
        const itemsHtml = cartItems.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div>
                            <strong>${item.productName}</strong>
                            ${item.variantAttributes ? `<br><span style="color: #666; font-size: 12px;">${Array.from(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"${siteName}" <${mailSettings.email}>`,
            to: toEmail,
            subject: `Your cart is waiting for you! - ${siteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                    <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">${siteName}</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Don't forget your items!</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="width: 60px; height: 60px; background: #f59e0b; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 30px;">🛒</span>
                                </div>
                                <h2 style="color: #333; margin: 15px 0 5px 0;">Hi ${userName || 'there'}!</h2>
                                <p style="color: #666; margin: 0;">You left some items in your cart</p>
                            </div>

                            <!-- Cart Items -->
                            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <h3 style="margin: 0 0 15px 0; color: #333;">Your Cart</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #eee;">
                                            <th style="padding: 10px; text-align: left;">Item</th>
                                            <th style="padding: 10px; text-align: center;">Qty</th>
                                            <th style="padding: 10px; text-align: right;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="2" style="padding: 15px 12px; font-weight: bold;">Total</td>
                                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">₹${totalValue.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-bottom: 20px;">
                                <a href="${cartUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Complete Your Purchase</a>
                            </div>

                            <p style="color: #666; text-align: center; font-size: 14px;">
                                Your items won't be reserved for long. Complete your order now before they sell out!
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                            <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">If you no longer wish to receive these emails, simply complete or clear your cart.</p>
                        </div>
                    </div>
                </div>
            `,
            text: `Hi ${userName || 'there'}!\n\nYou left some items in your cart worth ₹${totalValue.toLocaleString()}.\n\nComplete your purchase: ${cartUrl}\n\n${siteName}`,
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Cart reminder email error:', error);
        return { success: false, error: error.message };
    }
}
