// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subscription_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$subscriptionRepositoryHash() =>
    r'5231f87cd71123b2bc0fb30db5b1b1d3db6a11c6';

/// See also [subscriptionRepository].
@ProviderFor(subscriptionRepository)
final subscriptionRepositoryProvider =
    Provider<SubscriptionRepository>.internal(
      subscriptionRepository,
      name: r'subscriptionRepositoryProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$subscriptionRepositoryHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef SubscriptionRepositoryRef = ProviderRef<SubscriptionRepository>;
String _$activePlansHash() => r'1cffa1f356f4004cb2c38ccc2e6e111e6a287931';

/// See also [activePlans].
@ProviderFor(activePlans)
final activePlansProvider =
    AutoDisposeStreamProvider<List<SubscriptionPlan>>.internal(
      activePlans,
      name: r'activePlansProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$activePlansHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ActivePlansRef = AutoDisposeStreamProviderRef<List<SubscriptionPlan>>;
String _$userSubscriptionHash() => r'11d1ff6a468b4a72ae61745c2b7a390d6f0e34e9';

/// See also [userSubscription].
@ProviderFor(userSubscription)
final userSubscriptionProvider =
    AutoDisposeStreamProvider<Subscriber?>.internal(
      userSubscription,
      name: r'userSubscriptionProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$userSubscriptionHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef UserSubscriptionRef = AutoDisposeStreamProviderRef<Subscriber?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
