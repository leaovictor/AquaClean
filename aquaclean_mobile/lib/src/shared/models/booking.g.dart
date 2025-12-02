// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Booking _$BookingFromJson(Map<String, dynamic> json) => _Booking(
  id: json['id'] as String,
  userId: json['userId'] as String,
  vehicleId: json['vehicleId'] as String,
  serviceIds: (json['serviceIds'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  totalPrice: (json['totalPrice'] as num).toDouble(),
  scheduledTime: DateTime.parse(json['scheduledTime'] as String),
  status:
      $enumDecodeNullable(_$BookingStatusEnumMap, json['status']) ??
      BookingStatus.pending,
  staffNotes: json['staffNotes'] as String?,
);

Map<String, dynamic> _$BookingToJson(_Booking instance) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'vehicleId': instance.vehicleId,
  'serviceIds': instance.serviceIds,
  'totalPrice': instance.totalPrice,
  'scheduledTime': instance.scheduledTime.toIso8601String(),
  'status': _$BookingStatusEnumMap[instance.status]!,
  'staffNotes': instance.staffNotes,
};

const _$BookingStatusEnumMap = {
  BookingStatus.pending: 'pending',
  BookingStatus.confirmed: 'confirmed',
  BookingStatus.washing: 'washing',
  BookingStatus.drying: 'drying',
  BookingStatus.finished: 'finished',
  BookingStatus.cancelled: 'cancelled',
};
