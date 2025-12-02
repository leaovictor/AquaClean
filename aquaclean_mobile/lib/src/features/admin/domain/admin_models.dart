class SubscriptionPlan {
  final String id;
  final String name;
  final double price;
  final List<String> features;
  final bool isActive;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.features,
    this.isActive = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'price': price,
      'features': features,
      'is_active': isActive,
    };
  }

  factory SubscriptionPlan.fromMap(String id, Map<String, dynamic> map) {
    return SubscriptionPlan(
      id: id,
      name: map['name'] ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      features: List<String>.from(map['features'] ?? []),
      isActive: map['is_active'] ?? true,
    );
  }
}

class Subscriber {
  final String id;
  final String userId;
  final String planId;
  final DateTime startDate;
  final DateTime? endDate;
  final String status; // 'active', 'canceled', 'expired'

  Subscriber({
    required this.id,
    required this.userId,
    required this.planId,
    required this.startDate,
    this.endDate,
    required this.status,
  });

  factory Subscriber.fromMap(String id, Map<String, dynamic> map) {
    return Subscriber(
      id: id,
      userId: map['user_id'] ?? '',
      planId: map['plan_id'] ?? '',
      startDate: DateTime.parse(map['start_date']),
      endDate: map['end_date'] != null ? DateTime.parse(map['end_date']) : null,
      status: map['status'] ?? 'active',
    );
  }
}

class Availability {
  final String date; // YYYY-MM-DD
  final bool isOpen;
  final Map<String, int> slots; // "09:00" -> 3

  Availability({required this.date, required this.isOpen, required this.slots});

  Map<String, dynamic> toMap() {
    return {'date': date, 'is_open': isOpen, 'slots': slots};
  }

  factory Availability.fromMap(Map<String, dynamic> map) {
    return Availability(
      date: map['date'] ?? '',
      isOpen: map['is_open'] ?? true,
      slots: Map<String, int>.from(map['slots'] ?? {}),
    );
  }
}
