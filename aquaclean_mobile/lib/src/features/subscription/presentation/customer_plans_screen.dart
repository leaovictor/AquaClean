import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/models/subscription_plan.dart';
import '../../auth/data/auth_repository.dart';
import '../data/subscription_repository.dart';

class CustomerPlansScreen extends ConsumerStatefulWidget {
  const CustomerPlansScreen({super.key});

  @override
  ConsumerState<CustomerPlansScreen> createState() =>
      _CustomerPlansScreenState();
}

class _CustomerPlansScreenState extends ConsumerState<CustomerPlansScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(activePlansProvider);
    final user = ref.watch(authRepositoryProvider).currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Planos de Assinatura')),
      body: plansAsync.when(
        data: (plans) {
          if (plans.isEmpty) {
            return const Center(
              child: Text('Nenhum plano disponível no momento.'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            itemBuilder: (context, index) {
              final plan = plans[index];
              return _buildPlanCard(context, plan, user?.uid);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context,
    SubscriptionPlan plan,
    String? userId,
  ) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.only(bottom: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              plan.name,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'R\$ ${plan.price.toStringAsFixed(2)} / mês',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...plan.features.map(
              (feature) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(feature)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading || userId == null
                    ? null
                    : () => _handleSubscribe(context, userId, plan),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('ASSINAR AGORA'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubscribe(
    BuildContext context,
    String userId,
    SubscriptionPlan plan,
  ) async {
    setState(() => _isLoading = true);
    try {
      await ref
          .read(subscriptionRepositoryProvider)
          .subscribeToPlan(userId, plan);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Assinatura do plano ${plan.name} realizada com sucesso!',
            ),
          ),
        );
        context.pop(); // Go back to profile or previous screen
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro ao assinar: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
