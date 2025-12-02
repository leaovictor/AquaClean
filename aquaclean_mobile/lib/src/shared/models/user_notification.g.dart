// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_UserNotification _$UserNotificationFromJson(Map<String, dynamic> json) =>
    _UserNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      isRead: json['isRead'] as bool? ?? false,
      timestamp: DateTime.parse(json['timestamp'] as String),
      bookingId: json['bookingId'] as String?,
      type: json['type'] as String? ?? 'info',
    );

Map<String, dynamic> _$UserNotificationToJson(_UserNotification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'body': instance.body,
      'isRead': instance.isRead,
      'timestamp': instance.timestamp.toIso8601String(),
      'bookingId': instance.bookingId,
      'type': instance.type,
    };
