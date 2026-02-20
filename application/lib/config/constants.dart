class AppConstants {
  // API Configuration
  static const String baseUrl = 'https://arclay.kunalbhatia.dev';
  static const String apiBasePath = '';

  // API Endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String registerEndpoint = '/api/auth/register';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String meEndpoint = '/api/auth/me';

  static const String productsEndpoint = '/api/products';
  static const String cartEndpoint = '/api/cart';
  static const String ordersEndpoint = '/api/orders';
  static const String addressesEndpoint = '/api/addresses';

  static const String razorpayCreateEndpoint =
      '/api/payment/razorpay/create-order';
  static const String razorpayVerifyEndpoint = '/api/payment/razorpay/verify';
  static const String stripeCreateEndpoint =
      '/api/payment/stripe/create-intent';
  static const String couponsValidateEndpoint = '/api/coupons/validate';
  static const String couponsEndpoint = '/api/coupons';
  static const String settingsEndpoint = '/api/settings';
  static const String appConfigEndpoint = '/api/app-config';

  // App Info
  static const String appName = 'Essvora';
  static const String appDescription =
      'Gourmet Indian Food - Premium Pickles & Snacks';

  // Local Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String cartCountKey = 'cart_count';

  // Pagination
  static const int defaultPageSize = 12;
  static const int ordersPageSize = 10;

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectionTimeout = Duration(seconds: 10);

  // Order Status
  static const String orderStatusPending = 'pending';
  static const String orderStatusConfirmed = 'confirmed';
  static const String orderStatusProcessing = 'processing';
  static const String orderStatusShipped = 'shipped';
  static const String orderStatusDelivered = 'delivered';
  static const String orderStatusCancelled = 'cancelled';

  // Payment Methods
  static const String paymentMethodRazorpay = 'razorpay';
  static const String paymentMethodStripe = 'stripe';
  static const String paymentMethodCOD = 'cod';

  // Payment Status
  static const String paymentStatusPending = 'pending';
  static const String paymentStatusCompleted = 'completed';
  static const String paymentStatusFailed = 'failed';
  static const String paymentStatusRefunded = 'refunded';
}
