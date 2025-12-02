import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/models/booking.dart';
import '../../booking/data/booking_repository.dart';

class StaffDashboardScreen extends ConsumerWidget {
  const StaffDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(allBookingsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Staff Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.qr_code_scanner),
              onPressed: () async {
                final String? result = await context.push<String>(
                  '/staff/scan',
                );
                if (result != null && context.mounted) {
                  context.push('/booking/$result');
                }
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                // Sign out logic
              },
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Fila'),
              Tab(text: 'Em Andamento'),
              Tab(text: 'Prontos'),
            ],
          ),
        ),
        body: bookingsAsync.when(
          data: (bookings) {
            final queue = bookings
                .where(
                  (b) =>
                      b.status == BookingStatus.pending ||
                      b.status == BookingStatus.confirmed,
                )
                .toList();

            final inProgress = bookings
                .where(
                  (b) =>
                      b.status == BookingStatus.washing ||
                      b.status == BookingStatus.drying,
                )
                .toList();

            final ready = bookings
                .where((b) => b.status == BookingStatus.finished)
                .toList();

            return TabBarView(
              children: [
                _buildBookingList(context, ref, queue),
                _buildBookingList(context, ref, inProgress),
                _buildBookingList(context, ref, ready),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Erro: $err')),
        ),
      ),
    );
  }

  Widget _buildBookingList(
    BuildContext context,
    WidgetRef ref,
    List<Booking> bookings,
  ) {
    if (bookings.isEmpty) {
      return const Center(child: Text('Nenhum agendamento nesta etapa.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(
              '${booking.vehicleId} - ${DateFormat('HH:mm').format(booking.scheduledTime)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text('Status: ${booking.status.name}'),
            trailing: const Icon(Icons.more_vert),
            onTap: () => _showStatusModal(context, ref, booking),
          ),
        );
      },
    );
  }

  void _showStatusModal(BuildContext context, WidgetRef ref, Booking booking) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Atualizar Status',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: BookingStatus.values.map((status) {
                  return ActionChip(
                    label: Text(status.name.toUpperCase()),
                    backgroundColor: booking.status == status
                        ? Theme.of(context).primaryColor.withValues(alpha: 0.2)
                        : null,
                    onPressed: () {
                      // Update status logic
                      // ref.read(bookingControllerProvider.notifier).updateStatus(booking.id, status);
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}
