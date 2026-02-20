import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/cart.dart';
import '../../models/address.dart';
import '../../services/address_service.dart';
import '../../services/order_service.dart';
import '../../services/payment_service.dart';
import '../address/address_list_screen.dart';
import '../address/address_form_screen.dart';
import '../home/home_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final Cart cart;

  const CheckoutScreen({super.key, required this.cart});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _addressService = AddressService();
  final _orderService = OrderService();
  final _paymentService = PaymentService();

  // State
  List<Address> _addresses = [];
  Address? _selectedAddress;
  String _paymentMethod = AppConstants.paymentMethodCOD;
  bool _isLoadingAddresses = true;
  bool _isPlacingOrder = false;
  String? _error;

  // Razorpay
  late Razorpay _razorpay;
  String? _pendingOrderId; // order ID waiting for payment

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _loadAddresses();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoadingAddresses = true);

    final response = await _addressService.getAddresses();

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _addresses = response.data!;
        // Auto-select the default or first address
        _selectedAddress = _addresses.isNotEmpty
            ? _addresses.firstWhere(
                (a) => a.isDefault,
                orElse: () => _addresses.first,
              )
            : null;
        _isLoadingAddresses = false;
      });
    } else {
      setState(() {
        _isLoadingAddresses = false;
      });
    }
  }

  Future<void> _selectAddress() async {
    final result = await Navigator.of(context).push<Address>(
      MaterialPageRoute(
        builder: (_) => const AddressListScreen(selectionMode: true),
      ),
    );

    if (result != null && mounted) {
      setState(() => _selectedAddress = result);
    }
  }

  Future<void> _addNewAddress() async {
    final result = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => const AddressFormScreen()));

    if (result == true && mounted) {
      await _loadAddresses();
    }
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a delivery address'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      return;
    }

    setState(() {
      _isPlacingOrder = true;
      _error = null;
    });

    // Build shipping address from selected address
    final shippingAddress = {
      'fullName': _selectedAddress!.fullName,
      'phone': _selectedAddress!.phone,
      'addressLine1': _selectedAddress!.addressLine1,
      'addressLine2': _selectedAddress!.addressLine2,
      'city': _selectedAddress!.city,
      'state': _selectedAddress!.state,
      'pincode': _selectedAddress!.pincode,
      'country': _selectedAddress!.country,
    };

    // Create the order
    final orderResponse = await _orderService.createOrder(
      shippingAddress: shippingAddress,
      paymentMethod: _paymentMethod,
    );

    if (!mounted) return;

    if (!orderResponse.success || orderResponse.data == null) {
      setState(() {
        _isPlacingOrder = false;
        _error = orderResponse.message ?? 'Failed to place order';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(orderResponse.message ?? 'Failed to place order'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      return;
    }

    final order = orderResponse.data!;

    if (_paymentMethod == AppConstants.paymentMethodCOD) {
      // COD — order is placed immediately
      setState(() => _isPlacingOrder = false);
      _showOrderSuccess(order.id);
    } else if (_paymentMethod == AppConstants.paymentMethodRazorpay) {
      // Razorpay — need to create payment order and open checkout
      _pendingOrderId = order.id;
      await _initiateRazorpayPayment(order.id);
    }
  }

  Future<void> _initiateRazorpayPayment(String orderId) async {
    final rpResponse = await _paymentService.createRazorpayOrder(orderId);

    if (!mounted) return;

    if (!rpResponse.success || rpResponse.data == null) {
      setState(() {
        _isPlacingOrder = false;
        _error = rpResponse.message ?? 'Failed to create payment order';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(rpResponse.message ?? 'Failed to create payment order'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      return;
    }

    final rpOrder = rpResponse.data!;

    // Open Razorpay checkout
    var options = {
      'key': rpOrder.keyId,
      'amount': rpOrder.amount, // in paise
      'name': rpOrder.name.isNotEmpty ? rpOrder.name : AppConstants.appName,
      'order_id': rpOrder.razorpayOrderId,
      'description': 'Order Payment',
      'prefill': {
        'contact': _selectedAddress?.phone ?? '',
        'email': '', // will be filled by user
      },
      'theme': {
        'color': '#556B2F', // primary olive
      },
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      setState(() => _isPlacingOrder = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to open payment: $e'),
            backgroundColor: AppTheme.accentColor,
          ),
        );
      }
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (_pendingOrderId == null) return;

    // Verify payment on backend
    final verifyResponse = await _paymentService.verifyRazorpayPayment(
      orderId: _pendingOrderId!,
      razorpayOrderId: response.orderId ?? '',
      razorpayPaymentId: response.paymentId ?? '',
      razorpaySignature: response.signature ?? '',
    );

    if (!mounted) return;

    setState(() => _isPlacingOrder = false);

    if (verifyResponse.success) {
      _showOrderSuccess(_pendingOrderId!);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            verifyResponse.message ?? 'Payment verification failed',
          ),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() => _isPlacingOrder = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Payment failed'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // External wallet selected
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('External wallet selected: ${response.walletName}'),
        ),
      );
    }
  }

  void _showOrderSuccess(String orderId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, size: 72, color: Colors.green),
            const SizedBox(height: AppTheme.spacing16),
            Text('Order Placed!', style: Theme.of(ctx).textTheme.headlineSmall),
            const SizedBox(height: AppTheme.spacing8),
            Text(
              _paymentMethod == AppConstants.paymentMethodCOD
                  ? 'Your order has been placed successfully.\nPay on delivery.'
                  : 'Payment successful!\nYour order has been confirmed.',
              textAlign: TextAlign.center,
              style: Theme.of(
                ctx,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              // Go to order detail
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(
                  builder: (_) => const HomeScreen(initialTabIndex: 3),
                ),
                (route) => false,
              );
            },
            child: const Text('View Orders'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const HomeScreen()),
                (route) => false,
              );
            },
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: _isLoadingAddresses
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppTheme.spacing16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. Shipping Address
                        _buildAddressSection(),
                        const SizedBox(height: AppTheme.spacing24),

                        // 2. Order Summary
                        _buildOrderSummary(),
                        const SizedBox(height: AppTheme.spacing24),

                        // 3. Payment Method
                        _buildPaymentMethod(),
                        const SizedBox(height: AppTheme.spacing16),

                        if (_error != null)
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppTheme.spacing16,
                            ),
                            child: Text(
                              _error!,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: AppTheme.accentColor),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                // Bottom Bar
                _buildBottomBar(),
              ],
            ),
    );
  }

  // ─────────── Address Section ───────────

  Widget _buildAddressSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Delivery Address',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (_addresses.isNotEmpty)
              TextButton(
                onPressed: _selectAddress,
                child: const Text('Change'),
              ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing12),
        if (_selectedAddress != null)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(
                            AppTheme.radiusSm,
                          ),
                        ),
                        child: Text(
                          _selectedAddress!.label,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing8),
                      Expanded(
                        child: Text(
                          _selectedAddress!.fullName,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing8),
                  Text(
                    _selectedAddress!.fullAddress,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  Text(
                    'Phone: ${_selectedAddress!.phone}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          Card(
            child: InkWell(
              onTap: _addNewAddress,
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing24),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(
                        Icons.add_location_outlined,
                        size: 40,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(height: AppTheme.spacing8),
                      Text(
                        'Add Delivery Address',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: AppTheme.primaryColor),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  // ─────────── Order Summary ───────────

  Widget _buildOrderSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Order Summary (${widget.cart.itemCount} items)',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppTheme.spacing12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacing12),
            child: Column(
              children: widget.cart.items.asMap().entries.map((entry) {
                final item = entry.value;
                final isLast = entry.key == widget.cart.items.length - 1;
                final variantText = item.variant.attributes.entries
                    .map((e) => '${e.key}: ${e.value}')
                    .join(', ');

                return Column(
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(
                            AppTheme.radiusMd,
                          ),
                          child: item.product.images.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: item.product.images.first,
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Container(
                                    width: 50,
                                    height: 50,
                                    color: AppTheme.surfaceColor,
                                    child: const Icon(
                                      Icons.image_outlined,
                                      size: 24,
                                    ),
                                  ),
                                )
                              : Container(
                                  width: 50,
                                  height: 50,
                                  color: AppTheme.surfaceColor,
                                  child: const Icon(
                                    Icons.image_outlined,
                                    size: 24,
                                  ),
                                ),
                        ),
                        const SizedBox(width: AppTheme.spacing12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w500),
                              ),
                              if (variantText.isNotEmpty)
                                Text(
                                  variantText,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: AppTheme.textSecondary),
                                ),
                              Text(
                                'Qty: ${item.quantity} × ₹${item.variant.price.toStringAsFixed(0)}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${item.subtotal.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    if (!isLast) const Divider(height: AppTheme.spacing16),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  // ─────────── Payment Method ───────────

  Widget _buildPaymentMethod() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment Method', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppTheme.spacing12),
        Card(
          child: Column(
            children: [
              RadioListTile<String>(
                title: const Text('Cash on Delivery'),
                subtitle: const Text('Pay when you receive'),
                secondary: const Icon(Icons.money, color: Colors.green),
                value: AppConstants.paymentMethodCOD,
                groupValue: _paymentMethod,
                activeColor: AppTheme.primaryColor,
                onChanged: (v) => setState(() => _paymentMethod = v!),
              ),
              const Divider(height: 1),
              RadioListTile<String>(
                title: const Text('Razorpay'),
                subtitle: const Text('UPI, Cards, Netbanking, Wallets'),
                secondary: const Icon(Icons.payment, color: Colors.blue),
                value: AppConstants.paymentMethodRazorpay,
                groupValue: _paymentMethod,
                activeColor: AppTheme.primaryColor,
                onChanged: (v) => setState(() => _paymentMethod = v!),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─────────── Bottom Bar ───────────

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Price Breakdown
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Subtotal', style: Theme.of(context).textTheme.bodyMedium),
                Text(
                  '₹${widget.cart.total.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Shipping', style: Theme.of(context).textTheme.bodyMedium),
                Text(
                  'Free',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.green),
                ),
              ],
            ),
            const Divider(height: AppTheme.spacing16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '₹${widget.cart.total.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing16),

            // Place Order Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isPlacingOrder ? null : _placeOrder,
                child: _isPlacingOrder
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Text(
                        _paymentMethod == AppConstants.paymentMethodCOD
                            ? 'Place Order (COD)'
                            : 'Pay & Place Order',
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
