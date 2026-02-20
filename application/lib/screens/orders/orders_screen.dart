import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  final _orderService = OrderService();
  late TabController _tabController;

  final _statusTabs = [
    {'label': 'All', 'value': 'all'},
    {'label': 'Pending', 'value': 'pending'},
    {'label': 'Confirmed', 'value': 'confirmed'},
    {'label': 'Shipped', 'value': 'shipped'},
    {'label': 'Delivered', 'value': 'delivered'},
    {'label': 'Cancelled', 'value': 'cancelled'},
  ];

  List<Order> _orders = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  String _currentStatus = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statusTabs.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _currentStatus = _statusTabs[_tabController.index]['value']!;
        _loadOrders(page: 1);
      }
    });
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders({int page = 1}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _orderService.getOrders(
      page: page,
      status: _currentStatus == 'all' ? null : _currentStatus,
    );

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _orders = response.data!.orders;
        _currentPage = response.data!.page;
        _totalPages = response.data!.pages;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load orders';
        _isLoading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'processing':
        return Colors.purple;
      case 'shipped':
        return Colors.indigo;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return AppTheme.accentColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Status filter tabs
        TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabAlignment: TabAlignment.start,
          tabs: _statusTabs
              .map((t) => Tab(text: t['label']))
              .toList(),
        ),

        // Orders list
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 64, color: AppTheme.accentColor),
                          const SizedBox(height: AppTheme.spacing16),
                          Text(_error!),
                          const SizedBox(height: AppTheme.spacing24),
                          ElevatedButton(
                            onPressed: () => _loadOrders(page: 1),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : _orders.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: () => _loadOrders(page: 1),
                          child: ListView.builder(
                            padding:
                                const EdgeInsets.all(AppTheme.spacing16),
                            itemCount: _orders.length + (_totalPages > 1 ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (index == _orders.length) {
                                return _buildPagination();
                              }
                              return _OrderCard(
                                order: _orders[index],
                                statusColor: _statusColor(
                                    _orders[index].orderStatus),
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => OrderDetailScreen(
                                          orderId: _orders[index].id),
                                    ),
                                  );
                                },
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.receipt_long_outlined,
              size: 80, color: AppTheme.textSecondary),
          const SizedBox(height: AppTheme.spacing24),
          Text('No orders yet',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppTheme.spacing8),
          Text(
            'Your orders will appear here',
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ElevatedButton(
            onPressed: _currentPage > 1
                ? () => _loadOrders(page: _currentPage - 1)
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cardColor,
              foregroundColor: AppTheme.textPrimary,
            ),
            child: const Text('Previous'),
          ),
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppTheme.spacing16),
            child: Text('$_currentPage / $_totalPages',
                style: Theme.of(context).textTheme.bodyMedium),
          ),
          ElevatedButton(
            onPressed: _currentPage < _totalPages
                ? () => _loadOrders(page: _currentPage + 1)
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.cardColor,
              foregroundColor: AppTheme.textPrimary,
            ),
            child: const Text('Next'),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final Color statusColor;
  final VoidCallback onTap;

  const _OrderCard({
    required this.order,
    required this.statusColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr =
        DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt);
    final firstItem = order.items.isNotEmpty ? order.items.first : null;

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacing16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order ID + Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Order #${order.id.substring(order.id.length - 8)}',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: Text(
                      order.orderStatusDisplay,
                      style:
                          Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: statusColor,
                                fontWeight: FontWeight.w600,
                              ),
                    ),
                  ),
                ],
              ),

              const Divider(height: AppTheme.spacing24),

              // First Item Preview
              if (firstItem != null)
                Row(
                  children: [
                    ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusMd),
                      child: firstItem.product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: firstItem.product.images.first,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(
                                width: 50,
                                height: 50,
                                color: AppTheme.surfaceColor,
                                child: const Icon(Icons.image_outlined,
                                    size: 24),
                              ),
                            )
                          : Container(
                              width: 50,
                              height: 50,
                              color: AppTheme.surfaceColor,
                              child: const Icon(Icons.image_outlined,
                                  size: 24),
                            ),
                    ),
                    const SizedBox(width: AppTheme.spacing12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            firstItem.product.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          if (order.items.length > 1)
                            Text(
                              '+${order.items.length - 1} more item(s)',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                      color: AppTheme.textSecondary),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),

              const SizedBox(height: AppTheme.spacing12),

              // Date + Total
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dateStr,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppTheme.textSecondary),
                  ),
                  Text(
                    '₹${order.totalAmount.toStringAsFixed(0)}',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
