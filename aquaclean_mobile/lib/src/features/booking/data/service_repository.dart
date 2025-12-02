import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../shared/models/service_package.dart';
import '../../auth/data/auth_repository.dart';

part 'service_repository.g.dart';

class ServiceRepository {
  final FirebaseFirestore _firestore;

  ServiceRepository(this._firestore);

  Stream<List<ServicePackage>> getServices() {
    return _firestore.collection('services').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return ServicePackage.fromJson({...doc.data(), 'id': doc.id});
      }).toList();
    });
  }

  Future<ServicePackage?> getServiceById(String id) async {
    try {
      final doc = await _firestore.collection('services').doc(id).get();
      if (!doc.exists) return null;
      return ServicePackage.fromJson({...doc.data()!, 'id': id});
    } catch (e) {
      return null;
    }
  }

  Future<void> createService(ServicePackage service) async {
    final data = service.toJson();
    data.remove('id'); // Remove id from data, let Firestore generate it
    await _firestore.collection('services').add(data);
  }

  Future<void> updateService(ServicePackage service) async {
    final data = service.toJson();
    data.remove('id');
    await _firestore.collection('services').doc(service.id).update(data);
  }

  Future<void> deleteService(String id) async {
    await _firestore.collection('services').doc(id).delete();
  }
}

@Riverpod(keepAlive: true)
ServiceRepository serviceRepository(ServiceRepositoryRef ref) {
  return ServiceRepository(ref.watch(firebaseFirestoreProvider));
}

@riverpod
Stream<List<ServicePackage>> services(ServicesRef ref) {
  return ref.watch(serviceRepositoryProvider).getServices();
}

@riverpod
Future<ServicePackage?> serviceById(ServiceByIdRef ref, String id) {
  return ref.watch(serviceRepositoryProvider).getServiceById(id);
}
