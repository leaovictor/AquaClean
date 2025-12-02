import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../shared/models/booking.dart';
import '../../data/admin_repository.dart';

class AdminAppointmentsScreen extends ConsumerStatefulWidget {
  const AdminAppointmentsScreen({super.key});

  @override
  ConsumerState<AdminAppointmentsScreen> createState() =>
      _AdminAppointmentsScreenState();
}

class _AdminAppointmentsScreenState
    extends ConsumerState<AdminAppointmentsScreen> {
  String _searchQuery = '';
  String _statusFilter =
      'all'; // all, pending, confirmed, washing, drying, finished, cancelled

  @override
  Widget build(BuildContext context) {
    final appointmentsAsync = ref.watch(adminBookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gerenciar Agendamentos'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar por cliente, placa...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildFilterChip('Todos', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Pendentes', 'pending'),
                const SizedBox(width: 8),
                _buildFilterChip('Confirmados', 'confirmed'),
                const SizedBox(width: 8),
                _buildFilterChip('Lavando', 'washing'),
                const SizedBox(width: 8),
                _buildFilterChip('Secando', 'drying'),
                const SizedBox(width: 8),
                _buildFilterChip('Finalizados', 'finished'),
                const SizedBox(width: 8),
                _buildFilterChip('Cancelados', 'cancelled'),
              ],
            ),
          ),
          // List
          Expanded(
            child: appointmentsAsync.when(
              data: (appointments) {
                final filtered = appointments.where((a) {
                  final matchesSearch =
                      a.userId.toLowerCase().contains(
                        _searchQuery.toLowerCase(),
                      ) ||
                      a.vehicleId.toLowerCase().contains(
                        _searchQuery.toLowerCase(),
                      );
                  final matchesStatus =
                      _statusFilter == 'all' || a.status.name == _statusFilter;
                  return matchesSearch && matchesStatus;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Text('Nenhum agendamento encontrado.'),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final appointment = filtered[index];
                    return _buildAppointmentCard(context, appointment, ref);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Erro: $err')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _statusFilter = value);
      },
      backgroundColor: Colors.white,
      selectedColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
      labelStyle: TextStyle(
        color: isSelected ? Theme.of(context).primaryColor : Colors.black87,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildAppointmentCard(
    BuildContext context,
    Booking appointment,
    WidgetRef ref,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Slidable(
        key: ValueKey(appointment.id),
        startActionPane: ActionPane(
          motion: const ScrollMotion(),
          children: [
            if (appointment.status == BookingStatus.pending)
              SlidableAction(
                onPressed: (context) =>
                    _updateStatus(ref, appointment.id, BookingStatus.confirmed),
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                icon: Icons.check,
                label: 'Confirmar',
              ),
            if (appointment.status == BookingStatus.confirmed)
              SlidableAction(
                onPressed: (context) =>
                    _updateStatus(ref, appointment.id, BookingStatus.washing),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                icon: Icons.water_drop,
                label: 'Lavar',
              ),
            if (appointment.status == BookingStatus.washing)
              SlidableAction(
                onPressed: (context) =>
                    _updateStatus(ref, appointment.id, BookingStatus.drying),
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                icon: Icons.wb_sunny,
                label: 'Secar',
              ),
            if (appointment.status == BookingStatus.drying)
              SlidableAction(
                onPressed: (context) =>
                    _updateStatus(ref, appointment.id, BookingStatus.finished),
                backgroundColor: Colors.purple,
                foregroundColor: Colors.white,
                icon: Icons.done_all,
                label: 'Finalizar',
              ),
            SlidableAction(
              onPressed: (context) =>
                  _launchWhatsApp(appointment.userId), // Mock number
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              icon: Icons.message,
              label: 'WhatsApp',
            ),
          ],
        ),
        endActionPane: ActionPane(
          motion: const ScrollMotion(),
          children: [
            if (appointment.status != BookingStatus.cancelled &&
                appointment.status != BookingStatus.finished)
              SlidableAction(
                onPressed: (context) =>
                    _updateStatus(ref, appointment.id, BookingStatus.cancelled),
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                icon: Icons.cancel,
                label: 'Cancelar',
              ),
            SlidableAction(
              onPressed: (context) =>
                  _showDetailsDialog(context, appointment, ref),
              backgroundColor: Colors.grey,
              foregroundColor: Colors.white,
              icon: Icons.info,
              label: 'Detalhes',
            ),
          ],
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.all(16),
          leading: CircleAvatar(
            backgroundColor: _getStatusColor(
              appointment.status,
            ).withValues(alpha: 0.1),
            child: Icon(
              _getStatusIcon(appointment.status),
              color: _getStatusColor(appointment.status),
            ),
          ),
          title: Text(
            DateFormat('dd/MM/yyyy - HH:mm').format(appointment.scheduledTime),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                'Cliente: ${appointment.userId.substring(0, 6)}...',
              ), // Mock name
              Text(
                'Status: ${appointment.status.name.toUpperCase()}',
                style: TextStyle(
                  color: _getStatusColor(appointment.status),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          trailing: Text(
            'R\$ ${appointment.totalPrice.toStringAsFixed(2)}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          onTap: () => _showDetailsDialog(context, appointment, ref),
        ),
      ),
    );
  }

  void _showDetailsDialog(
    BuildContext context,
    Booking appointment,
    WidgetRef ref,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Detalhes do Agendamento'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow(Icons.person, 'Cliente', appointment.userId),
            _buildDetailRow(
              Icons.directions_car,
              'Veículo',
              appointment.vehicleId,
            ), // Would fetch details
            _buildDetailRow(
              Icons.cleaning_services,
              'Serviços',
              appointment.serviceIds.join(', '),
            ),
            _buildDetailRow(
              Icons.access_time,
              'Horário',
              DateFormat('dd/MM/yyyy HH:mm').format(appointment.scheduledTime),
            ),
            _buildDetailRow(
              Icons.attach_money,
              'Valor',
              'R\$ ${appointment.totalPrice.toStringAsFixed(2)}',
            ),
            const SizedBox(height: 16),
            const Text(
              'Ações Rápidas:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if (appointment.status == BookingStatus.pending)
                  IconButton(
                    icon: const Icon(Icons.check_circle, color: Colors.green),
                    onPressed: () {
                      _updateStatus(
                        ref,
                        appointment.id,
                        BookingStatus.confirmed,
                      );
                      Navigator.pop(context);
                    },
                    tooltip: 'Confirmar',
                  ),
                if (appointment.status == BookingStatus.confirmed)
                  IconButton(
                    icon: const Icon(Icons.water_drop, color: Colors.blue),
                    onPressed: () {
                      _updateStatus(ref, appointment.id, BookingStatus.washing);
                      Navigator.pop(context);
                    },
                    tooltip: 'Iniciar Lavagem',
                  ),
                if (appointment.status == BookingStatus.washing)
                  IconButton(
                    icon: const Icon(Icons.wb_sunny, color: Colors.orange),
                    onPressed: () {
                      _updateStatus(ref, appointment.id, BookingStatus.drying);
                      Navigator.pop(context);
                    },
                    tooltip: 'Iniciar Secagem',
                  ),
                if (appointment.status == BookingStatus.drying)
                  IconButton(
                    icon: const Icon(Icons.done_all, color: Colors.purple),
                    onPressed: () {
                      _updateStatus(
                        ref,
                        appointment.id,
                        BookingStatus.finished,
                      );
                      Navigator.pop(context);
                    },
                    tooltip: 'Finalizar',
                  ),
                if (appointment.status != BookingStatus.cancelled &&
                    appointment.status != BookingStatus.finished)
                  IconButton(
                    icon: const Icon(Icons.cancel, color: Colors.red),
                    onPressed: () {
                      _updateStatus(
                        ref,
                        appointment.id,
                        BookingStatus.cancelled,
                      );
                      Navigator.pop(context);
                    },
                    tooltip: 'Cancelar',
                  ),
                IconButton(
                  icon: const Icon(Icons.message, color: Color(0xFF25D366)),
                  onPressed: () {
                    _launchWhatsApp(appointment.userId);
                    Navigator.pop(context);
                  },
                  tooltip: 'WhatsApp',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  Future<void> _updateStatus(
    WidgetRef ref,
    String id,
    BookingStatus status,
  ) async {
    try {
      await ref.read(adminRepositoryProvider).updateBookingStatus(id, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status atualizado para ${status.name}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro ao atualizar: $e')));
      }
    }
  }

  Future<void> _launchWhatsApp(String userId) async {
    // Mock number for now, ideally fetch from user profile
    const phoneNumber = '5511999999999';
    final uri = Uri.parse(
      'https://wa.me/$phoneNumber?text=Olá, sobre seu agendamento na AquaClean...',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível abrir o WhatsApp')),
        );
      }
    }
  }

  Color _getStatusColor(BookingStatus status) {
    switch (status) {
      case BookingStatus.confirmed:
        return Colors.green;
      case BookingStatus.pending:
        return Colors.orange;
      case BookingStatus.washing:
        return Colors.blue;
      case BookingStatus.drying:
        return Colors.amber;
      case BookingStatus.finished:
        return Colors.purple;
      case BookingStatus.cancelled:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(BookingStatus status) {
    switch (status) {
      case BookingStatus.confirmed:
        return Icons.check_circle;
      case BookingStatus.pending:
        return Icons.access_time;
      case BookingStatus.washing:
        return Icons.water_drop;
      case BookingStatus.drying:
        return Icons.wb_sunny;
      case BookingStatus.finished:
        return Icons.done_all;
      case BookingStatus.cancelled:
        return Icons.cancel;
    }
  }
}
