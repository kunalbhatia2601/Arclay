import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../models/review.dart';
import '../../services/products_service.dart';
import '../../services/cart_service.dart';
import '../../services/auth_service.dart';
import '../../services/review_service.dart';
import '../../services/shipping_service.dart';
import '../cart/cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _productsService = ProductsService();
  final _cartService = CartService();
  final _authService = AuthService();
  final _reviewService = ReviewService();
  final _shippingService = ShippingService();

  Product? _product;
  List<Review> _reviews = [];
  List<Product> _relatedProducts = [];
  bool _isLoading = true;
  String? _error;

  Map<String, String> _selectedAttributes = {};
  int _quantity = 1;
  bool _isAddingToCart = false;

  // Image carousel
  final PageController _pageController = PageController();
  int _currentImageIndex = 0;

  // Pincode
  final _pincodeController = TextEditingController();
  ServiceabilityResponse? _pincodeResult;
  bool _isCheckingPincode = false;

  // Reviews
  bool _canReview = false;
  bool _isSubmittingReview = false;

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _pincodeController.dispose();
    super.dispose();
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
        _product = response.data!.product;
        _reviews = response.data!.reviews;
        _relatedProducts = response.data!.relatedProducts;
        if (_product!.variants.isNotEmpty) {
          _selectedAttributes = Map<String, String>.from(
            _product!.variants.first.attributes,
          );
        }
        _isLoading = false;
      });
      _checkCanReview();
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load product';
        _isLoading = false;
      });
    }
  }

  Future<void> _checkCanReview() async {
    if (!_authService.isAuthenticated || _product == null) return;
    final response = await _reviewService.checkCanReview(_product!.id);
    if (mounted && response.success && response.data != null) {
      setState(() {
        _canReview = response.data!['canReview'] == true;
      });
    }
  }

  ProductVariant? get _selectedVariant {
    if (_product == null || _product!.variants.isEmpty) return null;
    try {
      return _product!.variants.firstWhere((v) {
        for (final entry in _selectedAttributes.entries) {
          if (v.attributes[entry.key] != entry.value) return false;
        }
        return true;
      });
    } catch (_) {
      return _product!.variants.first;
    }
  }

  int get _selectedVariantIndex {
    final v = _selectedVariant;
    if (v == null) return 0;
    return _product!.variants.indexOf(v);
  }

  Future<void> _handleAddToCart() async {
    if (!_authService.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to add items to cart'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      return;
    }

    if (_product == null) return;

    final selectedVariant = _product!.variants[_selectedVariantIndex];
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

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          response.success
              ? 'Added to cart!'
              : response.message ?? 'Failed to add to cart',
        ),
        backgroundColor: response.success ? Colors.green : AppTheme.accentColor,
      ),
    );
  }

  Future<void> _checkPincode() async {
    final pincode = _pincodeController.text.trim();
    if (pincode.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit pincode')),
      );
      return;
    }

    setState(() {
      _isCheckingPincode = true;
      _pincodeResult = null;
    });

    final result = await _shippingService.checkServiceability(pincode);

    if (!mounted) return;

    setState(() {
      _pincodeResult = result;
      _isCheckingPincode = false;
    });
  }

  void _showWriteReviewDialog() {
    int selectedStars = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Write a Review'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Rating'),
              const SizedBox(height: 8),
              Row(
                children: List.generate(5, (i) {
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedStars = i + 1),
                    child: Icon(
                      i < selectedStars
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      color: Colors.amber,
                      size: 36,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Share your experience...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _isSubmittingReview
                  ? null
                  : () async {
                      if (commentController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please write a comment'),
                          ),
                        );
                        return;
                      }
                      setState(() => _isSubmittingReview = true);
                      final response = await _reviewService.submitReview(
                        productId: _product!.id,
                        stars: selectedStars,
                        comment: commentController.text.trim(),
                      );
                      if (!mounted) return;
                      setState(() => _isSubmittingReview = false);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            response.success
                                ? 'Review submitted! It will appear after approval.'
                                : response.message ?? 'Failed to submit review',
                          ),
                          backgroundColor: response.success
                              ? Colors.green
                              : AppTheme.accentColor,
                        ),
                      );
                      if (response.success) {
                        setState(() => _canReview = false);
                      }
                    },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_product?.name ?? AppConstants.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const CartScreen()));
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
                // ──── Image Carousel with Dots ────
                _buildImageCarousel(),

                // ──── Product Info ────
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category
                      if (_product!.category != null)
                        Text(
                          _product!.category!.name.toUpperCase(),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.2,
                              ),
                        ),
                      const SizedBox(height: AppTheme.spacing8),

                      // Name
                      Text(
                        _product!.name,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: AppTheme.spacing12),

                      // Price
                      Row(
                        children: [
                          Text(
                            '₹${price.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          if (hasDiscount) ...[
                            const SizedBox(width: AppTheme.spacing8),
                            Text(
                              '₹${selectedVariant.regularPrice.toStringAsFixed(0)}',
                              style: Theme.of(context).textTheme.titleMedium
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
                                color: AppTheme.primaryColor,
                                borderRadius: BorderRadius.circular(
                                  AppTheme.radiusSm,
                                ),
                              ),
                              child: Text(
                                '${selectedVariant.discountPercentage}% OFF',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacing12),

                      // Stock Status
                      Row(
                        children: [
                          Icon(
                            selectedVariant.stock > 0
                                ? Icons.check_circle
                                : Icons.cancel,
                            size: 16,
                            color: selectedVariant.stock > 0
                                ? Colors.green
                                : AppTheme.accentColor,
                          ),
                          const SizedBox(width: 6),
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

                      // ──── Variants (grouped by type) ────
                      if (_product!.variationTypes.isNotEmpty &&
                          _product!.variants.length > 1) ...[
                        for (final varType in _product!.variationTypes) ...[
                          Row(
                            children: [
                              Text(
                                '${varType.name}: ',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                              Text(
                                _selectedAttributes[varType.name] ?? '',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppTheme.spacing8),
                          Wrap(
                            spacing: AppTheme.spacing8,
                            runSpacing: AppTheme.spacing8,
                            children: varType.options.map((option) {
                              final isSelected =
                                  _selectedAttributes[varType.name] == option;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedAttributes[varType.name] = option;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppTheme.spacing16,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppTheme.primaryColor.withValues(
                                            alpha: 0.1,
                                          )
                                        : Colors.transparent,
                                    border: Border.all(
                                      color: isSelected
                                          ? AppTheme.primaryColor
                                          : AppTheme.borderColor,
                                      width: 2,
                                    ),
                                    borderRadius: BorderRadius.circular(
                                      AppTheme.radiusLg,
                                    ),
                                  ),
                                  child: Text(
                                    option,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: isSelected
                                              ? AppTheme.primaryColor
                                              : AppTheme.textPrimary,
                                          fontWeight: isSelected
                                              ? FontWeight.w600
                                              : FontWeight.w500,
                                        ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: AppTheme.spacing16),
                        ],
                        const SizedBox(height: AppTheme.spacing8),
                      ],

                      // ──── Quantity Selector ────
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
                                style: Theme.of(context).textTheme.titleMedium,
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

                      const SizedBox(height: AppTheme.spacing24),

                      // ──── Pincode Check ────
                      _buildPincodeCheck(),

                      const SizedBox(height: AppTheme.spacing24),

                      // ──── Description (short) ────
                      Text(
                        'Description',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: AppTheme.spacing8),
                      Text(
                        _product!.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                          height: 1.5,
                        ),
                      ),

                      // ──── Long Description ────
                      if (_product!.longDescription.isNotEmpty) ...[
                        const SizedBox(height: AppTheme.spacing24),
                        Text(
                          'Product Details',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: AppTheme.spacing12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(AppTheme.spacing16),
                            child: _buildRichDescription(
                              _product!.longDescription,
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: AppTheme.spacing24),

                      // ──── Reviews ────
                      _buildReviewsSection(),

                      const SizedBox(height: AppTheme.spacing24),

                      // ──── Related Products ────
                      if (_relatedProducts.isNotEmpty) _buildRelatedProducts(),

                      const SizedBox(height: AppTheme.spacing16),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // ──── Sticky Add to Cart ────
        _buildAddToCartBar(selectedVariant, price),
      ],
    );
  }

  // ═══════════════════════════════════════
  // IMAGE CAROUSEL WITH DOTS
  // ═══════════════════════════════════════

  Widget _buildImageCarousel() {
    return SizedBox(
      height: 400,
      child: _product!.images.isNotEmpty
          ? Stack(
              children: [
                PageView.builder(
                  controller: _pageController,
                  itemCount: _product!.images.length,
                  onPageChanged: (index) {
                    setState(() => _currentImageIndex = index);
                  },
                  itemBuilder: (context, index) {
                    return CachedNetworkImage(
                      imageUrl: _product!.images[index],
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          const Center(child: CircularProgressIndicator()),
                      errorWidget: (_, __, ___) => const Center(
                        child: Icon(Icons.error_outline, size: 64),
                      ),
                    );
                  },
                ),
                // Dot indicators
                if (_product!.images.length > 1)
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _product!.images.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentImageIndex == index ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _currentImageIndex == index
                                ? AppTheme.primaryColor
                                : Colors.white.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            )
          : Container(
              color: AppTheme.surfaceColor,
              child: const Center(
                child: Icon(
                  Icons.image_outlined,
                  size: 120,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
    );
  }

  // ═══════════════════════════════════════
  // PINCODE CHECK
  // ═══════════════════════════════════════

  Widget _buildPincodeCheck() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 20,
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: 6),
                Text(
                  'Check Delivery',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _pincodeController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: const InputDecoration(
                      hintText: 'Enter 6-digit pincode',
                      counterText: '',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacing8),
                SizedBox(
                  height: 44,
                  child: ElevatedButton(
                    onPressed: _isCheckingPincode ? null : _checkPincode,
                    child: _isCheckingPincode
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Check'),
                  ),
                ),
              ],
            ),
            if (_pincodeResult != null) ...[
              const SizedBox(height: AppTheme.spacing12),
              Container(
                padding: const EdgeInsets.all(AppTheme.spacing12),
                decoration: BoxDecoration(
                  color: _pincodeResult!.serviceable
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Row(
                  children: [
                    Icon(
                      _pincodeResult!.serviceable
                          ? Icons.check_circle
                          : Icons.cancel,
                      size: 18,
                      color: _pincodeResult!.serviceable
                          ? Colors.green
                          : Colors.red,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _pincodeResult!.serviceable
                                ? 'Delivery available to ${_pincodeController.text}'
                                : 'Delivery not available',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: _pincodeResult!.serviceable
                                      ? Colors.green
                                      : Colors.red,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                          if (_pincodeResult!.serviceable &&
                              _pincodeResult!.estimatedDays != null)
                            Text(
                              'Estimated delivery in ${_pincodeResult!.estimatedDays} days',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.green,
                                    fontWeight: FontWeight.w400,
                                  ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════
  // RICH DESCRIPTION (HTML + Markdown)
  // ═══════════════════════════════════════

  Widget _buildRichDescription(String description) {
    if (description.contains('<') && description.contains('>')) {
      return _buildHtmlDescription(description);
    }
    return _buildMarkdownDescription(description);
  }

  Widget _buildHtmlDescription(String html) {
    final widgets = <Widget>[];
    final content = html
        .replaceAll(RegExp(r'<br\s*/?>'), '\n')
        .replaceAll('</p>', '\n')
        .replaceAll('</div>', '\n');

    final tagPattern = RegExp(
      r'<(h[23]|li|p|strong|b)(?:\s[^>]*)?>(.*?)</\1>',
      dotAll: true,
    );

    int lastEnd = 0;
    final matches = tagPattern.allMatches(content);

    for (final match in matches) {
      if (match.start > lastEnd) {
        final before = _stripHtml(
          content.substring(lastEnd, match.start),
        ).trim();
        if (before.isNotEmpty) {
          widgets.add(
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                before,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
            ),
          );
        }
      }

      final tag = match.group(1)!;
      final text = _stripHtml(match.group(2)!).trim();

      if (tag == 'h2') {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              text,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (tag == 'h3') {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              text,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (tag == 'li') {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 8, top: 2, bottom: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '•  ',
                  style: TextStyle(color: AppTheme.primaryColor),
                ),
                Expanded(
                  child: Text(
                    text,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else if (text.isNotEmpty) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        );
      }
      lastEnd = match.end;
    }

    if (lastEnd < content.length) {
      final remaining = _stripHtml(content.substring(lastEnd)).trim();
      if (remaining.isNotEmpty) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              remaining,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        );
      }
    }

    if (widgets.isEmpty) {
      return Text(
        _stripHtml(html),
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppTheme.textSecondary,
          height: 1.5,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  String _stripHtml(String html) {
    return html
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .trim();
  }

  Widget _buildMarkdownDescription(String description) {
    final lines = description.split('\n');
    final widgets = <Widget>[];

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) {
        widgets.add(const SizedBox(height: 8));
      } else if (trimmed.startsWith('### ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              trimmed.substring(4),
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (trimmed.startsWith('## ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              trimmed.substring(3),
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 8, top: 2, bottom: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '•  ',
                  style: TextStyle(color: AppTheme.primaryColor),
                ),
                Expanded(
                  child: Text(
                    trimmed.substring(2),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              trimmed,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
                height: 1.5,
              ),
            ),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  // ═══════════════════════════════════════
  // REVIEWS SECTION
  // ═══════════════════════════════════════

  Widget _buildReviewsSection() {
    final avgRating = _reviews.isEmpty
        ? 0.0
        : _reviews.map((r) => r.stars).reduce((a, b) => a + b) /
              _reviews.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Text(
                    'Customer Reviews',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  if (_reviews.isNotEmpty) ...[
                    const SizedBox(width: AppTheme.spacing8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            avgRating.toStringAsFixed(1),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 2),
                          const Icon(
                            Icons.star_rounded,
                            size: 14,
                            color: Colors.amber,
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (_canReview)
              TextButton.icon(
                onPressed: _showWriteReviewDialog,
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Write Review'),
              ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing12),
        if (_reviews.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing24),
              child: Center(
                child: Column(
                  children: [
                    const Icon(
                      Icons.rate_review_outlined,
                      size: 40,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(height: AppTheme.spacing8),
                    Text(
                      'No reviews yet',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (_canReview) ...[
                      const SizedBox(height: AppTheme.spacing8),
                      const Text('Be the first to review!'),
                    ],
                  ],
                ),
              ),
            ),
          )
        else
          ...List.generate(
            _reviews.length > 3 ? 3 : _reviews.length,
            (i) => _buildReviewCard(_reviews[i]),
          ),
        if (_reviews.length > 3) ...[
          const SizedBox(height: AppTheme.spacing8),
          Center(
            child: TextButton(
              onPressed: _showAllReviews,
              child: Text('View all ${_reviews.length} reviews'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildReviewCard(Review review) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing8),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  review.user.name,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  DateFormat('dd MMM yyyy').format(review.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: List.generate(5, (i) {
                return Icon(
                  i < review.stars
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 16,
                  color: Colors.amber,
                );
              }),
            ),
            const SizedBox(height: AppTheme.spacing8),
            Text(
              review.comment,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllReviews() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppTheme.spacing16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'All Reviews (${_reviews.length})',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.all(AppTheme.spacing16),
                itemCount: _reviews.length,
                itemBuilder: (_, i) => _buildReviewCard(_reviews[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════
  // RELATED PRODUCTS
  // ═══════════════════════════════════════

  Widget _buildRelatedProducts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Related Products', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppTheme.spacing12),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _relatedProducts.length,
            itemBuilder: (context, index) {
              final product = _relatedProducts[index];
              final firstVariant = product.variants.isNotEmpty
                  ? product.variants.first
                  : null;

              return GestureDetector(
                onTap: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) =>
                          ProductDetailScreen(productId: product.id),
                    ),
                  );
                },
                child: Container(
                  width: 160,
                  margin: EdgeInsets.only(
                    right: index < _relatedProducts.length - 1
                        ? AppTheme.spacing12
                        : 0,
                  ),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          height: 120,
                          width: double.infinity,
                          child: product.images.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: product.images.first,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Container(
                                    color: AppTheme.surfaceColor,
                                    child: const Icon(Icons.image_outlined),
                                  ),
                                )
                              : Container(
                                  color: AppTheme.surfaceColor,
                                  child: const Icon(Icons.image_outlined),
                                ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (product.category != null)
                                Text(
                                  product.category!.name.toUpperCase(),
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: AppTheme.primaryColor,
                                        letterSpacing: 0.8,
                                      ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              const SizedBox(height: 2),
                              Text(
                                product.name,
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(fontWeight: FontWeight.w600),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              if (firstVariant != null)
                                Text(
                                  '₹${firstVariant.effectivePrice.toStringAsFixed(0)}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: AppTheme.primaryColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════
  // STICKY ADD TO CART BAR
  // ═══════════════════════════════════════

  Widget _buildAddToCartBar(ProductVariant selectedVariant, double price) {
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
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.shopping_cart),
            label: Text(
              _isAddingToCart
                  ? 'Adding...'
                  : 'Add to Cart — ₹${(price * _quantity).toStringAsFixed(0)}',
            ),
          ),
        ),
      ),
    );
  }
}
