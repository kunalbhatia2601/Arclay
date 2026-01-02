class CartItemVariant {
  final Map<String, String> attributes;
  final double price;
  final int stock;
  final String sku;

  CartItemVariant({
    required this.attributes,
    required this.price,
    required this.stock,
    required this.sku,
  });

  factory CartItemVariant.fromJson(Map<String, dynamic> json) {
    return CartItemVariant(
      attributes: Map<String, String>.from(json['attributes'] ?? {}),
      price: (json['price'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      sku: json['sku'] ?? '',
    );
  }
}

class CartItemProduct {
  final String id;
  final String name;
  final List<String> images;
  final bool isActive;

  CartItemProduct({
    required this.id,
    required this.name,
    required this.images,
    required this.isActive,
  });

  factory CartItemProduct.fromJson(Map<String, dynamic> json) {
    return CartItemProduct(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      isActive: json['isActive'] ?? true,
    );
  }
}

class CartItem {
  final String id;
  final CartItemProduct product;
  final CartItemVariant variant;
  final int quantity;
  final double subtotal;
  final bool available;

  CartItem({
    required this.id,
    required this.product,
    required this.variant,
    required this.quantity,
    required this.subtotal,
    required this.available,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['_id'] ?? '',
      product: CartItemProduct.fromJson(json['product'] ?? {}),
      variant: CartItemVariant.fromJson(json['variant'] ?? {}),
      quantity: json['quantity'] ?? 0,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      available: json['available'] ?? false,
    );
  }
}

class Cart {
  final List<CartItem> items;
  final double total;
  final int itemCount;

  Cart({
    required this.items,
    required this.total,
    required this.itemCount,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    return Cart(
      items: (json['items'] as List?)
          ?.map((e) => CartItem.fromJson(e))
          .toList() ?? [],
      total: (json['total'] ?? 0).toDouble(),
      itemCount: json['itemCount'] ?? 0,
    );
  }

  factory Cart.empty() {
    return Cart(items: [], total: 0, itemCount: 0);
  }

  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;
}
