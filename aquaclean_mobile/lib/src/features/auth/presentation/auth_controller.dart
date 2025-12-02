import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../notifications/data/notification_service.dart';
import '../data/auth_repository.dart';

part 'auth_controller.g.dart';

@riverpod
class AuthController extends _$AuthController {
  @override
  FutureOr<void> build() {
    // No initial state to load
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      await ref
          .read(authRepositoryProvider)
          .signInWithEmailAndPassword(email, password);
      // Save FCM Token
      await ref.read(notificationServiceProvider).saveCurrentToken();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signUp(String email, String password, String displayName) async {
    state = const AsyncValue.loading();
    try {
      await ref
          .read(authRepositoryProvider)
          .createUserWithEmailAndPassword(
            email,
            password,
            displayName: displayName,
          );
      // Save FCM Token
      await ref.read(notificationServiceProvider).saveCurrentToken();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).signOut(),
    );
  }
}
