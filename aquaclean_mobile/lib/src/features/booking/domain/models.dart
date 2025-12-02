import 'package:cloud_firestore/cloud_firestore.dart';

class Service {
  final String id;
  final String name;
  final double price;
  final int durationMinutes;

  Service({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
  });
}

class Vehicle {
  final String id;
  final String userId;
  final String make;
  final String model;
  final String plate;
  final String type; // 'sedan', 'suv', etc.

  Vehicle({
    required this.id,
    required this.userId,
    required this.make,
    required this.model,
    required this.plate,
    required this.type,
  });

  factory Vehicle.fromMap(Map<String, dynamic> map, String id) {
    return Vehicle(
      id: id,
      userId: map['user_id'] ?? '',
      make: map['make'] ?? '',
      model: map['model'] ?? '',
      plate: map['plate'] ?? '',
      type: map['type'] ?? 'sedan',
    );
  }
}

class Appointment {
  final String id;
  final String userId;
  final String vehicleId;
  final String serviceId;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final double totalPrice;

  Appointment({
    required this.id,
    required this.userId,
    required this.vehicleId,
    required this.serviceId,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.totalPrice,
  });

  Appointment copyWith({
    String? id,
    String? userId,
    String? vehicleId,
    String? serviceId,
    DateTime? startTime,
    DateTime? endTime,
    String? status,
    double? totalPrice,
  }) {
    return Appointment(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      vehicleId: vehicleId ?? this.vehicleId,
      serviceId: serviceId ?? this.serviceId,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      totalPrice: totalPrice ?? this.totalPrice,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'vehicle_id': vehicleId,
      'service_id': serviceId,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'status': status,
      'total_price': totalPrice,
    };
  }

  factory Appointment.fromMap(Map<String, dynamic> map, String id) {
    DateTime parseDate(dynamic value) {
      if (value is String) return DateTime.parse(value);
      if (value is Timestamp) return value.toDate();
      return DateTime.now(); // Fallback
    }

    return Appointment(
      id: id,
      userId: map['user_id']?.toString() ?? '',
      vehicleId: map['vehicle_id']?.toString() ?? '',
      serviceId: map['service_id']?.toString() ?? '',
      startTime: parseDate(map['start_time']),
      endTime: parseDate(map['end_time']),
      status: map['status']?.toString() ?? 'pending',
      totalPrice: (map['total_price'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
