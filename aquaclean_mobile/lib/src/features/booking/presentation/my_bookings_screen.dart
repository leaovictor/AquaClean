import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/models/booking.dart';
import '../../auth/data/auth_repository.dart';
import '../../booking/data/booking_repository.dart';

class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authRepositoryProvider).currentUser;
    final bookingsAsync = user != null
        ? ref.watch(userBookingsProvider(user.uid))
        : const AsyncValue.data(<Booking>[]);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus Agendamentos'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Ativos'),
            Tab(text: 'Histórico'),
          ],
        ),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          final activeBookings = bookings
              .where(
                (b) =>
                    b.status != BookingStatus.cancelled &&
                    b.status != BookingStatus.finished,
              )
              .toList();

          final historyBookings = bookings
              .where(
                (b) =>
                    b.status == BookingStatus.cancelled ||
                    b.status == BookingStatus.finished,
              )
              .toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildBookingList(context, activeBookings, isActive: true),
              _buildBookingList(context, historyBookings, isActive: false),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Widget _buildBookingList(
    BuildContext context,
    List<Booking> bookings, {
    required bool isActive,
  }) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? Icons.calendar_today : Icons.history,
              size: 64,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            Text(
              isActive
                  ? 'Nenhum agendamento ativo'
                  : 'Nenhum histórico encontrado',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final booking = bookings[index];
        // Join service IDs or names if available. For now, showing count or first ID.
        final servicesText = booking.serviceIds.isNotEmpty
            ? booking.serviceIds.join(', ')
            : 'Serviço Personalizado';

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: InkWell(
            onTap: () {
              context.push('/booking/${booking.id}');
            },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        DateFormat(
                          "d 'de' MMM, HH:mm",
                          'pt_BR',
                        ).format(booking.scheduledTime),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      _buildStatusChip(context, booking.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${booking.vehicleId} • $servicesText',
                    style: TextStyle(color: Colors.grey[600]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'R\$ ${booking.totalPrice.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(BuildContext context, BookingStatus status) {
    Color color;
    String label;

    switch (status) {
      case BookingStatus.pending:
        color = Colors.orange;
        label = 'Aguardando';
        break;
      case BookingStatus.confirmed:
        color = Colors.blue;
        label = 'Confirmado';
        break;
      case BookingStatus.washing:
        color = Colors.blue[700]!;
        label = 'Lavando';
        break;
      case BookingStatus.drying:
        color = Colors.cyan;
        label = 'Secando';
        break;
      case BookingStatus.finished:
        color = Colors.green;
        label = 'Finalizado';
        break;
      case BookingStatus.cancelled:
        color = Colors.red;
        label = 'Cancelado';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
