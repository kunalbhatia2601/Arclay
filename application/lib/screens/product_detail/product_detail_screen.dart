import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../../services/cart_service.dart';
import '../../services/auth_service.dart';
import '../cart/cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _productsService = ProductsService();

  Product? _product;
  bool _isLoading = true;
  String? _error;

  int _selectedVariantIndex = 0;
  int _quantity = 1;
  bool _isAddingToCart = false;

  final _cartService = CartService();
  final _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _productsService.getProductById(widget.productId);

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _product = response.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load product';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleAddToCart() async {
    // Check authentication
    if (!_authService.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to add items to cart'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      // Navigate to login screen
      Navigator.pushNamed(context, '/login');
      return;
    }

    if (_product == null) return;

    final selectedVariant = _product!.variants[_selectedVariantIndex];

    // Get variant attributes
    final variantAttributes = <String, String>{};
    selectedVariant.attributes.forEach((key, value) {
      variantAttributes[key] = value;
    });

    setState(() => _isAddingToCart = true);

    final response = await _cartService.addToCart(
      productId: _product!.id,
      variantAttributes: variantAttributes,
      quantity: _quantity,
    );

    if (!mounted) return;

    setState(() => _isAddingToCart = false);

    if (response.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Added to cart!'),
          duration: Duration(seconds: 2),
        ),
      );

    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Failed to add to cart'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // Product Name or The Site Name
        title: Text(_product?.name ?? AppConstants.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () {
              // Navigate to cart
            },
          ),
        ],
      ),
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
                    onPressed: _loadProduct,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _buildProductDetail(),
    );
  }

  Widget _buildProductDetail() {
    if (_product == null) return const SizedBox();

    final selectedVariant = _product!.variants[_selectedVariantIndex];
    final price = selectedVariant.effectivePrice;
    final hasDiscount = selectedVariant.hasDiscount;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Images
                SizedBox(
                  height: 400,
                  child: _product!.images.isNotEmpty
                      ? PageView.builder(
                          itemCount: _product!.images.length,
                          itemBuilder: (context, index) {
                            return CachedNetworkImage(
                              imageUrl: _product!.images[index],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                              errorWidget: (context, url, error) =>
                                  const Center(
                                    child: Icon(Icons.error_outline, size: 64),
                                  ),
                            );
                          },
                        )
                      : Container(
                          color: AppTheme.surfaceColor,
                          child: const Center(
                            child: Icon(Icons.image_outlined, size: 100),
                          ),
                        ),
                ),

                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category
                      if (_product!.category != null)
                        Text(
                          _product!.category!.name,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w600,
                              ),
                        ),

                      const SizedBox(height: AppTheme.spacing8),

                      // Product Name
                      Text(
                        _product!.name,
                        style: Theme.of(context).textTheme.displaySmall,
                      ),

                      const SizedBox(height: AppTheme.spacing16),

                      // Price
                      Row(
                        children: [
                          Text(
                            '₹${price.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          if (hasDiscount) ...[
                            const SizedBox(width: AppTheme.spacing8),
                            Text(
                              '₹${selectedVariant.regularPrice.toStringAsFixed(0)}',
                              style: Theme.of(context).textTheme.bodyLarge
                                  ?.copyWith(
                                    color: AppTheme.textSecondary,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                            ),
                            const SizedBox(width: AppTheme.spacing8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.accentColor,
                                borderRadius: BorderRadius.circular(
                                  AppTheme.radiusSm,
                                ),
                              ),
                              child: Text(
                                '${selectedVariant.discountPercentage}% OFF',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: AppTheme.textOnPrimary,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ),
                          ],
                        ],
                      ),

                      const SizedBox(height: AppTheme.spacing24),

                      // Variants
                      if (_product!.variants.length > 1) ...[
                        Text(
                          'Select Variant',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: AppTheme.spacing12),
                        Wrap(
                          spacing: AppTheme.spacing8,
                          runSpacing: AppTheme.spacing8,
                          children: List.generate(_product!.variants.length, (
                            index,
                          ) {
                            final variant = _product!.variants[index];
                            final isSelected = index == _selectedVariantIndex;
                            final attributes = variant.attributes.entries
                                .map((e) => '${e.key}: ${e.value}')
                                .join(', ');

                            return GestureDetector(
                              onTap: () {
                                setState(() => _selectedVariantIndex = index);
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppTheme.spacing16,
                                  vertical: AppTheme.spacing12,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppTheme.primaryColor
                                      : AppTheme.cardColor,
                                  border: Border.all(
                                    color: isSelected
                                        ? AppTheme.primaryColor
                                        : AppTheme.borderColor,
                                    width: 1.5,
                                  ),
                                  borderRadius: BorderRadius.circular(
                                    AppTheme.radiusLg,
                                  ),
                                ),
                                child: Text(
                                  attributes,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: isSelected
                                            ? AppTheme.textOnPrimary
                                            : AppTheme.textPrimary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: AppTheme.spacing24),
                      ],

                      // Stock Status
                      Row(
                        children: [
                          Icon(
                            selectedVariant.stock > 0
                                ? Icons.check_circle
                                : Icons.cancel,
                            color: selectedVariant.stock > 0
                                ? Colors.green
                                : AppTheme.accentColor,
                            size: 20,
                          ),
                          const SizedBox(width: AppTheme.spacing8),
                          Text(
                            selectedVariant.stock > 0
                                ? 'In Stock (${selectedVariant.stock} available)'
                                : 'Out of Stock',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: selectedVariant.stock > 0
                                      ? Colors.green
                                      : AppTheme.accentColor,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ],
                      ),

                      const SizedBox(height: AppTheme.spacing24),

                      // Description
                      Text(
                        'Description',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: AppTheme.spacing8),
                      Text(
                        _product!.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),

                      const SizedBox(height: AppTheme.spacing24),

                      // Quantity Selector
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Quantity',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppTheme.spacing8),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: AppTheme.borderColor),
                              borderRadius: BorderRadius.circular(
                                AppTheme.radiusMd,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove),
                                  onPressed: _quantity > 1
                                      ? () => setState(() => _quantity--)
                                      : null,
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  child: Text(
                                    '$_quantity',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add),
                                  onPressed: _quantity < selectedVariant.stock
                                      ? () => setState(() => _quantity++)
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: AppTheme.spacing16),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Sticky Add to Cart Button
        Container(
          padding: const EdgeInsets.all(AppTheme.spacing16),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: selectedVariant.stock > 0 && !_isAddingToCart
                    ? _handleAddToCart
                    : null,
                icon: _isAddingToCart
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
                    : const Icon(Icons.shopping_cart),
                label: Text(
                  _isAddingToCart
                      ? 'Adding...'
                      : 'Add to Cart - ₹${(price * _quantity).toStringAsFixed(0)}',
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
