import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_zoom_drawer/flutter_zoom_drawer.dart';
import 'admin_menu_screen.dart';

class AdminShell extends ConsumerWidget {
  final Widget child;

  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // We can use a provider to control the drawer if needed,
    // but for simple navigation, the internal state is often enough.
    // However, to open the drawer from the AppBar, we need a controller.
    final drawerController = ZoomDrawerController();

    return ZoomDrawer(
      controller: drawerController,
      menuScreen: const AdminMenuScreen(),
      mainScreen: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Admin Console',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          leading: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () => drawerController.toggle?.call(),
          ),
          flexibleSpace: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF2563EB), // blue-600
                  Color(0xFF0891B2), // cyan-600
                ],
              ),
            ),
          ),
        ),
        body: child,
      ),
      borderRadius: 24.0,
      showShadow: true,
      angle: -12.0,
      drawerShadowsBackgroundColor: Colors.grey,
      slideWidth: MediaQuery.of(context).size.width * 0.65,
      menuBackgroundColor: const Color(0xFF2563EB), // Fallback color
    );
  }
}
