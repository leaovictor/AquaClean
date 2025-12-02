import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/sign_in_screen.dart';
import '../features/auth/presentation/sign_up_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/booking/presentation/booking_screen.dart';
import '../features/booking/presentation/booking_detail_screen.dart';
import '../features/booking/presentation/my_bookings_screen.dart';
import '../features/admin/presentation/admin_dashboard_screen.dart';
import '../features/booking/presentation/vehicle/add_vehicle_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/admin/presentation/appointments/admin_appointments_screen.dart';
import '../features/admin/presentation/shell/admin_shell.dart';
import '../features/admin/presentation/plans/plans_screen.dart';
import '../features/admin/presentation/subscribers/subscribers_screen.dart';
import '../features/admin/presentation/calendar/admin_calendar_screen.dart';
import '../features/subscription/presentation/customer_plans_screen.dart';
import '../features/staff/presentation/staff_dashboard_screen.dart';
import '../features/staff/presentation/qr_scan_screen.dart';
import '../features/dashboard/presentation/shell/client_shell.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);
  final userProfileAsync = ref.watch(currentUserProfileProvider);

  return GoRouter(
    initialLocation: '/login',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isLoggingIn = state.uri.path == '/login';
      final isSigningUp = state.uri.path == '/signup';

      // Wait for profile to load if logged in
      if (isLoggedIn && userProfileAsync.isLoading) {
        return null;
      }

      if (!isLoggedIn) {
        if (isLoggingIn || isSigningUp) return null;
        return '/login';
      }

      // Logged in logic
      final user = userProfileAsync.value;
      final isAdmin = user?.role == 'admin';
      final isStaff = user?.role == 'staff';

      if (isLoggingIn || isSigningUp) {
        if (isAdmin) return '/admin';
        if (isStaff) return '/staff';
        return '/dashboard';
      }

      // Role-based protection
      final isAdminRoute = state.uri.path.startsWith('/admin');
      final isStaffRoute = state.uri.path.startsWith('/staff');

      if (isStaff) {
        if (!isStaffRoute && !state.uri.path.startsWith('/booking')) {
          return '/staff';
        }
      } else if (isAdmin) {
        if (state.uri.path == '/dashboard') return '/admin';
      } else {
        // Client
        if (isAdminRoute || isStaffRoute) return '/dashboard';
      }

      return null;
    },
    refreshListenable: GoRouterRefreshStream(
      ref.read(authRepositoryProvider).authStateChanges(),
    ),
    routes: [
      // ... existing routes
      GoRoute(
        path: '/staff',
        builder: (context, state) => const StaffDashboardScreen(),
        routes: [
          GoRoute(
            path: 'scan',
            builder: (context, state) => const QRScanScreen(),
          ),
        ],
      ),
      // ... existing routes
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) =>
            _buildPageWithTransition(context, state, const SignInScreen()),
      ),
      GoRoute(
        path: '/signup',
        pageBuilder: (context, state) =>
            _buildPageWithTransition(context, state, const SignUpScreen()),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return ClientShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => _buildPageWithTransition(
              context,
              state,
              const DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/booking',
            pageBuilder: (context, state) =>
                _buildPageWithTransition(context, state, const BookingScreen()),
          ),
          GoRoute(
            path: '/booking/:id',
            builder: (context, state) {
              final bookingId = state.pathParameters['id']!;
              return BookingDetailScreen(bookingId: bookingId);
            },
          ),
          GoRoute(
            path: '/my-bookings',
            pageBuilder: (context, state) => _buildPageWithTransition(
              context,
              state,
              const MyBookingsScreen(),
            ),
          ),
          GoRoute(
            path: '/add-vehicle',
            builder: (context, state) => const AddVehicleScreen(),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                _buildPageWithTransition(context, state, const ProfileScreen()),
          ),
          GoRoute(
            path: '/plans',
            builder: (context, state) => const CustomerPlansScreen(),
          ),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) {
          return AdminShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminDashboardScreen(),
          ),
          GoRoute(
            path: '/admin/appointments',
            builder: (context, state) => const AdminAppointmentsScreen(),
          ),
          GoRoute(
            path: '/admin/plans',
            builder: (context, state) => const PlansScreen(),
          ),
          GoRoute(
            path: '/admin/subscribers',
            builder: (context, state) => const SubscribersScreen(),
          ),
          GoRoute(
            path: '/admin/calendar',
            builder: (context, state) => const AdminCalendarScreen(),
          ),
        ],
      ),
    ],
  );
});

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
      (dynamic _) => notifyListeners(),
    );
  }

  late final dynamic _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

Page<dynamic> _buildPageWithTransition(
  BuildContext context,
  GoRouterState state,
  Widget child,
) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurveTween(curve: Curves.easeInOut).animate(animation),
        child: child,
      );
    },
  );
}
