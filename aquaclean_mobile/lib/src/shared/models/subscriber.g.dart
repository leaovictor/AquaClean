// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subscriber.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Subscriber _$SubscriberFromJson(Map<String, dynamic> json) => _Subscriber(
  id: json['id'] as String,
  userId: json['userId'] as String,
  planId: json['planId'] as String,
  startDate: DateTime.parse(json['startDate'] as String),
  endDate: json['endDate'] == null
      ? null
      : DateTime.parse(json['endDate'] as String),
  status: json['status'] as String,
);

Map<String, dynamic> _$SubscriberToJson(_Subscriber instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'planId': instance.planId,
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'status': instance.status,
    };
