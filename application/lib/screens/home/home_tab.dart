import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../../services/api_service.dart';
import '../product_detail/product_detail_screen.dart';

class HomeTab extends StatefulWidget {
  final Function(int)? onTabChange;
  final Function(String)? onCategoryTap;

  const HomeTab({super.key, this.onTabChange, this.onCategoryTap});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _productsService = ProductsService();
  final _apiService = ApiService();

  List<Product> _featuredProducts = [];
  List<Category> _categories = [];
  List<Map<String, dynamic>> _productAds = [];
  bool _isLoading = true;

  // Carousel
  final PageController _adsPageController = PageController();
  Timer? _adsAutoScroll;
  int _currentAdPage = 0;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  @override
  void dispose() {
    _adsAutoScroll?.cancel();
    _adsPageController.dispose();
    super.dispose();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);

    // Load products + ads in parallel
    final results = await Future.wait([
      _productsService.getProducts(page: 1, limit: 6, sort: 'newest'),
      _apiService.get<Map<String, dynamic>>(
        '/api/product-ads',
        queryParams: {'position': 'hero'},
        fromJson: (json) => json as Map<String, dynamic>,
      ),
    ]);

    if (!mounted) return;

    final productsResponse = results[0] as ApiResponse<ProductsResponse>;
    final adsResponse = results[1] as ApiResponse<Map<String, dynamic>>;

    setState(() {
      if (productsResponse.success && productsResponse.data != null) {
        _featuredProducts = productsResponse.data!.products;
        _categories = productsResponse.data!.categories;
      }

      if (adsResponse.success && adsResponse.data != null) {
        final adsList = adsResponse.data!['ads'] as List?;
        _productAds =
            adsList?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [];
      }

      _isLoading = false;
    });

    _startAdsAutoScroll();
  }

  void _startAdsAutoScroll() {
    _adsAutoScroll?.cancel();
    if (_productAds.length <= 1) return;

    _adsAutoScroll = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_adsPageController.hasClients) return;
      final next = (_currentAdPage + 1) % _productAds.length;
      _adsPageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
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
              decoration: const BoxDecoration(
                gradient: AppTheme.oliveGradient,
                borderRadius: BorderRadius.only(
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
                      color: AppTheme.textOnPrimary.withValues(alpha: 0.9),
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
                    return GestureDetector(
                      onTap: () {
                        widget.onCategoryTap?.call(category.id);
                      },
                      child: Container(
                        width: 100,
                        margin: const EdgeInsets.only(
                          right: AppTheme.spacing12,
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 70,
                              height: 70,
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppTheme.primaryColor.withValues(
                                    alpha: 0.2,
                                  ),
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
                      ),
                    );
                  },
                ),
              ),
            ),
          ],

          // ──── Product Ads Carousel ────
          if (_productAds.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spacing16,
                  AppTheme.spacing8,
                  AppTheme.spacing16,
                  AppTheme.spacing8,
                ),
                child: Column(
                  children: [
                    SizedBox(
                      height: 180,
                      child: PageView.builder(
                        controller: _adsPageController,
                        itemCount: _productAds.length,
                        onPageChanged: (index) {
                          setState(() => _currentAdPage = index);
                        },
                        itemBuilder: (context, index) {
                          final ad = _productAds[index];
                          return _buildAdCard(ad);
                        },
                      ),
                    ),
                    if (_productAds.length > 1) ...[
                      const SizedBox(height: AppTheme.spacing8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _productAds.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: _currentAdPage == i ? 20 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: _currentAdPage == i
                                  ? AppTheme.primaryColor
                                  : AppTheme.borderColor,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

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
                      widget.onTabChange?.call(1);
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

  Widget _buildAdCard(Map<String, dynamic> ad) {
    final mediaUrl = ad['mediaUrl'] as String?;
    final title = ad['title'] as String? ?? '';
    final description = ad['description'] as String? ?? '';
    final linkUrl = ad['linkUrl'] as String?;

    return GestureDetector(
      onTap: () {
        // If ad links to a product, try to navigate
        if (linkUrl != null && linkUrl.contains('/products/')) {
          final productId = linkUrl.split('/products/').last.split('?').first;
          if (productId.isNotEmpty) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProductDetailScreen(productId: productId),
              ),
            );
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          boxShadow: AppTheme.cardShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image
              if (mediaUrl != null && mediaUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: mediaUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: AppTheme.surfaceColor,
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    decoration: const BoxDecoration(
                      gradient: AppTheme.oliveGradient,
                    ),
                  ),
                )
              else
                Container(
                  decoration: const BoxDecoration(
                    gradient: AppTheme.oliveGradient,
                  ),
                ),

              // Gradient overlay for text readability
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.6),
                    ],
                  ),
                ),
              ),

              // Title + description
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title.isNotEmpty)
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    if (description.isNotEmpty)
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
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
                              placeholder: (_, __) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                              errorWidget: (_, __, ___) => const Center(
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
