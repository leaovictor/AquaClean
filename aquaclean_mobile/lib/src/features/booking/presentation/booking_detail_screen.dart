import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../shared/models/booking.dart';
import '../../booking/data/booking_repository.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingStreamProvider(bookingId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Acompanhar Pedido'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      body: bookingAsync.when(
        data: (booking) => _buildContent(context, booking),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Booking booking) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Info
          Center(
            child: Column(
              children: [
                Text(
                  'Agendamento #${booking.id.substring(0, 6).toUpperCase()}',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  DateFormat(
                    "d 'de' MMMM, HH:mm",
                    'pt_BR',
                  ).format(booking.scheduledTime),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),

          // Timeline Stepper
          _buildTimeline(context, booking.status),

          const SizedBox(height: 40),

          // Panic Button / Actions
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _launchWhatsApp(),
              icon: const Icon(Icons.chat_bubble_outline),
              label: const Text('Falar com o Lavador'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366), // WhatsApp Green
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 4,
              ),
            ),
          ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0),
        ],
      ),
    );
  }

  Widget _buildTimeline(BuildContext context, BookingStatus currentStatus) {
    final steps = [
      {
        'status': BookingStatus.pending,
        'label': 'Aguardando Confirmação',
        'icon': Icons.access_time,
      },
      {
        'status': BookingStatus.confirmed,
        'label': 'Confirmado',
        'icon': Icons.check_circle_outline,
      },
      {
        'status': BookingStatus.washing,
        'label': 'Lavando seu Carro',
        'icon': Icons.water_drop_outlined,
      },
      {
        'status': BookingStatus.drying,
        'label': 'Secagem e Acabamento',
        'icon': Icons.wb_sunny_outlined,
      },
      {
        'status': BookingStatus.finished,
        'label': 'Pronto para Retirada',
        'icon': Icons.done_all,
      },
    ];

    int currentIndex = steps.indexWhere((s) => s['status'] == currentStatus);
    if (currentIndex == -1 && currentStatus == BookingStatus.cancelled) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.red[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.red[200]!),
          ),
          child: const Column(
            children: [
              Icon(Icons.cancel, color: Colors.red, size: 48),
              SizedBox(height: 8),
              Text(
                'Agendamento Cancelado',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isCompleted = index <= currentIndex;
        final isCurrent = index == currentIndex;
        final isLast = index == steps.length - 1;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon & Line
            Column(
              children: [
                Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? Theme.of(context).primaryColor
                            : Colors.grey[200],
                        shape: BoxShape.circle,
                        boxShadow: isCurrent
                            ? [
                                BoxShadow(
                                  color: Theme.of(
                                    context,
                                  ).primaryColor.withValues(alpha: 0.4),
                                  blurRadius: 12,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: Icon(
                        step['icon'] as IconData,
                        color: isCompleted ? Colors.white : Colors.grey[400],
                        size: 20,
                      ),
                    )
                    .animate(target: isCurrent ? 1 : 0)
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.1, 1.1),
                    ),
                if (!isLast)
                  Container(
                        width: 2,
                        height: 40,
                        color: index < currentIndex
                            ? Theme.of(context).primaryColor
                            : Colors.grey[200],
                      )
                      .animate(target: index < currentIndex ? 1 : 0)
                      .tint(color: Theme.of(context).primaryColor),
              ],
            ),
            const SizedBox(width: 16),
            // Text
            Expanded(
              child: Container(
                height: 40, // Align with icon
                alignment: Alignment.centerLeft,
                child: Text(
                  step['label'] as String,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isCompleted
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: isCompleted ? Colors.black87 : Colors.grey[400],
                  ),
                ),
              ),
            ),
          ],
        ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.1, end: 0);
      }),
    );
  }

  Future<void> _launchWhatsApp() async {
    const phoneNumber = '5511999999999'; // Mock
    final uri = Uri.parse(
      'https://wa.me/$phoneNumber?text=Olá, preciso de ajuda com meu pedido.',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}
