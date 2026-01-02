import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../product_detail/product_detail_screen.dart';

class ProductsTab extends StatefulWidget {
  const ProductsTab({super.key});

  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> {
  final _productsService = ProductsService();

  List<Product> _products = [];
  List<Category> _categories = [];
  bool _isLoading = true;
  String? _error;

  int _currentPage = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts({int page = 1}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _productsService.getProducts(
      page: page,
      limit: 12,
      sort: 'newest',
    );

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _products = response.data!.products;
        _categories = response.data!.categories;
        _currentPage = response.data!.page;
        _totalPages = response.data!.pages;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load products';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => _loadProducts(page: 1),
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Featured Products',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: AppTheme.spacing8),
                    Text(
                      'Discover our handcrafted collection',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Loading, Error, or Products
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 64,
                        color: AppTheme.accentColor,
                      ),
                      const SizedBox(height: AppTheme.spacing16),
                      Text(
                        _error!,
                        style: Theme.of(context).textTheme.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppTheme.spacing24),
                      ElevatedButton(
                        onPressed: () => _loadProducts(page: 1),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              )
            else if (_products.isEmpty)
              const SliverFillRemaining(
                child: Center(child: Text('No products available')),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(AppTheme.spacing16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: AppTheme.spacing12,
                    mainAxisSpacing: AppTheme.spacing12,
                  ),
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final product = _products[index];
                    return _ProductCard(product: product);
                  }, childCount: _products.length),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final hasDiscount = product.hasDiscount;
    final price = product.displayPrice;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id),
          ),
        );
      },
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                    ),
                    child: product.images.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(
                              AppTheme.radiusLg,
                            ),
                            child: CachedNetworkImage(
                              imageUrl: product.images.first,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                              errorWidget: (context, url, error) =>
                                  const Center(
                                    child: Icon(
                                      Icons.image_outlined,
                                      size: 48,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                            ),
                          )
                        : const Center(
                            child: Icon(
                              Icons.image_outlined,
                              size: 48,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
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
                          '${product.maxDiscountPercentage}% OFF',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textOnPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Product Info
            Padding(
              padding: const EdgeInsets.all(AppTheme.spacing8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (product.category != null)
                    Text(
                      product.category!.name,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: AppTheme.spacing4),
                  Text(
                    product.name,
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(fontSize: 14),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  Text(
                    hasDiscount
                        ? product.priceRange
                        : '₹${price.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
    );
  }
}
