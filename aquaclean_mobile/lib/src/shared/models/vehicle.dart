import 'package:freezed_annotation/freezed_annotation.dart';

part 'vehicle.freezed.dart';
part 'vehicle.g.dart';

@freezed
abstract class Vehicle with _$Vehicle {
  const factory Vehicle({
    required String id,
    required String brand,
    required String model,
    required String plate,
    required String color,
    @Default('sedan') String type, // suv/sedan/hatch
    String? photoUrl,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) =>
      _$VehicleFromJson(json);
}
