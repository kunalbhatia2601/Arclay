import 'package:flutter/material.dart';
import '../../config/theme.dart';
import 'policy_detail_screen.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        children: [
          // ──── Support Options ────
          Text(
            'Get Help',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.email_outlined),
                  title: const Text('Email Us'),
                  subtitle: const Text('support@essvora.com'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Email app would open here'),
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: const Text('Call Us'),
                  subtitle: const Text('+91 98765 43210'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Phone dialer would open here'),
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.chat_outlined),
                  title: const Text('Live Chat'),
                  subtitle: const Text('Available 9 AM – 6 PM'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Chat would open here')),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: AppTheme.spacing24),

          // ──── Policies ────
          Text(
            'Legal & Policies',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: Column(
              children: [
                _PolicyTile(
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  content: _privacyPolicy,
                ),
                const Divider(height: 1),
                _PolicyTile(
                  icon: Icons.description_outlined,
                  title: 'Terms & Conditions',
                  content: _termsConditions,
                ),
                const Divider(height: 1),
                _PolicyTile(
                  icon: Icons.replay_outlined,
                  title: 'Refund Policy',
                  content: _refundPolicy,
                ),
                const Divider(height: 1),
                _PolicyTile(
                  icon: Icons.local_shipping_outlined,
                  title: 'Shipping Policy',
                  content: _shippingPolicy,
                ),
              ],
            ),
          ),

          const SizedBox(height: AppTheme.spacing24),

          // ──── FAQ ────
          Text(
            'FAQs',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.help_outline),
              title: const Text('How do I track my order?'),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'Go to the Orders tab, tap on any order to view its status and tracking details. You will receive updates via email and push notifications.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.help_outline),
              title: const Text('How do I return a product?'),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'Contact our support team within 7 days of delivery. We will arrange a pickup and process your refund within 5-7 business days after receiving the item.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacing8),
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.help_outline),
              title: const Text('What payment methods do you accept?'),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'We accept all major credit/debit cards, UPI, net banking via Razorpay, and Cash on Delivery (COD) for eligible pin codes.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppTheme.spacing32),
        ],
      ),
    );
  }
}

class _PolicyTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;

  const _PolicyTile({
    required this.icon,
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PolicyDetailScreen(title: title, content: content),
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════
// DUMMY CONTENT
// ═══════════════════════════════════════

const String _privacyPolicy = '''
## Privacy Policy

**Last Updated:** February 2026

### Information We Collect

We collect information you provide directly to us, such as when you create an account, make a purchase, contact us for support, or otherwise communicate with us.

**Personal Information:**
- Name, email address, and phone number
- Shipping and billing addresses
- Payment information (processed securely via Razorpay)
- Order history and preferences

### How We Use Your Information

We use the information we collect to:
- Process and fulfill your orders
- Send you order confirmations and shipping updates
- Respond to your comments, questions, and customer service requests
- Send promotional communications (with your consent)
- Monitor and analyze trends, usage, and activities

### Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

### Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt out of marketing communications

### Contact Us

For privacy-related inquiries, contact us at privacy@essvora.com.
''';

const String _termsConditions = '''
## Terms & Conditions

**Last Updated:** February 2026

### 1. Acceptance of Terms

By accessing and using the Essvora mobile application, you agree to be bound by these Terms & Conditions.

### 2. Account Registration

- You must be at least 18 years old to create an account
- You are responsible for maintaining the confidentiality of your account
- You agree to provide accurate and complete information

### 3. Orders and Payments

- All prices are listed in Indian Rupees (INR) and include applicable taxes
- We reserve the right to refuse or cancel any order
- Payment must be made at the time of order placement (except COD)

### 4. Product Information

- We strive to display product colors and images as accurately as possible
- Product availability is subject to change without notice
- We reserve the right to limit quantities

### 5. Intellectual Property

All content on the app, including text, graphics, logos, and images, is the property of Essvora and protected by copyright laws.

### 6. Limitation of Liability

Essvora shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the application.

### 7. Governing Law

These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts of India.

### 8. Contact

For questions about these Terms, contact us at legal@essvora.com.
''';

const String _refundPolicy = '''
## Refund Policy

**Last Updated:** February 2026

### Eligibility for Refund

You may request a refund within **7 days** of delivery if:
- The product is damaged or defective
- You received the wrong product
- The product does not match the description

### Non-Refundable Items

The following items are **not eligible** for refund:
- Opened food products (for hygiene reasons)
- Products with removed tags or labels
- Items purchased during clearance sales

### Refund Process

1. **Initiate a Return:** Contact our support team via email or phone within 7 days of delivery
2. **Return Pickup:** We will arrange a pickup from your address at no additional cost
3. **Inspection:** The returned product will be inspected upon receipt
4. **Refund Processing:** Approved refunds are processed within 5-7 business days

### Refund Methods

- **Online Payments:** Refunded to the original payment method
- **COD Orders:** Refunded via bank transfer (NEFT/IMPS)

### Partial Refunds

In some cases, partial refunds may be granted for products with minor cosmetic damage that doesn't affect functionality.

### Contact

For refund inquiries, email returns@essvora.com or call +91 98765 43210.
''';

const String _shippingPolicy = '''
## Shipping Policy

**Last Updated:** February 2026

### Delivery Areas

We currently deliver across India. Enter your pincode on the product page to check delivery availability.

### Shipping Charges

- **Free Shipping:** On orders above ₹499
- **Standard Shipping:** ₹49 for orders below ₹499
- **Express Shipping:** ₹99 (delivery within 2-3 business days)

### Estimated Delivery Times

| Region | Standard | Express |
|--------|----------|---------|
| Metro Cities | 3-5 days | 1-2 days |
| Tier 2 Cities | 5-7 days | 2-3 days |
| Other Areas | 7-10 days | 3-5 days |

### Order Tracking

Once your order is shipped, you will receive a tracking number via email and push notification. You can track your order from the Orders section of the app.

### Shipping Partners

We partner with leading courier services including BlueDart, Delhivery, and DTDC to ensure safe and timely delivery.

### Damaged or Lost Shipments

If your package arrives damaged or is lost in transit, please contact us immediately. We will arrange a replacement or full refund.

### Contact

For shipping inquiries, email shipping@essvora.com.
''';
