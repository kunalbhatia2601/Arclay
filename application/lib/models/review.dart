class Review {
  final String id;
  final ReviewUser user;
  final String productId;
  final int stars;
  final String comment;
  final bool isActive;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.user,
    required this.productId,
    required this.stars,
    required this.comment,
    required this.isActive,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id'] ?? '',
      user: json['user'] is Map<String, dynamic>
          ? ReviewUser.fromJson(json['user'])
          : ReviewUser(id: '', name: json['userName'] ?? 'Anonymous'),
      productId: json['product'] is String
          ? json['product']
          : (json['product']?['_id'] ?? ''),
      stars: json['stars'] ?? 0,
      comment: json['comment'] ?? '',
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'stars': stars,
    'comment': comment,
  };
}

class ReviewUser {
  final String id;
  final String name;

  ReviewUser({required this.id, required this.name});

  factory ReviewUser.fromJson(Map<String, dynamic> json) {
    return ReviewUser(id: json['_id'] ?? '', name: json['name'] ?? 'Anonymous');
  }
}
