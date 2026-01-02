import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';
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
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final _storage = const FlutterSecureStorage();

  late Dio _dio;
  late CookieJar _cookieJar;
  String? _authToken;

  // Initialize service and load saved token
  Future<void> init() async {
    _authToken = await _storage.read(key: AppConstants.tokenKey);

    // Initialize cookie jar with persistent storage
    final appDocDir = await getApplicationDocumentsDirectory();
    final appDocPath = appDocDir.path;
    _cookieJar = PersistCookieJar(
      storage: FileStorage('$appDocPath/.cookies/'),
    );

    // Configure Dio
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: AppConstants.connectionTimeout,
        receiveTimeout: AppConstants.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add cookie manager interceptor
    _dio.interceptors.add(CookieManager(_cookieJar));

    // Add logging interceptor (optional, for debugging)
    _dio.interceptors.add(
      LogInterceptor(requestBody: true, responseBody: true, error: true),
    );
  }

  // Save auth token
  Future<void> saveToken(String token) async {
    _authToken = token;
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  // Clear auth token and cookies
  Future<void> clearToken() async {
    _authToken = null;
    await _storage.delete(key: AppConstants.tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userKey);
    await _cookieJar.deleteAll(); // Clear all cookies
  }

  // Get current token
  String? get token => _authToken;
  bool get isAuthenticated => _authToken != null && _authToken!.isNotEmpty;

  // Generic GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(dynamic)? fromJson,
    bool requiresAuth = false,
  }) async {
    try {
      final response = await _dio.get(
        endpoint,
        queryParameters: queryParams,
        options: Options(
          headers: requiresAuth && _authToken != null
              ? {'Authorization': 'Bearer $_authToken'}
              : null,
        ),
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'An unexpected error occurred',
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
      final response = await _dio.post(
        endpoint,
        data: body,
        options: Options(
          headers: requiresAuth && _authToken != null
              ? {'Authorization': 'Bearer $_authToken'}
              : null,
        ),
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'An unexpected error occurred',
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
      final response = await _dio.put(
        endpoint,
        data: body,
        options: Options(
          headers: requiresAuth && _authToken != null
              ? {'Authorization': 'Bearer $_authToken'}
              : null,
        ),
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'An unexpected error occurred',
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
      final response = await _dio.delete(
        endpoint,
        options: Options(
          headers: requiresAuth && _authToken != null
              ? {'Authorization': 'Bearer $_authToken'}
              : null,
        ),
      );

      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'An unexpected error occurred',
        statusCode: 0,
      );
    }
  }

  // Handle API response
  ApiResponse<T> _handleResponse<T>(
    Response response,
    T Function(dynamic)? fromJson,
  ) {
    try {
      final data = response.data;

      if (response.statusCode! >= 200 && response.statusCode! < 300) {
        T? parsedData;
        if (fromJson != null) {
          parsedData = fromJson(data);
        }

        return ApiResponse<T>(
          success: data['success'] ?? true,
          data: parsedData,
          message: data['message'] as String?,
          statusCode: response.statusCode!,
        );
      } else {
        return ApiResponse<T>(
          success: false,
          message: data['message'] ?? 'Request failed',
          statusCode: response.statusCode!,
        );
      }
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        message: 'Failed to parse response',
        statusCode: response.statusCode ?? 0,
      );
    }
  }

  // Handle Dio errors
  ApiResponse<T> _handleError<T>(DioException error) {
    String message;
    int statusCode = error.response?.statusCode ?? 0;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Request timed out. Please try again.';
        break;
      case DioExceptionType.badResponse:
        final data = error.response?.data;
        message = data is Map
            ? (data['message'] ?? 'Request failed')
            : 'Request failed';
        break;
      case DioExceptionType.cancel:
        message = 'Request was cancelled';
        break;
      case DioExceptionType.connectionError:
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = 'An unexpected error occurred';
    }

    return ApiResponse<T>(
      success: false,
      message: message,
      statusCode: statusCode,
    );
  }
}
