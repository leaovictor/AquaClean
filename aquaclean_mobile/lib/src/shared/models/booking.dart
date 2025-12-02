import 'package:freezed_annotation/freezed_annotation.dart';

part 'booking.freezed.dart';
part 'booking.g.dart';

enum BookingStatus { pending, confirmed, washing, drying, finished, cancelled }

@freezed
abstract class Booking with _$Booking {
  const factory Booking({
    required String id,
    required String userId,
    required String vehicleId,
    required List<String> serviceIds,
    required double totalPrice,
    required DateTime scheduledTime,
    @Default(BookingStatus.pending) BookingStatus status,
    String? staffNotes,
  }) = _Booking;

  factory Booking.fromJson(Map<String, dynamic> json) =>
      _$BookingFromJson(json);
}
