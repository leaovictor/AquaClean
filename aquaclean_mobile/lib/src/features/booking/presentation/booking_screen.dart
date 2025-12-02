import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../data/booking_repository.dart';
import 'booking_controller.dart';
import '../../auth/data/auth_repository.dart';
import '../../payment/data/payment_service.dart';
import '../../../shared/widgets/shimmer_loading.dart';

class BookingScreen extends ConsumerWidget {
  const BookingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Novo Agendamento',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (state.currentStep > 0) {
              controller.previousStep();
            } else {
              context.pop();
            }
          },
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color(0xFF2563EB), // blue-600
                Color(0xFF0891B2), // cyan-600
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Progress Indicator
          LinearProgressIndicator(
            value: (state.currentStep + 1) / 4,
            backgroundColor: Colors.grey[200],
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
          ),
          Expanded(
            child: IndexedStack(
              index: state.currentStep,
              children: [
                _ServiceSelectionStep(),
                _VehicleSelectionStep(),
                _DateTimeSelectionStep(),
                _ReviewStep(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceSelectionStep extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(servicesProvider);
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);

    return Column(
      children: [
        Expanded(
          child: servicesAsync.when(
            data: (services) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: services.length,
              itemBuilder: (context, index) {
                final service = services[index];
                final isSelected = state.selectedServices.contains(service);
                return Card(
                  elevation: isSelected ? 4 : 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: isSelected
                          ? const Color(0xFF2563EB)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: CheckboxListTile(
                    contentPadding: const EdgeInsets.all(16),
                    value: isSelected,
                    onChanged: (value) {
                      controller.toggleService(service);
                    },
                    title: Text(
                      service.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(service.description),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.timer,
                                size: 16,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Text('${service.durationMinutes} min'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    secondary: Text(
                      'R\$ ${service.price.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                        fontSize: 18,
                      ),
                    ),
                    activeColor: const Color(0xFF2563EB),
                  ),
                );
              },
            ),
            loading: () => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 5,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: const ShimmerLoading.rectangular(height: 100),
              ),
            ),
            error: (err, stack) => Center(child: Text('Erro: $err')),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Estimado:', style: TextStyle(fontSize: 16)),
                  Text(
                    'R\$ ${state.totalPrice.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: state.selectedServices.isNotEmpty
                      ? () => controller.nextStep()
                      : null,
                  child: const Text('Continuar'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _VehicleSelectionStep extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authRepositoryProvider).currentUser;
    if (user == null) {
      return const Center(child: Text('Usuário não autenticado'));
    }

    final vehiclesAsync = ref.watch(userVehiclesProvider(user.uid));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Text(
            'Selecione seu Veículo',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
        ),
        Expanded(
          child: vehiclesAsync.when(
            data: (vehicles) {
              if (vehicles.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.directions_car_outlined,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Nenhum veículo cadastrado.',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          context.push('/add-vehicle');
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Adicionar Veículo'),
                      ),
                    ],
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: vehicles.length,
                itemBuilder: (context, index) {
                  final vehicle = vehicles[index];
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      leading: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.directions_car,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                      title: Text(
                        '${vehicle.brand} ${vehicle.model}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Text(vehicle.plate),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        ref
                            .read(bookingControllerProvider.notifier)
                            .selectVehicle(vehicle);
                      },
                    ),
                  );
                },
              );
            },
            loading: () => ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 3,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: const ShimmerLoading.rectangular(height: 80),
              ),
            ),
            error: (err, stack) => Center(child: Text('Erro: $err')),
          ),
        ),
      ],
    );
  }
}

class _DateTimeSelectionStep extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);

    // Mock time slots
    final timeSlots = [
      DateTime.now().add(const Duration(days: 1, hours: 9)),
      DateTime.now().add(const Duration(days: 1, hours: 10)),
      DateTime.now().add(const Duration(days: 1, hours: 11)),
      DateTime.now().add(const Duration(days: 1, hours: 14)),
      DateTime.now().add(const Duration(days: 1, hours: 15)),
    ];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Text(
            'Escolha um Horário',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: timeSlots.length,
            itemBuilder: (context, index) {
              final slot = timeSlots[index];
              final isSelected = state.selectedTimeSlot == slot;
              return Card(
                elevation: isSelected ? 4 : 1,
                color: isSelected
                    ? Colors.blue.withValues(alpha: 0.05)
                    : Colors.white,
                shape: RoundedRectangleBorder(
                  side: BorderSide(
                    color: isSelected
                        ? const Color(0xFF2563EB)
                        : Colors.transparent,
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Icon(
                    Icons.access_time,
                    color: isSelected ? const Color(0xFF2563EB) : Colors.grey,
                  ),
                  title: Text(
                    DateFormat('dd/MM/yyyy - HH:mm').format(slot),
                    style: TextStyle(
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                      color: isSelected
                          ? const Color(0xFF2563EB)
                          : Colors.black87,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: Color(0xFF2563EB))
                      : null,
                  onTap: () {
                    controller.selectTimeSlot(slot);
                  },
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: state.selectedTimeSlot != null
                  ? () => controller.nextStep()
                  : null,
              child: const Text('Continuar'),
            ),
          ),
        ),
      ],
    );
  }
}

class _ReviewStep extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(bookingControllerProvider);
    final controller = ref.read(bookingControllerProvider.notifier);

    if (state.isLoading) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const ShimmerLoading.rectangular(height: 300),
            const SizedBox(height: 24),
            const ShimmerLoading.rectangular(height: 60),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Revisar Agendamento',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 32),
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  ...state.selectedServices.map(
                    (service) => _buildSummaryRow('Serviço', service.title),
                  ),
                  const Divider(height: 32),
                  _buildSummaryRow(
                    'Veículo',
                    '${state.selectedVehicle?.brand} ${state.selectedVehicle?.model}',
                  ),
                  _buildSummaryRow('Placa', state.selectedVehicle?.plate ?? ''),
                  const Divider(height: 32),
                  _buildSummaryRow(
                    'Data',
                    state.selectedTimeSlot != null
                        ? DateFormat(
                            'dd/MM/yyyy',
                          ).format(state.selectedTimeSlot!)
                        : '',
                  ),
                  _buildSummaryRow(
                    'Horário',
                    state.selectedTimeSlot != null
                        ? DateFormat('HH:mm').format(state.selectedTimeSlot!)
                        : '',
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total', style: Theme.of(context).textTheme.titleLarge),
              Text(
                'R\$ ${state.totalPrice.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: const Color(0xFF2563EB),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                // 1. Process Payment
                final paymentService = ref.read(paymentServiceProvider);
                final success = await paymentService.processPayment(
                  state.totalPrice,
                );

                if (!success) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Pagamento falhou. Tente novamente.'),
                      ),
                    );
                  }
                  return;
                }

                // 2. Create Booking
                await controller.confirmBooking();
                if (context.mounted && state.error == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Pagamento confirmado! Agendamento realizado.',
                      ),
                    ),
                  );
                  context.go('/dashboard');
                } else if (context.mounted && state.error != null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erro ao agendar: ${state.error}')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB), // Blue for payment
                padding: const EdgeInsets.symmetric(vertical: 20),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.credit_card, color: Colors.white),
                  SizedBox(width: 12),
                  Text('Pagar e Agendar', style: TextStyle(fontSize: 18)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 16)),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
