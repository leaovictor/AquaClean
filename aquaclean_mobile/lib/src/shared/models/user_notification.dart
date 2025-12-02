import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

part 'user_notification.freezed.dart';
part 'user_notification.g.dart';

@freezed
abstract class UserNotification with _$UserNotification {
  const factory UserNotification({
    required String id,
    required String title,
    required String body,
    @Default(false) bool isRead,
    required DateTime timestamp,
    String? bookingId,
    @Default('info') String type,
  }) = _UserNotification;

  factory UserNotification.fromJson(Map<String, dynamic> json) =>
      _$UserNotificationFromJson(json);
}
