import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../data/admin_repository.dart';

class SubscribersScreen extends ConsumerWidget {
  const SubscribersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscribersAsync = ref.watch(subscribersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Assinantes')),
      body: subscribersAsync.when(
        data: (subscribers) {
          if (subscribers.isEmpty) {
            return const Center(child: Text('Nenhum assinante encontrado.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: subscribers.length,
            itemBuilder: (context, index) {
              final subscriber = subscribers[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.green,
                    child: Icon(Icons.check, color: Colors.white),
                  ),
                  title: Text(
                    'Usuário: ${subscriber.userId.substring(0, 8)}...',
                  ),
                  subtitle: Text(
                    'Plano: ${subscriber.planId}\nDesde: ${DateFormat('dd/MM/yyyy').format(subscriber.startDate)}',
                  ),
                  isThreeLine: true,
                  trailing: Chip(
                    label: Text(subscriber.status.toUpperCase()),
                    backgroundColor: subscriber.status == 'active'
                        ? Colors.green[100]
                        : Colors.grey[200],
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
}
