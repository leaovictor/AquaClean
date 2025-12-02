import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/models/subscription_plan.dart';
import '../../data/admin_repository.dart';

class PlansScreen extends ConsumerWidget {
  const PlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(adminPlansProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Gerenciar Planos')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showPlanDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: plansAsync.when(
        data: (plans) {
          if (plans.isEmpty) {
            return const Center(child: Text('Nenhum plano cadastrado.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            itemBuilder: (context, index) {
              final plan = plans[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(
                    plan.name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    'R\$ ${plan.price.toStringAsFixed(2)} - ${plan.features.length} recursos',
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () =>
                            _showPlanDialog(context, ref, plan: plan),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _confirmDelete(context, ref, plan.id),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  void _showPlanDialog(
    BuildContext context,
    WidgetRef ref, {
    SubscriptionPlan? plan,
  }) {
    final nameController = TextEditingController(text: plan?.name);
    final priceController = TextEditingController(text: plan?.price.toString());
    final featuresController = TextEditingController(
      text: plan?.features.join(', '),
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(plan == null ? 'Novo Plano' : 'Editar Plano'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Nome do Plano'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: priceController,
              decoration: const InputDecoration(labelText: 'Preço (R\$)'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: featuresController,
              decoration: const InputDecoration(
                labelText: 'Recursos (separados por vírgula)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final newPlan = SubscriptionPlan(
                id: plan?.id ?? '',
                name: nameController.text,
                price: double.tryParse(priceController.text) ?? 0.0,
                features: featuresController.text
                    .split(',')
                    .map((e) => e.trim())
                    .toList(),
              );

              if (plan == null) {
                ref.read(adminRepositoryProvider).addPlan(newPlan);
              } else {
                ref.read(adminRepositoryProvider).updatePlan(newPlan);
              }
              Navigator.pop(context);
            },
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, String planId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excluir Plano'),
        content: const Text('Tem certeza que deseja excluir este plano?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              ref.read(adminRepositoryProvider).deletePlan(planId);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}
