import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/models/vehicle.dart';
import '../../data/booking_repository.dart';
import '../../../auth/data/auth_repository.dart';

part 'add_vehicle_screen.g.dart';

@riverpod
class AddVehicleController extends _$AddVehicleController {
  @override
  FutureOr<void> build() async {
    // No initial state
  }

  Future<void> addVehicle({
    required String brand,
    required String model,
    required String plate,
    required String color,
    required String type,
  }) async {
    final user = ref.read(authStateChangesProvider).value;
    if (user == null) return;

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final vehicle = Vehicle(
        id: '', // Will be set by Firestore
        brand: brand,
        model: model,
        plate: plate,
        color: color,
        type: type,
      );

      await ref
          .read(bookingRepositoryProvider)
          .createVehicle(vehicle, user.uid);
    });
  }
}

class AddVehicleScreen extends ConsumerStatefulWidget {
  const AddVehicleScreen({super.key});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _plateController = TextEditingController();
  final _colorController = TextEditingController();
  String _selectedType = 'sedan';

  @override
  void dispose() {
    _brandController.dispose();
    _modelController.dispose();
    _plateController.dispose();
    _colorController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState!.validate()) {
      await ref
          .read(addVehicleControllerProvider.notifier)
          .addVehicle(
            brand: _brandController.text.trim(),
            model: _modelController.text.trim(),
            plate: _plateController.text.trim(),
            color: _colorController.text.trim(),
            type: _selectedType,
          );

      if (mounted && !ref.read(addVehicleControllerProvider).hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Veículo adicionado com sucesso!')),
        );
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(addVehicleControllerProvider);

    ref.listen<AsyncValue>(addVehicleControllerProvider, (_, state) {
      if (state.hasError) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro: ${state.error}')));
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Adicionar Veículo')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _brandController,
                decoration: const InputDecoration(
                  labelText: 'Marca',
                  hintText: 'Ex: Toyota, Honda',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Campo obrigatório' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _modelController,
                decoration: const InputDecoration(
                  labelText: 'Modelo',
                  hintText: 'Ex: Corolla, Civic',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Campo obrigatório' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _plateController,
                decoration: const InputDecoration(
                  labelText: 'Placa',
                  hintText: 'Ex: ABC-1234',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Campo obrigatório' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _colorController,
                decoration: const InputDecoration(
                  labelText: 'Cor',
                  hintText: 'Ex: Preto, Branco',
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Campo obrigatório' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: const [
                  DropdownMenuItem(value: 'sedan', child: Text('Sedan')),
                  DropdownMenuItem(value: 'suv', child: Text('SUV')),
                  DropdownMenuItem(value: 'hatch', child: Text('Hatch')),
                  DropdownMenuItem(value: 'pickup', child: Text('Picape')),
                  DropdownMenuItem(value: 'moto', child: Text('Moto')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedType = value;
                    });
                  }
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: state.isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                ),
                child: state.isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Salvar Veículo'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
