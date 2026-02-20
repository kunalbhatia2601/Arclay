import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/cart.dart';
import '../../services/cart_service.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _cartService = CartService();

  Cart? _cart;
  bool _isLoading = true;
  String? _error;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _cartService.getCart();

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _cart = response.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load cart';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateQuantity(String itemId, int newQuantity) async {
    if (_isUpdating) return;

    setState(() => _isUpdating = true);

    final response = await _cartService.updateQuantity(
      itemId: itemId,
      quantity: newQuantity,
    );

    if (!mounted) return;

    setState(() => _isUpdating = false);

    if (response.success && response.data != null) {
      setState(() => _cart = response.data);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quantity updated'),
          duration: Duration(seconds: 1),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Failed to update quantity'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  Future<void> _removeItem(String itemId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Are you sure you want to remove this item?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.accentColor),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    setState(() => _isUpdating = true);

    final response = await _cartService.removeFromCart(itemId);

    if (!mounted) return;

    setState(() => _isUpdating = false);

    if (response.success && response.data != null) {
      setState(() => _cart = response.data);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Item removed from cart'),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Failed to remove item'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shopping Cart')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppTheme.accentColor,
                  ),
                  const SizedBox(height: AppTheme.spacing16),
                  Text(_error!),
                  const SizedBox(height: AppTheme.spacing24),
                  ElevatedButton(
                    onPressed: _loadCart,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _cart == null || _cart!.isEmpty
          ? _buildEmptyCart()
          : _buildCartContent(),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.shopping_cart_outlined,
            size: 100,
            color: AppTheme.textSecondary,
          ),
          const SizedBox(height: AppTheme.spacing24),
          Text(
            'Your cart is empty',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: AppTheme.spacing8),
          Text(
            'Add some products to get started',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: AppTheme.spacing32),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartContent() {
    return Stack(
      children: [
        Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadCart,
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  itemCount: _cart!.items.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: AppTheme.spacing16),
                  itemBuilder: (context, index) {
                    final item = _cart!.items[index];
                    return _CartItemCard(
                      item: item,
                      onQuantityChanged: (quantity) =>
                          _updateQuantity(item.id, quantity),
                      onRemove: () => _removeItem(item.id),
                      isUpdating: _isUpdating,
                    );
                  },
                ),
              ),
            ),
            _buildCartSummary(),
          ],
        ),
        if (_isUpdating)
          Container(
            color: Colors.black26,
            child: const Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  Widget _buildCartSummary() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
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
                Text(
                  'Subtotal (${_cart!.itemCount} items)',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  '₹${_cart!.total.toStringAsFixed(0)}',
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
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CheckoutScreen(cart: _cart!),
                    ),
                  );
                },
                child: const Text('Proceed to Checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final Function(int) onQuantityChanged;
  final VoidCallback onRemove;
  final bool isUpdating;

  const _CartItemCard({
    required this.item,
    required this.onQuantityChanged,
    required this.onRemove,
    required this.isUpdating,
  });

  @override
  Widget build(BuildContext context) {
    final variantText = item.variant.attributes.entries
        .map((e) => '${e.key}: ${e.value}')
        .join(', ');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            ClipRRect(
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              child: item.product.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: item.product.images.first,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 80,
                        height: 80,
                        color: AppTheme.surfaceColor,
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 80,
                        height: 80,
                        color: AppTheme.surfaceColor,
                        child: const Icon(Icons.image_outlined),
                      ),
                    )
                  : Container(
                      width: 80,
                      height: 80,
                      color: AppTheme.surfaceColor,
                      child: const Icon(Icons.image_outlined),
                    ),
            ),
            const SizedBox(width: AppTheme.spacing12),
            // Product Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.product.name,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (variantText.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      variantText,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: AppTheme.spacing8),
                  Row(
                    children: [
                      Text(
                        '₹${item.variant.price.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const Spacer(),
                      // Quantity Controls
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.borderColor),
                          borderRadius: BorderRadius.circular(
                            AppTheme.radiusSm,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: isUpdating || item.quantity <= 1
                                  ? null
                                  : () => onQuantityChanged(item.quantity - 1),
                              padding: const EdgeInsets.all(4),
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              child: Text(
                                '${item.quantity}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed:
                                  isUpdating ||
                                      item.quantity >= item.variant.stock
                                  ? null
                                  : () => onQuantityChanged(item.quantity + 1),
                              padding: const EdgeInsets.all(4),
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (!item.available)
                        Text(
                          'Out of stock',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppTheme.accentColor),
                        )
                      else
                        Text(
                          'Subtotal: ₹${item.subtotal.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      TextButton.icon(
                        onPressed: isUpdating ? null : onRemove,
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: const Text('Remove'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.accentColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
