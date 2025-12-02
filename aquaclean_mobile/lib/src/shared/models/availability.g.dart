// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'availability.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Availability _$AvailabilityFromJson(Map<String, dynamic> json) =>
    _Availability(
      date: json['date'] as String,
      isOpen: json['isOpen'] as bool,
      slots: Map<String, int>.from(json['slots'] as Map),
    );

Map<String, dynamic> _$AvailabilityToJson(_Availability instance) =>
    <String, dynamic>{
      'date': instance.date,
      'isOpen': instance.isOpen,
      'slots': instance.slots,
    };
