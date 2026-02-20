import 'api_service.dart';

class ServiceabilityResponse {
  final bool success;
  final bool serviceable;
  final int couriers;
  final int? estimatedDays;
  final String? message;

  ServiceabilityResponse({
    required this.success,
    required this.serviceable,
    required this.couriers,
    this.estimatedDays,
    this.message,
  });

  factory ServiceabilityResponse.fromJson(Map<String, dynamic> json) {
    return ServiceabilityResponse(
      success: json['success'] ?? false,
      serviceable: json['serviceable'] ?? false,
      couriers: json['couriers'] != null
          ? int.tryParse(json['couriers'].toString()) ?? 0
          : 0,
      estimatedDays: json['estimatedDays'] != null
          ? int.tryParse(json['estimatedDays'].toString())
          : null,
      message: json['message'],
    );
  }
}

class ShippingService {
  static final ShippingService _instance = ShippingService._internal();
  factory ShippingService() => _instance;
  ShippingService._internal();

  final _apiService = ApiService();

  Future<ServiceabilityResponse> checkServiceability(String pincode) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/api/shipping/serviceability',
        body: {'pincode': pincode},
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        return ServiceabilityResponse.fromJson(response.data!);
      } else {
        return ServiceabilityResponse(
          success: false,
          serviceable: false,
          couriers: 0,
          message: response.message,
        );
      }
    } catch (e) {
      return ServiceabilityResponse(
        success: false,
        serviceable: false,
        couriers: 0,
        message: e.toString(),
      );
    }
  }
}
