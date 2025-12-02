import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/admin_repository.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(adminPlansProvider);
    final subscribersAsync = ref.watch(subscribersProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Visão Geral',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 16),
          // Metrics Row
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  context,
                  title: 'Planos Ativos',
                  value: plansAsync.when(
                    data: (plans) => plans.length.toString(),
                    loading: () => '...',
                    error: (_, __) => '-',
                  ),
                  icon: Icons.card_membership,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMetricCard(
                  context,
                  title: 'Assinantes',
                  value: subscribersAsync.when(
                    data: (subs) => subs.length.toString(),
                    loading: () => '...',
                    error: (_, __) => '-',
                  ),
                  icon: Icons.people,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Acesso Rápido',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 16),
          _buildActionCard(
            context,
            title: 'Gerenciar Agendamentos',
            subtitle: 'Ver todos os agendamentos',
            icon: Icons.calendar_today,
            color: Colors.orange,
            onTap: () => context.push('/admin/appointments'),
          ),
          const SizedBox(height: 12),
          _buildActionCard(
            context,
            title: 'Gerenciar Planos',
            subtitle: 'Criar e editar planos de assinatura',
            icon: Icons.card_membership,
            color: Colors.blue,
            onTap: () => context.push('/admin/plans'),
          ),
          const SizedBox(height: 12),
          _buildActionCard(
            context,
            title: 'Ver Assinantes',
            subtitle: 'Listar usuários com assinatura ativa',
            icon: Icons.group,
            color: Colors.green,
            onTap: () => context.push('/admin/subscribers'),
          ),
          const SizedBox(height: 12),
          _buildActionCard(
            context,
            title: 'Configurar Calendário',
            subtitle: 'Definir dias e horários disponíveis',
            icon: Icons.calendar_month,
            color: Colors.purple,
            onTap: () => context.push('/admin/calendar'),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF111827),
              ),
            ),
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
