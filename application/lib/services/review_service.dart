import '../config/constants.dart';
import '../models/review.dart';
import 'api_service.dart';

class ReviewService {
  static final ReviewService _instance = ReviewService._internal();
  factory ReviewService() => _instance;
  ReviewService._internal();

  final _apiService = ApiService();

  // Submit a review
  Future<ApiResponse<Review>> submitReview({
    required String productId,
    required int stars,
    required String comment,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '${AppConstants.apiBasePath}/api/reviews',
      body: {'productId': productId, 'stars': stars, 'comment': comment},
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    if (response.success && response.data != null) {
      final review = Review.fromJson(response.data!['review']);
      return ApiResponse(
        success: true,
        data: review,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to submit review',
      statusCode: response.statusCode,
    );
  }

  // Check if user can review a product
  Future<ApiResponse<Map<String, dynamic>>> checkCanReview(
    String productId,
  ) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '${AppConstants.apiBasePath}/api/reviews',
      queryParams: {'productId': productId},
      fromJson: (json) => json as Map<String, dynamic>,
      requiresAuth: true,
    );

    return response;
  }
}
