import '../config/constants.dart';
import '../models/order.dart';
import 'api_service.dart';

class OrdersResponse {
  final List<Order> orders;
  final int total;
  final int page;
  final int pages;

  OrdersResponse({
    required this.orders,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory OrdersResponse.fromJson(Map<String, dynamic> json) {
    return OrdersResponse(
      orders: (json['orders'] as List?)
              ?.map((e) => Order.fromJson(e))
              .toList() ??
          [],
      total: json['pagination']?['total'] ?? 0,
      page: json['pagination']?['page'] ?? 1,
      pages: json['pagination']?['pages'] ?? 1,
    );
  }
}

class OrderService {
  static final OrderService _instance = OrderService._internal();
  factory OrderService() => _instance;
  OrderService._internal();

  final _apiService = ApiService();

  // Get user's orders with optional status filter
  Future<ApiResponse<OrdersResponse>> getOrders({
    int page = 1,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': AppConstants.ordersPageSize.toString(),
    };

    if (status != null && status.isNotEmpty && status != 'all') {
      queryParams['status'] = status;
    }

    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.ordersEndpoint,
      queryParams: queryParams,
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final ordersResponse = OrdersResponse.fromJson(response.data!);
      return ApiResponse(
        success: true,
        data: ordersResponse,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to fetch orders',
      statusCode: response.statusCode,
    );
  }

  // Get single order by ID
  Future<ApiResponse<Order>> getOrderById(String id) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '${AppConstants.ordersEndpoint}/$id',
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final order = Order.fromJson(response.data!['order']);
      return ApiResponse(
        success: true,
        data: order,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to fetch order',
      statusCode: response.statusCode,
    );
  }

  // Create a new order
  Future<ApiResponse<Order>> createOrder({
    required Map<String, dynamic> shippingAddress,
    required String paymentMethod,
    String? notes,
    String? couponCode,
    double shippingFee = 0,
  }) async {
    final body = <String, dynamic>{
      'shippingAddress': shippingAddress,
      'paymentMethod': paymentMethod,
      'shippingFee': shippingFee,
    };

    if (notes != null && notes.isNotEmpty) {
      body['notes'] = notes;
    }
    if (couponCode != null && couponCode.isNotEmpty) {
      body['couponCode'] = couponCode;
    }

    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.ordersEndpoint,
      body: body,
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final order = Order.fromJson(response.data!['order']);
      return ApiResponse(
        success: true,
        data: order,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to create order',
      statusCode: response.statusCode,
    );
  }
}
