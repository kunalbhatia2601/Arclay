import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../product_detail/product_detail_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _productsService = ProductsService();

  List<Product> _featuredProducts = [];
  List<Category> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);

    final response = await _productsService.getProducts(
      page: 1,
      limit: 6,
      sort: 'newest',
    );

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _featuredProducts = response.data!.products;
        _categories = response.data!.categories;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadHomeData,
      child: CustomScrollView(
        slivers: [
          // Hero Section
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(AppTheme.spacing24),
              decoration: BoxDecoration(
                gradient: AppTheme.oliveGradient,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(AppTheme.radius2xl),
                  bottomRight: Radius.circular(AppTheme.radius2xl),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppTheme.spacing16),
                  Text(
                    'Welcome to',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textOnPrimary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  Text(
                    AppConstants.appName,
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      color: AppTheme.textOnPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing8),
                  Text(
                    AppConstants.appDescription,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textOnPrimary.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Categories Section
          if (_categories.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Shop by Category',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTheme.spacing12),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacing16,
                  ),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    return Container(
                      width: 100,
                      margin: const EdgeInsets.only(right: AppTheme.spacing12),
                      child: Column(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceColor,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.primaryColor.withOpacity(0.2),
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.category_outlined,
                              color: AppTheme.primaryColor,
                              size: 32,
                            ),
                          ),
                          const SizedBox(height: AppTheme.spacing4),
                          Text(
                            category.name,
                            style: Theme.of(context).textTheme.bodySmall,
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // Featured Products Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Featured Products',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () {
                      // Switch to Products tab
                      DefaultTabController.of(context).animateTo(1);
                    },
                    child: const Text('View All'),
                  ),
                ],
              ),
            ),
          ),

          // Products Grid
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_featuredProducts.isEmpty)
            const SliverFillRemaining(
              child: Center(child: Text('No products available')),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacing16,
              ),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.75,
                  crossAxisSpacing: AppTheme.spacing12,
                  mainAxisSpacing: AppTheme.spacing12,
                ),
                delegate: SliverChildBuilderDelegate((context, index) {
                  final product = _featuredProducts[index];
                  return _ProductCard(product: product);
                }, childCount: _featuredProducts.length),
              ),
            ),

          const SliverPadding(
            padding: EdgeInsets.only(bottom: AppTheme.spacing24),
          ),
        ],
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
                    '₹${price.toStringAsFixed(0)}',
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
