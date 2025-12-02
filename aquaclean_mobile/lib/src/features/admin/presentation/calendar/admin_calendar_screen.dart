import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/models/booking.dart';
import '../../../booking/data/booking_repository.dart';

class AdminCalendarScreen extends ConsumerStatefulWidget {
  const AdminCalendarScreen({super.key});

  @override
  ConsumerState<AdminCalendarScreen> createState() =>
      _AdminCalendarScreenState();
}

class _AdminCalendarScreenState extends ConsumerState<AdminCalendarScreen> {
  CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
  }

  List<Booking> _getBookingsForDay(List<Booking> bookings, DateTime day) {
    return bookings.where((booking) {
      return isSameDay(booking.scheduledTime, day);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(allBookingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Calendário de Agendamentos')),
      body: bookingsAsync.when(
        data: (bookings) {
          final selectedBookings = _getBookingsForDay(bookings, _selectedDay!);

          return Column(
            children: [
              TableCalendar<Booking>(
                firstDay: DateTime.utc(2024, 1, 1),
                lastDay: DateTime.utc(2025, 12, 31),
                focusedDay: _focusedDay,
                calendarFormat: _calendarFormat,
                selectedDayPredicate: (day) {
                  return isSameDay(_selectedDay, day);
                },
                onDaySelected: (selectedDay, focusedDay) {
                  if (!isSameDay(_selectedDay, selectedDay)) {
                    setState(() {
                      _selectedDay = selectedDay;
                      _focusedDay = focusedDay;
                    });
                  }
                },
                onFormatChanged: (format) {
                  if (_calendarFormat != format) {
                    setState(() {
                      _calendarFormat = format;
                    });
                  }
                },
                onPageChanged: (focusedDay) {
                  _focusedDay = focusedDay;
                },
                eventLoader: (day) {
                  return _getBookingsForDay(bookings, day);
                },
                calendarStyle: CalendarStyle(
                  markerDecoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    shape: BoxShape.circle,
                  ),
                  todayDecoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).primaryColor.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              const SizedBox(height: 8.0),
              Expanded(
                child: Container(
                  color: Colors.grey[50],
                  child: selectedBookings.isEmpty
                      ? const Center(
                          child: Text('Nenhum agendamento para este dia'),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: selectedBookings.length,
                          itemBuilder: (context, index) {
                            final booking = selectedBookings[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                onTap: () {
                                  // Navigate to detail or show dialog
                                  // For now, just show a snackbar or print
                                  // context.push('/admin/booking/${booking.id}');
                                },
                                leading: CircleAvatar(
                                  backgroundColor: _getStatusColor(
                                    booking.status,
                                  ).withValues(alpha: 0.1),
                                  child: Icon(
                                    _getStatusIcon(booking.status),
                                    color: _getStatusColor(booking.status),
                                  ),
                                ),
                                title: Text(
                                  DateFormat(
                                    'HH:mm',
                                  ).format(booking.scheduledTime),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      booking.vehicleId,
                                    ), // Ideally vehicle name
                                    Text(
                                      'R\$ ${booking.totalPrice.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        color: Theme.of(context).primaryColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                trailing: Chip(
                                  label: Text(
                                    _getStatusLabel(booking.status),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Colors.white,
                                    ),
                                  ),
                                  backgroundColor: _getStatusColor(
                                    booking.status,
                                  ),
                                  padding: EdgeInsets.zero,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Color _getStatusColor(BookingStatus status) {
    switch (status) {
      case BookingStatus.pending:
        return Colors.orange;
      case BookingStatus.confirmed:
        return Colors.blue;
      case BookingStatus.washing:
        return Colors.blue[700]!;
      case BookingStatus.drying:
        return Colors.cyan;
      case BookingStatus.finished:
        return Colors.green;
      case BookingStatus.cancelled:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(BookingStatus status) {
    switch (status) {
      case BookingStatus.pending:
        return Icons.schedule;
      case BookingStatus.confirmed:
        return Icons.check_circle_outline;
      case BookingStatus.washing:
        return Icons.local_car_wash;
      case BookingStatus.drying:
        return Icons.air;
      case BookingStatus.finished:
        return Icons.check_circle;
      case BookingStatus.cancelled:
        return Icons.cancel;
    }
  }

  String _getStatusLabel(BookingStatus status) {
    switch (status) {
      case BookingStatus.pending:
        return 'Aguardando';
      case BookingStatus.confirmed:
        return 'Confirmado';
      case BookingStatus.washing:
        return 'Lavando';
      case BookingStatus.drying:
        return 'Secando';
      case BookingStatus.finished:
        return 'Finalizado';
      case BookingStatus.cancelled:
        return 'Cancelado';
    }
  }
}
