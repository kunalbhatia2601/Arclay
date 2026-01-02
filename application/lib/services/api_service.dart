import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    required this.statusCode,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
    int statusCode,
  ) {
    return ApiResponse(
      success: json['success'] ?? false,
      data: fromJsonT != null && json['data'] != null 
          ? fromJsonT(json['data'])
          : json['data'] as T?,
      message: json['message'] as String?,
      statusCode: statusCode,
    );
  }
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final _storage = const FlutterSecureStorage();
  
  String? _authToken;
  
  // Initialize service and load saved token
  Future<void> init() async {
    _authToken = await _storage.read(key: AppConstants.tokenKey);
  }

  // Save auth token
  Future<void> saveToken(String token) async {
    _authToken = token;
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  // Clear auth token
  Future<void> clearToken() async {
    _authToken = null;
    await _storage.delete(key: AppConstants.tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userKey);
  }

  // Get current token
  String? get token => _authToken;
  bool get isAuthenticated => _authToken != null && _authToken!.isNotEmpty;

  // Build full URL
  String _buildUrl(String endpoint, [Map<String, String>? queryParams]) {
    var url = '${AppConstants.baseUrl}$endpoint';
    
    if (queryParams != null && queryParams.isNotEmpty) {
      final query = queryParams.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');
      url = '$url?$query';
    }
    
    return url;
  }

  // Build headers
  Map<String, String> _buildHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && _authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    return headers;
  }

  // Generic GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(dynamic)? fromJson,
    bool requiresAuth = false,
  }) async {
    try {
      final url = _buildUrl(endpoint, queryParams);
      final response = await http
          .get(
            Uri.parse(url),
            headers: _buildHeaders(includeAuth: requiresAuth),
          )
          .timeout(AppConstants.apiTimeout);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  // Generic POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = false,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http
          .post(
            Uri.parse(url),
            headers: _buildHeaders(includeAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConstants.apiTimeout);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  // Generic PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = false,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http
          .put(
            Uri.parse(url),
            headers: _buildHeaders(includeAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(AppConstants.apiTimeout);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  // Generic DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    T Function(dynamic)? fromJson,
    bool requiresAuth = false,
  }) async {
    try {
      final url = _buildUrl(endpoint);
      final response = await http
          .delete(
            Uri.parse(url),
            headers: _buildHeaders(includeAuth: requiresAuth),
          )
          .timeout(AppConstants.apiTimeout);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _getErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  // Handle API response
  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? fromJson,
  ) {
    try {
      final jsonResponse = jsonDecode(response.body);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        T? data;
        if (fromJson != null) {
          data = fromJson(jsonResponse);
        }
        
        return ApiResponse<T>(
          success: jsonResponse['success'] ?? true,
          data: data,
          message: jsonResponse['message'] as String?,
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse<T>(
          success: false,
          message: jsonResponse['message'] ?? 'Request failed',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        message: 'Failed to parse response',
        statusCode: response.statusCode,
      );
    }
  }

  // Get error message from exception
  String _getErrorMessage(dynamic error) {
    if (error is http.ClientException) {
      return 'Network error. Please check your connection.';
    } else if (error.toString().contains('TimeoutException')) {
      return 'Request timed out. Please try again.';
    } else {
      return 'An unexpected error occurred.';
    }
  }
}
