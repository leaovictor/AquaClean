import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/data/auth_repository.dart';

class AdminMenuScreen extends ConsumerWidget {
  const AdminMenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authRepositoryProvider).currentUser;

    return Scaffold(
      backgroundColor:
          Colors.transparent, // Transparent to show gradient from container
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF2563EB), // blue-600
              Color(0xFF0891B2), // cyan-600
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CircleAvatar(
                      radius: 32,
                      backgroundColor: Colors.white,
                      child: Icon(
                        Icons.admin_panel_settings,
                        color: Color(0xFF2563EB),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Administrador',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      user?.email ?? '',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white24),
              _buildMenuItem(context, 'Dashboard', Icons.dashboard, '/admin'),
              _buildMenuItem(
                context,
                'Agendamentos',
                Icons.calendar_today,
                '/admin/appointments',
              ),
              _buildMenuItem(
                context,
                'Planos',
                Icons.card_membership,
                '/admin/plans',
              ),
              _buildMenuItem(
                context,
                'Assinantes',
                Icons.group,
                '/admin/subscribers',
              ),
              _buildMenuItem(
                context,
                'Calendário',
                Icons.calendar_month,
                '/admin/calendar',
              ),
              const Spacer(),
              const Divider(color: Colors.white24),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.white),
                title: const Text(
                  'Sair',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  ref.read(authRepositoryProvider).signOut();
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    String title,
    IconData icon,
    String route,
  ) {
    // Simple check for active route could be added here if needed
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      onTap: () {
        context.go(route);
        // ZoomDrawer will handle closing automatically if configured,
        // or we might need to close it manually depending on implementation.
        // Usually navigating replaces the main screen content.
      },
    );
  }
}
