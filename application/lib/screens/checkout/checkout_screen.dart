import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/cart.dart';
import '../../models/address.dart';
import '../../services/api_service.dart';
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
  final _apiService = ApiService();

  // State
  List<Address> _addresses = [];
  Address? _selectedAddress;
  String _paymentMethod = AppConstants.paymentMethodCOD;
  bool _isLoadingAddresses = true;
  bool _isPlacingOrder = false;
  String? _error;

  // Payment methods from settings
  List<Map<String, String>> _availablePayments = [];

  // Coupon state
  List<Map<String, dynamic>> _availableCoupons = [];
  final TextEditingController _couponController = TextEditingController();
  Map<String, dynamic>? _appliedCoupon;
  double _discountAmount = 0;
  String? _couponError;
  bool _applyingCoupon = false;

  // Razorpay
  late Razorpay _razorpay;
  String? _pendingOrderId;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _loadData();
  }

  @override
  void dispose() {
    _razorpay.clear();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoadingAddresses = true);

    // Load addresses, settings, and coupons in parallel
    final results = await Future.wait([
      _addressService.getAddresses(),
      _apiService.get<Map<String, dynamic>>(
        AppConstants.settingsEndpoint,
        fromJson: (json) => json as Map<String, dynamic>,
        requiresAuth: true,
      ),
      _apiService.get<Map<String, dynamic>>(
        AppConstants.couponsEndpoint,
        fromJson: (json) => json as Map<String, dynamic>,
        requiresAuth: true,
      ),
    ]);

    if (!mounted) return;

    final addressResponse = results[0] as ApiResponse<List<Address>>;
    final settingsResponse = results[1] as ApiResponse<Map<String, dynamic>>;
    final couponsResponse = results[2] as ApiResponse<Map<String, dynamic>>;

    setState(() {
      // Addresses
      if (addressResponse.success && addressResponse.data != null) {
        _addresses = addressResponse.data!;
        _selectedAddress = _addresses.isNotEmpty
            ? _addresses.firstWhere(
                (a) => a.isDefault,
                orElse: () => _addresses.first,
              )
            : null;
      }

      // Payment methods from settings
      if (settingsResponse.success && settingsResponse.data != null) {
        final fullSettings =
            settingsResponse.data!['_fullSettings'] as Map<String, dynamic>?;
        if (fullSettings != null) {
          final payment = fullSettings['payment'] as Map<String, dynamic>?;
          if (payment != null) {
            _availablePayments = [];
            final cod = payment['cod'] as Map<String, dynamic>?;
            final razorpay = payment['razorpay'] as Map<String, dynamic>?;
            final stripe = payment['stripe'] as Map<String, dynamic>?;

            if (cod != null && cod['isEnabled'] == true) {
              _availablePayments.add({
                'value': 'cod',
                'label': 'Cash on Delivery',
                'icon': 'money',
              });
            }
            if (razorpay != null && razorpay['isEnabled'] == true) {
              _availablePayments.add({
                'value': 'razorpay',
                'label': 'Razorpay (UPI, Cards, Netbanking)',
                'icon': 'payment',
              });
            }
            if (stripe != null && stripe['isEnabled'] == true) {
              _availablePayments.add({
                'value': 'stripe',
                'label': 'Stripe',
                'icon': 'credit_card',
              });
            }

            // Auto-select first available
            if (_availablePayments.isNotEmpty) {
              _paymentMethod = _availablePayments.first['value']!;
            }
          }
        }
      }

      // If no settings loaded, fall back to defaults
      if (_availablePayments.isEmpty) {
        _availablePayments = [
          {'value': 'cod', 'label': 'Cash on Delivery', 'icon': 'money'},
          {
            'value': 'razorpay',
            'label': 'Razorpay (UPI, Cards, Netbanking)',
            'icon': 'payment',
          },
        ];
      }

      // Coupons
      if (couponsResponse.success && couponsResponse.data != null) {
        final couponsList = couponsResponse.data!['coupons'] as List?;
        _availableCoupons =
            couponsList?.map((e) => Map<String, dynamic>.from(e)).toList() ??
            [];
      }

      _isLoadingAddresses = false;
    });
  }

  // ─────────── Coupon Methods ───────────

  Future<void> _applyCoupon({String? code}) async {
    final couponCode = code ?? _couponController.text.trim();
    if (couponCode.isEmpty) return;

    setState(() {
      _applyingCoupon = true;
      _couponError = null;
    });

    // Build cart items for validation
    final cartItems = widget.cart.items
        .map(
          (item) => {
            'productId': item.product.id,
            'product': {'_id': item.product.id},
            'quantity': item.quantity,
            'priceAtOrder': item.variant.price,
          },
        )
        .toList();

    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.couponsValidateEndpoint,
      body: {
        'code': couponCode.toUpperCase(),
        'cartItems': cartItems,
        'cartTotal': widget.cart.total,
      },
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (!mounted) return;

    setState(() {
      _applyingCoupon = false;
      if (response.success && response.data != null) {
        _appliedCoupon = response.data!['coupon'] as Map<String, dynamic>?;
        _discountAmount =
            (response.data!['discountAmount'] as num?)?.toDouble() ?? 0;
        _couponController.text = _appliedCoupon?['code'] ?? couponCode;
        _couponError = null;
      } else {
        _couponError = response.message ?? 'Invalid coupon';
        _appliedCoupon = null;
        _discountAmount = 0;
      }
    });
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _discountAmount = 0;
      _couponController.clear();
      _couponError = null;
    });
  }

  // ─────────── Address Methods ───────────

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
      await _loadData();
    }
  }

  // ─────────── Order Methods ───────────

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

    final orderResponse = await _orderService.createOrder(
      shippingAddress: shippingAddress,
      paymentMethod: _paymentMethod,
      couponCode: _appliedCoupon?['code'],
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
      setState(() => _isPlacingOrder = false);
      _showOrderSuccess(order.id);
    } else if (_paymentMethod == AppConstants.paymentMethodRazorpay) {
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

    var options = {
      'key': rpOrder.keyId,
      'amount': rpOrder.amount,
      'name': rpOrder.name.isNotEmpty ? rpOrder.name : AppConstants.appName,
      'order_id': rpOrder.razorpayOrderId,
      'description': 'Order Payment',
      'prefill': {'contact': _selectedAddress?.phone ?? '', 'email': ''},
      'theme': {'color': '#556B2F'},
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

  // ─────────── Getters ───────────

  double get _finalTotal => widget.cart.total - _discountAmount;

  IconData _iconForPayment(String? iconName) {
    switch (iconName) {
      case 'money':
        return Icons.money;
      case 'payment':
        return Icons.payment;
      case 'credit_card':
        return Icons.credit_card;
      default:
        return Icons.payment;
    }
  }

  // ─────────── Build ───────────

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
                        _buildAddressSection(),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildCouponSection(),
                        const SizedBox(height: AppTheme.spacing24),
                        _buildOrderSummary(),
                        const SizedBox(height: AppTheme.spacing24),
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
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
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

  // ─────────── Coupon Section ───────────

  Widget _buildCouponSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Discount Code', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppTheme.spacing12),

        if (_appliedCoupon != null)
          // Applied coupon card
          Card(
            color: AppTheme.primaryColor.withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing16),
              child: Row(
                children: [
                  const Icon(Icons.local_offer, color: AppTheme.primaryColor),
                  const SizedBox(width: AppTheme.spacing12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _appliedCoupon!['code'] ?? '',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                        ),
                        if (_appliedCoupon!['description'] != null)
                          Text(
                            _appliedCoupon!['description'],
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '-₹${_discountAmount.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      GestureDetector(
                        onTap: _removeCoupon,
                        child: Text(
                          'Remove',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppTheme.accentColor),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
        else ...[
          // Coupon input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _couponController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(fontFamily: 'monospace'),
                  decoration: const InputDecoration(
                    hintText: 'Enter coupon code',
                    prefixIcon: Icon(Icons.local_offer_outlined),
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacing8),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _applyingCoupon ? null : () => _applyCoupon(),
                  child: _applyingCoupon
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text('Apply'),
                ),
              ),
            ],
          ),

          if (_couponError != null)
            Padding(
              padding: const EdgeInsets.only(top: AppTheme.spacing8),
              child: Text(
                _couponError!,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppTheme.accentColor),
              ),
            ),

          // Available coupons
          if (_availableCoupons.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacing16),
            Text(
              'Available Coupons',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: AppTheme.spacing8),
            ...(_availableCoupons.map((coupon) {
              final code = coupon['code'] as String? ?? '';
              final description = coupon['description'] as String? ?? '';
              final minPurchase =
                  (coupon['minPurchase'] as num?)?.toDouble() ?? 0;

              return Card(
                margin: const EdgeInsets.only(bottom: AppTheme.spacing8),
                child: InkWell(
                  onTap: () {
                    _couponController.text = code;
                    _applyCoupon(code: code);
                  },
                  borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.spacing12),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: AppTheme.primaryColor,
                              style: BorderStyle.solid,
                            ),
                            borderRadius: BorderRadius.circular(
                              AppTheme.radiusSm,
                            ),
                          ),
                          child: Text(
                            code,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'monospace',
                                ),
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacing12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                description,
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (minPurchase > 0)
                                Text(
                                  'Min. order: ₹${minPurchase.toStringAsFixed(0)}',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: AppTheme.textSecondary,
                                        fontSize: 11,
                                      ),
                                ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          color: AppTheme.primaryColor,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            })),
          ],
        ],
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
            children: _availablePayments.asMap().entries.map((entry) {
              final index = entry.key;
              final payment = entry.value;
              return Column(
                children: [
                  RadioListTile<String>(
                    title: Text(payment['label'] ?? ''),
                    secondary: Icon(
                      _iconForPayment(payment['icon']),
                      color: payment['value'] == 'cod'
                          ? Colors.green
                          : payment['value'] == 'razorpay'
                          ? Colors.blue
                          : Colors.purple,
                    ),
                    value: payment['value']!,
                    groupValue: _paymentMethod,
                    activeColor: AppTheme.primaryColor,
                    onChanged: (v) => setState(() => _paymentMethod = v!),
                  ),
                  if (index < _availablePayments.length - 1)
                    const Divider(height: 1),
                ],
              );
            }).toList(),
          ),
        ),
        if (_availablePayments.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: AppTheme.spacing8),
            child: Text(
              'No payment methods available. Please contact support.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.accentColor),
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
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
            if (_discountAmount > 0) ...[
              const SizedBox(height: AppTheme.spacing4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Discount (${_appliedCoupon?['code'] ?? ''})',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  Text(
                    '-₹${_discountAmount.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ],
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
                  '₹${_finalTotal.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing16),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isPlacingOrder || _availablePayments.isEmpty
                    ? null
                    : _placeOrder,
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
