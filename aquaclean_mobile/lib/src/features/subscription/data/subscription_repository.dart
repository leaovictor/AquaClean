import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../shared/models/subscription_plan.dart';
import '../../../shared/models/subscriber.dart';
import '../../auth/data/auth_repository.dart';

part 'subscription_repository.g.dart';

class SubscriptionRepository {
  final FirebaseFirestore _firestore;

  SubscriptionRepository(this._firestore);

  Stream<List<SubscriptionPlan>> getActivePlans() {
    return _firestore
        .collection('plans')
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return SubscriptionPlan.fromJson({...doc.data(), 'id': doc.id});
          }).toList();
        });
  }

  Stream<Subscriber?> getUserSubscription(String userId) {
    return _firestore
        .collection('subscriptions')
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .snapshots()
        .map((snapshot) {
          if (snapshot.docs.isEmpty) return null;
          return Subscriber.fromJson({
            ...snapshot.docs.first.data(),
            'id': snapshot.docs.first.id,
          });
        });
  }

  Future<void> subscribeToPlan(String userId, SubscriptionPlan plan) async {
    // Mock Payment Processing
    await Future.delayed(const Duration(seconds: 2));

    // Create Subscription
    await _firestore.collection('subscriptions').add({
      'userId': userId,
      'planId': plan.id,
      'startDate': DateTime.now().toIso8601String(),
      'status': 'active',
    });
  }

  Future<void> cancelSubscription(String subscriptionId) async {
    await _firestore.collection('subscriptions').doc(subscriptionId).update({
      'status': 'canceled',
      'endDate': DateTime.now().toIso8601String(),
    });
  }
}

@Riverpod(keepAlive: true)
SubscriptionRepository subscriptionRepository(SubscriptionRepositoryRef ref) {
  return SubscriptionRepository(ref.watch(firebaseFirestoreProvider));
}

@riverpod
Stream<List<SubscriptionPlan>> activePlans(ActivePlansRef ref) {
  return ref.watch(subscriptionRepositoryProvider).getActivePlans();
}

@riverpod
Stream<Subscriber?> userSubscription(UserSubscriptionRef ref) {
  final user = ref.watch(authStateChangesProvider).value;
  if (user == null) return Stream.value(null);
  return ref.watch(subscriptionRepositoryProvider).getUserSubscription(user.uid);
}
