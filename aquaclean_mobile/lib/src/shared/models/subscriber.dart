import 'package:freezed_annotation/freezed_annotation.dart';

part 'subscriber.freezed.dart';
part 'subscriber.g.dart';

@freezed
abstract class Subscriber with _$Subscriber {
  const factory Subscriber({
    required String id,
    required String userId,
    required String planId,
    required DateTime startDate,
    DateTime? endDate,
    required String status, // 'active', 'canceled', 'expired'
  }) = _Subscriber;

  factory Subscriber.fromJson(Map<String, dynamic> json) =>
      _$SubscriberFromJson(json);
}
