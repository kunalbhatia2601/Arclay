class Category {
  final String id;
  final String name;

  Category({
    required this.id,
    required this.name,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

class VariationType {
  final String name;
  final List<String> options;

  VariationType({
    required this.name,
    required this.options,
  });

  factory VariationType.fromJson(Map<String, dynamic> json) {
    return VariationType(
      name: json['name'] ?? '',
      options: List<String>.from(json['options'] ?? []),
    );
  }
}

class ProductVariant {
  final Map<String, String> attributes;
  final double regularPrice;
  final double? salePrice;
  final int stock;
  final String sku;

  ProductVariant({
    required this.attributes,
    required this.regularPrice,
    this.salePrice,
    required this.stock,
    required this.sku,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      attributes: Map<String, String>.from(json['attributes'] ?? {}),
      regularPrice: (json['regularPrice'] ?? 0).toDouble(),
      salePrice: json['salePrice'] != null 
          ? (json['salePrice']).toDouble() 
          : null,
      stock: json['stock'] ?? 0,
      sku: json['sku'] ?? '',
    );
  }

  double get effectivePrice => salePrice ?? regularPrice;
  bool get hasDiscount => salePrice != null && salePrice! < regularPrice;
  int get discountPercentage {
    if (!hasDiscount) return 0;
    return (((regularPrice - salePrice!) / regularPrice) * 100).round();
  }
}

class Product {
  final String id;
  final String name;
  final List<String> images;
  final String description;
  final Category? category;
  final List<VariationType> variationTypes;
  final List<ProductVariant> variants;
  final bool isActive;
  final DateTime createdAt;

  Product({
    required this.id,
    required this.name,
    required this.images,
    required this.description,
    this.category,
    required this.variationTypes,
    required this.variants,
    required this.isActive,
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      description: json['description'] ?? '',
      category: json['category'] != null 
          ? Category.fromJson(json['category'])
          : null,
      variationTypes: (json['variationTypes'] as List?)
          ?.map((e) => VariationType.fromJson(e))
          .toList() ?? [],
      variants: (json['variants'] as List?)
          ?.map((e) => ProductVariant.fromJson(e))
          .toList() ?? [],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  // Get the first variant's price for display
  double get displayPrice {
    if (variants.isEmpty) return 0;
    return variants.first.effectivePrice;
  }

  // Get price range if variants have different prices
  String get priceRange {
    if (variants.isEmpty) return '₹0';
    
    final prices = variants.map((v) => v.effectivePrice).toSet().toList()..sort();
    
    if (prices.length == 1) {
      return '₹${prices.first.toStringAsFixed(0)}';
    } else {
      return '₹${prices.first.toStringAsFixed(0)} - ₹${prices.last.toStringAsFixed(0)}';
    }
  }

  // Check if product has any discount
  bool get hasDiscount {
    return variants.any((v) => v.hasDiscount);
  }

  // Get minimum discount percentage
  int get maxDiscountPercentage {
    if (!hasDiscount) return 0;
    return variants
        .where((v) => v.hasDiscount)
        .map((v) => v.discountPercentage)
        .reduce((a, b) => a > b ? a : b);
  }
}
