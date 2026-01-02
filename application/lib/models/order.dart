class OrderItemVariant {
  final Map<String, String> attributes;
  final double price;
  final String sku;

  OrderItemVariant({
    required this.attributes,
    required this.price,
    required this.sku,
  });

  factory OrderItemVariant.fromJson(Map<String, dynamic> json) {
    return OrderItemVariant(
      attributes: Map<String, String>.from(json['attributes'] ?? {}),
      price: (json['price'] ?? 0).toDouble(),
      sku: json['sku'] ?? '',
    );
  }
}

class OrderItemProduct {
  final String id;
  final String name;
  final List<String> images;

  OrderItemProduct({
    required this.id,
    required this.name,
    required this.images,
  });

  factory OrderItemProduct.fromJson(Map<String, dynamic> json) {
    return OrderItemProduct(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      images: List<String>.from(json['images'] ?? []),
    );
  }
}

class OrderItem {
  final OrderItemProduct product;
  final OrderItemVariant variant;
  final int quantity;
  final double priceAtOrder;

  OrderItem({
    required this.product,
    required this.variant,
    required this.quantity,
    required this.priceAtOrder,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      product: OrderItemProduct.fromJson(json['product'] ?? {}),
      variant: OrderItemVariant.fromJson(json['variant'] ?? {}),
      quantity: json['quantity'] ?? 0,
      priceAtOrder: (json['priceAtOrder'] ?? 0).toDouble(),
    );
  }

  double get itemTotal => priceAtOrder * quantity;
}

class ShippingAddress {
  final String fullName;
  final String phone;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String pincode;
  final String country;

  ShippingAddress({
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.country,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      country: json['country'] ?? 'India',
    );
  }

  String get fullAddress {
    final parts = <String>[
      addressLine1,
      if (addressLine2.isNotEmpty) addressLine2,
      city,
      state,
      pincode,
      country,
    ];
    return parts.join(', ');
  }
}

class Order {
  final String id;
  final List<OrderItem> items;
  final ShippingAddress shippingAddress;
  final String paymentMethod;
  final String paymentStatus;
  final String paymentId;
  final String orderStatus;
  final double totalAmount;
  final String notes;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Order({
    required this.id,
    required this.items,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.paymentId,
    required this.orderStatus,
    required this.totalAmount,
    required this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] ?? '',
      items: (json['items'] as List?)
          ?.map((e) => OrderItem.fromJson(e))
          .toList() ?? [],
      shippingAddress: ShippingAddress.fromJson(json['shippingAddress'] ?? {}),
      paymentMethod: json['paymentMethod'] ?? '',
      paymentStatus: json['paymentStatus'] ?? 'pending',
      paymentId: json['paymentId'] ?? '',
      orderStatus: json['orderStatus'] ?? 'pending',
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      notes: json['notes'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  // Helper methods
  bool get isPending => orderStatus == 'pending';
  bool get isConfirmed => orderStatus == 'confirmed';
  bool get isProcessing => orderStatus == 'processing';
  bool get isShipped => orderStatus == 'shipped';
  bool get isDelivered => orderStatus == 'delivered';
  bool get isCancelled => orderStatus == 'cancelled';

  bool get isPaymentPending => paymentStatus == 'pending';
  bool get isPaymentCompleted => paymentStatus == 'completed';
  bool get isPaymentFailed => paymentStatus == 'failed';

  String get orderStatusDisplay {
    switch (orderStatus) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return orderStatus;
    }
  }

  String get paymentMethodDisplay {
    switch (paymentMethod) {
      case 'razorpay':
        return 'Razorpay';
      case 'stripe':
        return 'Stripe';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return paymentMethod;
    }
  }
}
