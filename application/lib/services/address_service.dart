import '../config/constants.dart';
import '../models/address.dart';
import 'api_service.dart';

class AddressService {
  static final AddressService _instance = AddressService._internal();
  factory AddressService() => _instance;
  AddressService._internal();

  final _apiService = ApiService();

  // Get all addresses
  Future<ApiResponse<List<Address>>> getAddresses() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.addressesEndpoint,
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final addresses = (response.data!['addresses'] as List?)
              ?.map((e) => Address.fromJson(e))
              .toList() ??
          [];
      return ApiResponse(
        success: true,
        data: addresses,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      data: [],
      message: response.message ?? 'Failed to fetch addresses',
      statusCode: response.statusCode,
    );
  }

  // Create new address
  Future<ApiResponse<Address>> createAddress(Address address) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.addressesEndpoint,
      body: address.toJson(),
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final newAddress = Address.fromJson(response.data!['address']);
      return ApiResponse(
        success: true,
        data: newAddress,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to create address',
      statusCode: response.statusCode,
    );
  }

  // Update address
  Future<ApiResponse<Address>> updateAddress(
      String id, Address address) async {
    final response = await _apiService.put<Map<String, dynamic>>(
      '${AppConstants.addressesEndpoint}/$id',
      body: address.toJson(),
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final updated = Address.fromJson(response.data!['address']);
      return ApiResponse(
        success: true,
        data: updated,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to update address',
      statusCode: response.statusCode,
    );
  }

  // Delete address
  Future<ApiResponse<void>> deleteAddress(String id) async {
    final response = await _apiService.delete<void>(
      '${AppConstants.addressesEndpoint}/$id',
      requiresAuth: true,
    );

    return response;
  }
}
