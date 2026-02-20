import '../config/constants.dart';
import 'api_service.dart';

class RazorpayOrderResponse {
  final String razorpayOrderId;
  final String keyId;
  final int amount;
  final String currency;
  final String name;
  final String orderId;

  RazorpayOrderResponse({
    required this.razorpayOrderId,
    required this.keyId,
    required this.amount,
    required this.currency,
    required this.name,
    required this.orderId,
  });

  factory RazorpayOrderResponse.fromJson(Map<String, dynamic> json) {
    return RazorpayOrderResponse(
      razorpayOrderId: json['razorpayOrderId'] ?? '',
      keyId: json['keyId'] ?? '',
      amount: json['amount'] ?? 0,
      currency: json['currency'] ?? 'INR',
      name: json['name'] ?? '',
      orderId: json['orderId'] ?? '',
    );
  }
}

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  final _apiService = ApiService();

  // Create Razorpay order
  Future<ApiResponse<RazorpayOrderResponse>> createRazorpayOrder(
      String orderId) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.razorpayCreateEndpoint,
      body: {'orderId': orderId},
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final razorpayOrder = RazorpayOrderResponse.fromJson(response.data!);
      return ApiResponse(
        success: true,
        data: razorpayOrder,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to create payment order',
      statusCode: response.statusCode,
    );
  }

  // Verify Razorpay payment
  Future<ApiResponse<Map<String, dynamic>>> verifyRazorpayPayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.razorpayVerifyEndpoint,
      body: {
        'orderId': orderId,
        'razorpayOrderId': razorpayOrderId,
        'razorpayPaymentId': razorpayPaymentId,
        'razorpaySignature': razorpaySignature,
      },
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    return response;
  }
}
