import 'package:freezed_annotation/freezed_annotation.dart';

part 'availability.freezed.dart';
part 'availability.g.dart';

@freezed
abstract class Availability with _$Availability {
  const factory Availability({
    required String date, // YYYY-MM-DD
    required bool isOpen,
    required Map<String, int> slots, // "09:00" -> 3
  }) = _Availability;

  factory Availability.fromJson(Map<String, dynamic> json) =>
      _$AvailabilityFromJson(json);
}
