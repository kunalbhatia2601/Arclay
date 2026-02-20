import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final _orderService = OrderService();

  Order? _order;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _orderService.getOrderById(widget.orderId);

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _order = response.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load order';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_order != null
            ? 'Order #${_order!.id.substring(_order!.id.length - 8)}'
            : 'Order Details'),
      ),
      body: _isLoading
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
                        onPressed: _loadOrder,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_order == null) return const SizedBox();

    return RefreshIndicator(
      onRefresh: _loadOrder,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Status Tracker
            _buildStatusTracker(),
            const SizedBox(height: AppTheme.spacing24),

            // Order Items
            _buildSection('Items', _buildItemsList()),
            const SizedBox(height: AppTheme.spacing16),

            // Shipping Address
            _buildSection('Shipping Address', _buildAddress()),
            const SizedBox(height: AppTheme.spacing16),

            // Payment Info
            _buildSection('Payment', _buildPaymentInfo()),
            const SizedBox(height: AppTheme.spacing16),

            // Order Summary
            _buildSection('Order Summary', _buildSummary()),
            const SizedBox(height: AppTheme.spacing24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTracker() {
    final statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    final statusLabels = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

    int currentStep = _order!.isCancelled
        ? -1
        : statuses.indexOf(_order!.orderStatus);
    if (currentStep < 0 && !_order!.isCancelled) currentStep = 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: _order!.isCancelled
            ? Row(
                children: [
                  const Icon(Icons.cancel, color: Colors.red, size: 32),
                  const SizedBox(width: AppTheme.spacing12),
                  Text(
                    'Order Cancelled',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: Colors.red),
                  ),
                ],
              )
            : Column(
                children: [
                  for (int i = 0; i < statuses.length; i++) ...[
                    Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: i <= currentStep
                                ? AppTheme.primaryColor
                                : AppTheme.borderColor,
                          ),
                          child: Icon(
                            i <= currentStep
                                ? Icons.check
                                : Icons.circle,
                            size: i <= currentStep ? 16 : 8,
                            color: i <= currentStep
                                ? Colors.white
                                : AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacing12),
                        Expanded(
                          child: Text(
                            statusLabels[i],
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  fontWeight: i <= currentStep
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                  color: i <= currentStep
                                      ? AppTheme.textPrimary
                                      : AppTheme.textSecondary,
                                ),
                          ),
                        ),
                      ],
                    ),
                    if (i < statuses.length - 1)
                      Container(
                        margin: const EdgeInsets.only(left: 13),
                        width: 2,
                        height: 24,
                        color: i < currentStep
                            ? AppTheme.primaryColor
                            : AppTheme.borderColor,
                      ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildSection(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppTheme.spacing12),
        child,
      ],
    );
  }

  Widget _buildItemsList() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing12),
        child: Column(
          children: _order!.items.asMap().entries.map((entry) {
            final item = entry.value;
            final isLast = entry.key == _order!.items.length - 1;
            final variantText = item.variant.attributes.entries
                .map((e) => '${e.key}: ${e.value}')
                .join(', ');

            return Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusMd),
                      child: item.product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: item.product.images.first,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(
                                width: 60,
                                height: 60,
                                color: AppTheme.surfaceColor,
                                child: const Icon(Icons.image_outlined),
                              ),
                            )
                          : Container(
                              width: 60,
                              height: 60,
                              color: AppTheme.surfaceColor,
                              child: const Icon(Icons.image_outlined),
                            ),
                    ),
                    const SizedBox(width: AppTheme.spacing12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.product.name,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                      fontWeight: FontWeight.w500)),
                          if (variantText.isNotEmpty)
                            Text(variantText,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                        color:
                                            AppTheme.textSecondary)),
                          const SizedBox(height: AppTheme.spacing4),
                          Text(
                            'Qty: ${item.quantity} × ₹${item.priceAtOrder.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₹${item.itemTotal.toStringAsFixed(0)}',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                if (!isLast)
                  const Divider(height: AppTheme.spacing24),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildAddress() {
    final addr = _order!.shippingAddress;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(addr.fullName,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: AppTheme.spacing4),
            Text(addr.fullAddress,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppTheme.textSecondary)),
            const SizedBox(height: AppTheme.spacing4),
            Text('Phone: ${addr.phone}',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo() {
    Color paymentStatusColor;
    switch (_order!.paymentStatus) {
      case 'completed':
        paymentStatusColor = Colors.green;
        break;
      case 'failed':
        paymentStatusColor = Colors.red;
        break;
      case 'refunded':
        paymentStatusColor = Colors.orange;
        break;
      default:
        paymentStatusColor = Colors.orange;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Column(
          children: [
            _infoRow('Method', _order!.paymentMethodDisplay),
            const SizedBox(height: AppTheme.spacing8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Status',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppTheme.textSecondary)),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: paymentStatusColor.withOpacity(0.1),
                    borderRadius:
                        BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Text(
                    _order!.paymentStatus.toUpperCase(),
                    style:
                        Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: paymentStatusColor,
                              fontWeight: FontWeight.w600,
                            ),
                  ),
                ),
              ],
            ),
            if (_order!.paymentId.isNotEmpty) ...[
              const SizedBox(height: AppTheme.spacing8),
              _infoRow('Payment ID', _order!.paymentId),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummary() {
    final dateStr =
        DateFormat('dd MMM yyyy, hh:mm a').format(_order!.createdAt);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Column(
          children: [
            _infoRow('Order Date', dateStr),
            const SizedBox(height: AppTheme.spacing8),
            const Divider(),
            const SizedBox(height: AppTheme.spacing8),
            _infoRow(
              'Total Amount',
              '₹${_order!.totalAmount.toStringAsFixed(0)}',
              bold: true,
            ),
            if (_order!.notes.isNotEmpty) ...[
              const SizedBox(height: AppTheme.spacing8),
              const Divider(),
              const SizedBox(height: AppTheme.spacing8),
              Align(
                alignment: Alignment.centerLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Notes',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppTheme.textSecondary)),
                    const SizedBox(height: AppTheme.spacing4),
                    Text(_order!.notes,
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppTheme.textSecondary)),
        Flexible(
          child: Text(value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: bold ? FontWeight.bold : FontWeight.w500,
                    color: bold ? AppTheme.primaryColor : null,
                  ),
              textAlign: TextAlign.end),
        ),
      ],
    );
  }
}
