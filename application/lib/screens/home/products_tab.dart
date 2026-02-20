import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/product.dart';
import '../../services/products_service.dart';
import '../product_detail/product_detail_screen.dart';

class ProductsTab extends StatefulWidget {
  final String? initialCategory;

  const ProductsTab({super.key, this.initialCategory});

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
  int _totalProducts = 0;

  // Filters
  String? _selectedCategory;
  String _sort = 'newest';
  double? _minPrice;
  double? _maxPrice;

  final _sortOptions = {
    'newest': 'Newest',
    'oldest': 'Oldest',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    'name-asc': 'Name: A to Z',
    'name-desc': 'Name: Z to A',
  };

  bool get _hasActiveFilters =>
      _selectedCategory != null ||
      _sort != 'newest' ||
      _minPrice != null ||
      _maxPrice != null;

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
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
      sort: _sort,
      category: _selectedCategory,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
    );

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _products = response.data!.products;
        _categories = response.data!.categories;
        _currentPage = response.data!.page;
        _totalPages = response.data!.pages;
        _totalProducts = response.data!.total;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load products';
        _isLoading = false;
      });
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _sort = 'newest';
      _minPrice = null;
      _maxPrice = null;
    });
    _loadProducts(page: 1);
  }

  void _showPriceFilter() {
    final minCtrl = TextEditingController(
      text: _minPrice?.toStringAsFixed(0) ?? '',
    );
    final maxCtrl = TextEditingController(
      text: _maxPrice?.toStringAsFixed(0) ?? '',
    );

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: AppTheme.spacing24,
          right: AppTheme.spacing24,
          top: AppTheme.spacing24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + AppTheme.spacing24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Price Range',
              style: Theme.of(
                ctx,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AppTheme.spacing16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: minCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Min ₹',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacing12),
                const Text('—'),
                const SizedBox(width: AppTheme.spacing12),
                Expanded(
                  child: TextField(
                    controller: maxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Max ₹',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        _minPrice = null;
                        _maxPrice = null;
                      });
                      _loadProducts(page: 1);
                    },
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: AppTheme.spacing12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        _minPrice = double.tryParse(minCtrl.text);
                        _maxPrice = double.tryParse(maxCtrl.text);
                      });
                      _loadProducts(page: 1);
                    },
                    child: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.spacing16,
                  AppTheme.spacing16,
                  AppTheme.spacing16,
                  AppTheme.spacing8,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Our Products',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(
                      'Discover our exclusive collection.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ──── Category Chips ────
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacing16,
                  ),
                  children: [
                    _FilterChip(
                      label: 'All',
                      isSelected: _selectedCategory == null,
                      onTap: () {
                        setState(() => _selectedCategory = null);
                        _loadProducts(page: 1);
                      },
                    ),
                    const SizedBox(width: AppTheme.spacing8),
                    ..._categories.map(
                      (cat) => Padding(
                        padding: const EdgeInsets.only(
                          right: AppTheme.spacing8,
                        ),
                        child: _FilterChip(
                          label: cat.name,
                          isSelected: _selectedCategory == cat.id,
                          onTap: () {
                            setState(() => _selectedCategory = cat.id);
                            _loadProducts(page: 1);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ──── Sort + Price + Clear Bar ────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacing16,
                  vertical: AppTheme.spacing8,
                ),
                child: Row(
                  children: [
                    // Sort dropdown
                    Expanded(
                      child: Container(
                        height: 36,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.borderColor),
                          borderRadius: BorderRadius.circular(
                            AppTheme.radiusMd,
                          ),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _sort,
                            isDense: true,
                            isExpanded: true,
                            style: Theme.of(context).textTheme.bodySmall,
                            icon: const Icon(Icons.unfold_more, size: 18),
                            items: _sortOptions.entries
                                .map(
                                  (e) => DropdownMenuItem(
                                    value: e.key,
                                    child: Text(e.value),
                                  ),
                                )
                                .toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _sort = val);
                                _loadProducts(page: 1);
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacing8),

                    // Price filter button
                    SizedBox(
                      height: 36,
                      child: OutlinedButton.icon(
                        onPressed: _showPriceFilter,
                        icon: const Icon(Icons.currency_rupee, size: 16),
                        label: Text(
                          _minPrice != null || _maxPrice != null
                              ? '${_minPrice?.toStringAsFixed(0) ?? '0'} – ${_maxPrice?.toStringAsFixed(0) ?? '∞'}'
                              : 'Price',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          side: BorderSide(
                            color: _minPrice != null || _maxPrice != null
                                ? AppTheme.primaryColor
                                : AppTheme.borderColor,
                          ),
                        ),
                      ),
                    ),

                    // Clear filters
                    if (_hasActiveFilters) ...[
                      const SizedBox(width: AppTheme.spacing8),
                      SizedBox(
                        height: 36,
                        child: IconButton(
                          onPressed: _clearFilters,
                          icon: const Icon(Icons.close, size: 18),
                          tooltip: 'Clear filters',
                          style: IconButton.styleFrom(
                            backgroundColor: AppTheme.accentColor.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppTheme.accentColor,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Results count
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacing16,
                ),
                child: Text(
                  '$_totalProducts product${_totalProducts != 1 ? 's' : ''} found',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: AppTheme.spacing8),
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
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.search_off,
                        size: 64,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(height: AppTheme.spacing16),
                      Text(
                        'No products found',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      if (_hasActiveFilters) ...[
                        const SizedBox(height: AppTheme.spacing12),
                        ElevatedButton(
                          onPressed: _clearFilters,
                          child: const Text('Clear Filters'),
                        ),
                      ],
                    ],
                  ),
                ),
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

            // Pagination Controls
            if (!_isLoading && _products.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing16),
                  child: Column(
                    children: [
                      Text(
                        'Page $_currentPage of $_totalPages',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _currentPage > 1
                                ? () => _loadProducts(page: _currentPage - 1)
                                : null,
                            icon: const Icon(Icons.chevron_left),
                            label: const Text('Previous'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.cardColor,
                              foregroundColor: AppTheme.textPrimary,
                              disabledBackgroundColor: AppTheme.surfaceColor,
                              disabledForegroundColor: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacing16),
                          ElevatedButton.icon(
                            onPressed: _currentPage < _totalPages
                                ? () => _loadProducts(page: _currentPage + 1)
                                : null,
                            icon: const Icon(Icons.chevron_right),
                            label: const Text('Next'),
                            iconAlignment: IconAlignment.end,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.cardColor,
                              foregroundColor: AppTheme.textPrimary,
                              disabledBackgroundColor: AppTheme.surfaceColor,
                              disabledForegroundColor: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════
// FILTER CHIP
// ═══════════════════════════════════════

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.borderColor,
          ),
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: isSelected ? Colors.white : AppTheme.textPrimary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════

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
