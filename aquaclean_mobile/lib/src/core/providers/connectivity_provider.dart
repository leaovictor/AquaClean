import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityProvider = StreamProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().onConnectivityChanged;
});

final isConnectedProvider = Provider<bool>((ref) {
  final connectivityAsync = ref.watch(connectivityProvider);
  return connectivityAsync.when(
    data: (results) {
      return !results.contains(ConnectivityResult.none);
    },
    loading: () => true, // Assume connected while loading
    error: (_, __) => true, // Assume connected on error
  );
});
