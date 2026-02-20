import '../config/constants.dart';
import '../models/product.dart';
import '../models/review.dart';
import 'api_service.dart';

class ProductsResponse {
  final List<Product> products;
  final List<Category> categories;
  final int total;
  final int page;
  final int pages;

  ProductsResponse({
    required this.products,
    required this.categories,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory ProductsResponse.fromJson(Map<String, dynamic> json) {
    return ProductsResponse(
      products:
          (json['products'] as List?)
              ?.map((e) => Product.fromJson(e))
              .toList() ??
          [],
      categories:
          (json['categories'] as List?)
              ?.map((e) => Category.fromJson(e))
              .toList() ??
          [],
      total: json['pagination']?['total'] ?? 0,
      page: json['pagination']?['page'] ?? 1,
      pages: json['pagination']?['pages'] ?? 1,
    );
  }
}

class ProductDetailResponse {
  final Product product;
  final List<Review> reviews;
  final List<Product> relatedProducts;

  ProductDetailResponse({
    required this.product,
    required this.reviews,
    required this.relatedProducts,
  });
}

class ProductsService {
  static final ProductsService _instance = ProductsService._internal();
  factory ProductsService() => _instance;
  ProductsService._internal();

  final _apiService = ApiService();

  // Fetch products with filters
  Future<ApiResponse<ProductsResponse>> getProducts({
    int page = 1,
    int limit = 12,
    String? search,
    String? category,
    double? minPrice,
    double? maxPrice,
    String sort = 'newest',
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      'sort': sort,
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (category != null && category.isNotEmpty) {
      queryParams['category'] = category;
    }
    if (minPrice != null) {
      queryParams['minPrice'] = minPrice.toString();
    }
    if (maxPrice != null) {
      queryParams['maxPrice'] = maxPrice.toString();
    }

    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.productsEndpoint,
      queryParams: queryParams,
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final productsResponse = ProductsResponse.fromJson(response.data!);
      return ApiResponse(
        success: true,
        data: productsResponse,
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to fetch products',
      statusCode: response.statusCode,
    );
  }

  // Get product by ID — returns product, reviews, and related products
  Future<ApiResponse<ProductDetailResponse>> getProductById(String id) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '${AppConstants.productsEndpoint}/$id',
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      final product = Product.fromJson(response.data!['product']);
      final reviews =
          (response.data!['reviews'] as List?)
              ?.map((e) => Review.fromJson(e))
              .toList() ??
          [];
      final relatedProducts =
          (response.data!['relatedProducts'] as List?)
              ?.map((e) => Product.fromJson(e))
              .toList() ??
          [];

      return ApiResponse(
        success: true,
        data: ProductDetailResponse(
          product: product,
          reviews: reviews,
          relatedProducts: relatedProducts,
        ),
        message: response.message,
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: false,
      message: response.message ?? 'Failed to fetch product',
      statusCode: response.statusCode,
    );
  }
}
