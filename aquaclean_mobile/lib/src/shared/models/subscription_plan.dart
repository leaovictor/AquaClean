import 'package:freezed_annotation/freezed_annotation.dart';

part 'subscription_plan.freezed.dart';
part 'subscription_plan.g.dart';

@freezed
abstract class SubscriptionPlan with _$SubscriptionPlan {
  const factory SubscriptionPlan({
    required String id,
    required String name,
    required double price,
    required List<String> features,
    @Default(true) bool isActive,
  }) = _SubscriptionPlan;

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) =>
      _$SubscriptionPlanFromJson(json);
}
