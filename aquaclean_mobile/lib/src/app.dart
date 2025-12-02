import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:google_fonts/google_fonts.dart';
import 'routing/app_router.dart';

import 'features/auth/data/auth_repository.dart';
import 'features/notifications/data/notification_service.dart';
import 'core/providers/connectivity_provider.dart';
import 'core/widgets/no_connection_screen.dart';

class AquaCleanApp extends ConsumerWidget {
  const AquaCleanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(goRouterProvider);

    // Listen for notifications when user is logged in
    ref.listen(authRepositoryProvider, (previous, next) {
      final user = next.currentUser;
      if (user != null) {
        ref
            .read(notificationServiceProvider)
            .listenToUserNotifications(user.uid);
      }
    });

    return MaterialApp.router(
      title: 'AquaClean Pro',
      theme: FlexThemeData.light(
        scheme: FlexScheme.aquaBlue,
        surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
        blendLevel: 7,
        subThemesData: const FlexSubThemesData(
          blendOnLevel: 10,
          blendOnColors: false,
          useTextTheme: true,
          useM2StyleDividerInM3: true,
          alignedDropdown: true,
          useInputDecoratorThemeInDialogs: true,
        ),
        visualDensity: FlexColorScheme.comfortablePlatformDensity,
        useMaterial3: true,
        swapLegacyOnMaterial3: true,
        fontFamily: GoogleFonts.inter().fontFamily,
      ),
      darkTheme: FlexThemeData.dark(
        scheme: FlexScheme.aquaBlue,
        surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
        blendLevel: 13,
        subThemesData: const FlexSubThemesData(
          blendOnLevel: 20,
          useTextTheme: true,
          useM2StyleDividerInM3: true,
          alignedDropdown: true,
          useInputDecoratorThemeInDialogs: true,
        ),
        visualDensity: FlexColorScheme.comfortablePlatformDensity,
        useMaterial3: true,
        swapLegacyOnMaterial3: true,
        fontFamily: GoogleFonts.inter().fontFamily,
      ),
      themeMode: ThemeMode.system,
      routerConfig: goRouter,
      builder: (context, child) {
        return Consumer(
          builder: (context, ref, _) {
            final isConnected = ref.watch(isConnectedProvider);
            return Stack(
              children: [
                if (child != null) child,
                if (!isConnected)
                  const Positioned.fill(child: NoConnectionScreen()),
              ],
            );
          },
        );
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
