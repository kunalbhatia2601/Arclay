import '../config/constants.dart';
import '../models/cart.dart';
import 'api_service.dart';

class CartService {
  static final CartService _instance = CartService._internal();
  factory CartService() => _instance;
  CartService._internal();

  final _apiService = ApiService();

  // Get user's cart
  Future<ApiResponse<Cart>> getCart() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.cartEndpoint,
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final cart = Cart.fromJson(response.data!['cart'] ?? {});
      return ApiResponse(
        success: true,
        data: cart,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      data: Cart.empty(),
      message: response.message ?? 'Failed to fetch cart',
      statusCode: response.statusCode,
    );
  }

  // Add item to cart or update quantity
  Future<ApiResponse<Cart>> addToCart({
    required String productId,
    required Map<String, String> variantAttributes,
    required int quantity,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.cartEndpoint,
      body: {
        'productId': productId,
        'variantAttributes': variantAttributes,
        'quantity': quantity,
      },
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final cart = Cart.fromJson(response.data!['cart'] ?? {});
      return ApiResponse(
        success: true,
        data: cart,
        message: response.data!['message'] ?? 'Cart updated',
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to add to cart',
      statusCode: response.statusCode,
    );
  }

  // Remove item from cart
  Future<ApiResponse<Cart>> removeFromCart(String itemId) async {
    final response = await _apiService.delete<Map<String, dynamic>>(
      '${AppConstants.cartEndpoint}/$itemId',
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final cart = Cart.fromJson(response.data!['cart'] ?? {});
      return ApiResponse(
        success: true,
        data: cart,
        message: response.message ?? 'Item removed',
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to remove item',
      statusCode: response.statusCode,
    );
  }

  // Update item quantity
  Future<ApiResponse<Cart>> updateQuantity({
    required String itemId,
    required int quantity,
  }) async {
    final response = await _apiService.put<Map<String, dynamic>>(
      '${AppConstants.cartEndpoint}/$itemId',
      body: {'quantity': quantity},
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final cart = Cart.fromJson(response.data!['cart'] ?? {});
      return ApiResponse(
        success: true,
        data: cart,
        message: response.message ?? 'Quantity updated',
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to update quantity',
      statusCode: response.statusCode,
    );
  }
}
