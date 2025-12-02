import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../auth/data/auth_repository.dart';
import '../../booking/data/booking_repository.dart';
import '../../../shared/models/booking.dart';
import 'widgets/weather_widget.dart';
import 'widgets/car_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authRepositoryProvider).currentUser;
    final vehiclesAsync = user != null
        ? ref.watch(userVehiclesProvider(user.uid))
        : const AsyncValue.data([]);
    final bookingsAsync = user != null
        ? ref.watch(userBookingsProvider(user.uid))
        : const AsyncValue.data([]);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Slate 50
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, user?.displayName ?? 'Visitante'),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildActiveBookingCard(context, bookingsAsync),
                  const SizedBox(height: 24),
                  _buildSectionTitle(context, 'Meus Carros'),
                  const SizedBox(height: 16),
                  _buildCarCarousel(context, vehiclesAsync),
                  const SizedBox(height: 32),
                  _buildSectionTitle(context, 'Serviços Populares'),
                  const SizedBox(height: 16),
                  _buildServicesList(ref),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/booking'),
        label: const Text('Agendar Lavagem'),
        icon: const Icon(Icons.calendar_today),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ).animate().scale(delay: 500.ms, duration: 300.ms),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, String userName) {
    return SliverAppBar(
      expandedHeight: 200.0,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF2563EB),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2563EB), Color(0xFF0891B2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const WeatherWidget(),
                    const SizedBox(height: 16),
                    Text(
                      'Bom dia,',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 16,
                      ),
                    ).animate().fadeIn().slideX(),
                    Text(
                      userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideX(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
          onPressed: () {}, // TODO: Notifications
        ),
        IconButton(
          icon: const Icon(Icons.person_outline, color: Colors.white),
          onPressed: () => context.push('/profile'),
        ),
      ],
    );
  }

  Widget _buildActiveBookingCard(
    BuildContext context,
    AsyncValue bookingsAsync,
  ) {
    return bookingsAsync.when(
      data: (bookings) {
        // Filter for active bookings
        final activeBookings = bookings
            .where(
              (b) =>
                  b.status != BookingStatus.cancelled &&
                  b.status != BookingStatus.finished,
            )
            .toList();

        if (activeBookings.isEmpty) return const SizedBox.shrink();

        final booking = activeBookings.first; // Most recent active booking

        return Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF334155)], // Slate 800-700
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Lavagem em Andamento',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.circle, color: Colors.greenAccent, size: 8),
                        SizedBox(width: 6),
                        Text(
                          'AO VIVO',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.local_car_wash,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getStatusText(booking.status),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Toque para acompanhar',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => context.push('/booking/${booking.id}'),
                    icon: const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white,
                      size: 16,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn().slideY(begin: -0.2);
      },
      loading: () => const SizedBox.shrink(),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }

  String _getStatusText(BookingStatus status) {
    switch (status) {
      case BookingStatus.pending:
        return 'Aguardando Confirmação';
      case BookingStatus.confirmed:
        return 'Confirmado';
      case BookingStatus.washing:
        return 'Lavando seu Carro';
      case BookingStatus.drying:
        return 'Secando seu Carro';
      case BookingStatus.finished:
        return 'Pronto!';
      case BookingStatus.cancelled:
        return 'Cancelado';
    }
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.bold,
        color: const Color(0xFF1E293B),
      ),
    );
  }

  Widget _buildCarCarousel(BuildContext context, AsyncValue vehiclesAsync) {
    return SizedBox(
      height: 180,
      child: vehiclesAsync.when(
        data: (vehicles) {
          if (vehicles.isEmpty) {
            return _buildAddCarButton(context);
          }
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: vehicles.length + 1, // +1 for Add Button
            itemBuilder: (context, index) {
              if (index == vehicles.length) {
                return Padding(
                  padding: const EdgeInsets.only(right: 16.0),
                  child: _buildAddCarButton(context, isSmall: true),
                );
              }
              return CarCard(
                vehicle: vehicles[index],
                onTap: () {
                  // TODO: Show vehicle details or select for booking
                },
              ).animate().fadeIn(delay: (100 * index).ms).slideX();
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Widget _buildAddCarButton(BuildContext context, {bool isSmall = false}) {
    return GestureDetector(
      onTap: () => context.push('/add-vehicle'),
      child: Container(
        width: isSmall ? 80 : 280,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: Colors.grey.withValues(alpha: 0.3),
            width: 2,
            style: BorderStyle
                .solid, // Dashed border needs a package or custom painter, solid for now
          ), // Use DottedBorder package for dashed effect if requested
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_circle_outline,
              size: isSmall ? 32 : 48,
              color: const Color(0xFF2563EB),
            ),
            if (!isSmall) ...[
              const SizedBox(height: 16),
              const Text(
                'Adicionar Carro',
                style: TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildServicesList(WidgetRef ref) {
    final servicesAsync = ref.watch(servicesProvider);

    return servicesAsync.when(
      data: (services) {
        return Column(
          children: services.map((service) {
            return Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
              ),
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.local_car_wash,
                    color: Color(0xFF2563EB),
                  ),
                ),
                title: Text(
                  service.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                subtitle: Text(
                  service.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to booking with this service pre-selected
                },
              ),
            ).animate().fadeIn().slideY(begin: 0.2);
          }).toList(),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => const SizedBox(),
    );
  }
}
