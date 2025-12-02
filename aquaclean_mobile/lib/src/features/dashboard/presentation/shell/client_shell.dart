import 'package:flutter/material.dart';
import 'package:flutter_zoom_drawer/flutter_zoom_drawer.dart';
import 'client_menu_screen.dart';

class ClientShell extends StatelessWidget {
  final Widget child;

  const ClientShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return ZoomDrawer(
      menuScreen: const ClientMenuScreen(),
      mainScreen: child,
      borderRadius: 24.0,
      showShadow: true,
      angle: -12.0,
      drawerShadowsBackgroundColor: Colors.grey,
      slideWidth: MediaQuery.of(context).size.width * 0.65,
      menuBackgroundColor: const Color(0xFF2563EB),
    );
  }
}
