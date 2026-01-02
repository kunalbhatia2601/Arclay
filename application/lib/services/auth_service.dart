import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../config/constants.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final _apiService = ApiService();
  User? _currentUser;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  // Initialize auth service
  Future<void> init() async {
    await _apiService.init();
    await _loadSavedUser();
  }

  // Load saved user from local storage
  Future<void> _loadSavedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(AppConstants.userKey);
      
      if (userJson != null && _apiService.isAuthenticated) {
        _currentUser = User.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      // Failed to load user, continue without auth
      _currentUser = null;
    }
  }

  // Save user to local storage
  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
    _currentUser = user;
  }

  // Clear user from local storage
  Future<void> _clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userKey);
    _currentUser = null;
  }

  // Register new user
  Future<ApiResponse<User>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.registerEndpoint,
      body: {
        'name': name,
        'email': email,
        'password': password,
        if (phone != null) 'phone': phone,
      },
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final user = User.fromJson(response.data!['user']);
      await _saveUser(user);
      // Note: Token will be in cookie, we don't get it in response
      // Set a placeholder token to indicate authenticated state
      await _apiService.saveToken('authenticated');
      
      return ApiResponse(
        success: true,
        data: user,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Registration failed',
      statusCode: response.statusCode,
    );
  }

  // Login user
  Future<ApiResponse<User>> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      AppConstants.loginEndpoint,
      body: {
        'email': email,
        'password': password,
      },
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final user = User.fromJson(response.data!['user']);
      await _saveUser(user);
      // Note: Token will be in cookie, we don't get it in response
      // Set a placeholder token to indicate authenticated state
      await _apiService.saveToken('authenticated');
      
      return ApiResponse(
        success: true,
        data: user,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Login failed',
      statusCode: response.statusCode,
    );
  }

  // Logout user
  Future<ApiResponse<void>> logout() async {
    final response = await _apiService.post<void>(
      AppConstants.logoutEndpoint,
      requiresAuth: true,
    );

    // Clear local state regardless of API response
    await _apiService.clearToken();
    await _clearUser();

    return response;
  }

  // Get current user from API
  Future<ApiResponse<User>> getCurrentUser() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.meEndpoint,
      requiresAuth: true,
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final user = User.fromJson(response.data!['user']);
      await _saveUser(user);
      
      return ApiResponse(
        success: true,
        data: user,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    // If failed, clear auth state
    if (response.statusCode == 401) {
      await _apiService.clearToken();
      await _clearUser();
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to get user',
      statusCode: response.statusCode,
    );
  }
}
