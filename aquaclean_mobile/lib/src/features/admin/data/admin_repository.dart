import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../shared/models/booking.dart';
import '../../../shared/models/subscription_plan.dart';
import '../../../shared/models/subscriber.dart';
import '../../../shared/models/availability.dart';
import '../../auth/data/auth_repository.dart';

part 'admin_repository.g.dart';

class AdminRepository {
  final FirebaseFirestore _firestore;

  AdminRepository(this._firestore);

  // Plans
  Stream<List<SubscriptionPlan>> getPlans() {
    return _firestore.collection('plans').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return SubscriptionPlan.fromJson({...doc.data(), 'id': doc.id});
      }).toList();
    });
  }

  Future<void> addPlan(SubscriptionPlan plan) {
    final data = plan.toJson();
    data.remove('id'); // Remove id before adding
    return _firestore.collection('plans').add(data);
  }

  Future<void> updatePlan(SubscriptionPlan plan) {
    final data = plan.toJson();
    data.remove('id'); // Remove id before updating
    return _firestore.collection('plans').doc(plan.id).update(data);
  }

  Future<void> deletePlan(String planId) {
    return _firestore.collection('plans').doc(planId).delete();
  }

  // Subscribers
  Stream<List<Subscriber>> getSubscribers() {
    return _firestore.collection('subscriptions').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return Subscriber.fromJson({...doc.data(), 'id': doc.id});
      }).toList();
    });
  }

  // Availability
  Stream<Availability?> getAvailability(String date) {
    return _firestore.collection('availability').doc(date).snapshots().map((
      doc,
    ) {
      if (!doc.exists) return null;
      return Availability.fromJson({...doc.data()!, 'date': date});
    });
  }

  Future<void> saveAvailability(Availability availability) {
    return _firestore
        .collection('availability')
        .doc(availability.date)
        .set(availability.toJson());
  }

  // Bookings
  Stream<List<Booking>> getBookings() {
    return _firestore
        .collection('bookings')
        .orderBy('scheduledTime', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return Booking.fromJson({...doc.data(), 'id': doc.id});
          }).toList();
        });
  }

  Future<void> updateBookingStatus(String bookingId, BookingStatus status) {
    return _firestore.collection('bookings').doc(bookingId).update({
      'status': status.name,
    });
  }
}

@Riverpod(keepAlive: true)
AdminRepository adminRepository(AdminRepositoryRef ref) {
  return AdminRepository(ref.watch(firebaseFirestoreProvider));
}

@riverpod
Stream<List<SubscriptionPlan>> adminPlans(AdminPlansRef ref) {
  return ref.watch(adminRepositoryProvider).getPlans();
}

@riverpod
Stream<List<Subscriber>> subscribers(SubscribersRef ref) {
  return ref.watch(adminRepositoryProvider).getSubscribers();
}

@riverpod
Stream<List<Booking>> adminBookings(AdminBookingsRef ref) {
  return ref.watch(adminRepositoryProvider).getBookings();
}
