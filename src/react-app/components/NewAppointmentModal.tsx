import { useState, useEffect } from 'react';
import { X, Search, Plus, Car, Calendar, Check, User, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { createAdminCustomer, fetchAdminVehicles, createAdminVehicle, fetchAvailableSlots, createAppointment } from '@/react-app/lib/admin-helpers';
import { supabase } from '@/lib/supabaseClient';

interface NewAppointmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const STEPS = [
    { id: 'customer', title: 'Cliente', icon: User },
    { id: 'vehicle', title: 'Veículo', icon: Car },
    { id: 'service', title: 'Serviço', icon: Check },
    { id: 'time', title: 'Horário', icon: Calendar },
    { id: 'review', title: 'Revisão', icon: CreditCard },
];

const SERVICE_TYPES = [
    { id: 'basic', name: 'Lavagem Simples', price: 40, duration: 40 },
    { id: 'premium', name: 'Lavagem Completa', price: 60, duration: 60 },
    { id: 'deluxe', name: 'Lavagem Deluxe', price: 100, duration: 90 },
];

const PRODUCTS = [
    { id: 'wax', name: 'Cera Protetora', price: 20 },
    { id: 'scent', name: 'Aromatizante', price: 10 },
    { id: 'shampoo', name: 'Shampoo Especial', price: 15 },
];

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Dinheiro' },
    { id: 'credit_card', name: 'Cartão de Crédito' },
    { id: 'debit_card', name: 'Cartão de Débito' },
    { id: 'pix', name: 'Pix' },
];

export default function NewAppointmentModal({ onClose, onSuccess }: NewAppointmentModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Data States
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');

    // Search/Form States
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        first_name: '', last_name: '', email: '', phone: '', password: 'tempPassword123!'
    });

    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
    const [newVehicleData, setNewVehicleData] = useState({
        make: '', model: '', year: '', plate: '', color: '', type: 'sedan'
    });

    const [availableSlots, setAvailableSlots] = useState<any[]>([]);

    // --- Step 1: Customer ---
    const handleSearchCustomer = async (query: string) => {
        setCustomerSearch(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        // Use existing admin-appointments search or a dedicated search endpoint
        // For now, we'll reuse fetchAllAppointments search logic but it returns appointments, not users directly.
        // Ideally we need a 'search-customers' endpoint. 
        // Workaround: We will use `admin-customers` GET which returns all customers (filtered in frontend for now as MVP)
        // In production, this should be a server-side search.

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            const { data } = await supabase.functions.invoke('admin-customers', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data) {
                const filtered = data.filter((c: any) =>
                    c.first_name?.toLowerCase().includes(query.toLowerCase()) ||
                    c.last_name?.toLowerCase().includes(query.toLowerCase()) ||
                    c.email?.toLowerCase().includes(query.toLowerCase()) ||
                    c.phone?.includes(query)
                );
                setSearchResults(filtered.slice(0, 5));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCustomer = async () => {
        setLoading(true);
        try {
            const res = await createAdminCustomer(newCustomerData);
            setSelectedCustomer({ ...newCustomerData, id: res.id });
            setIsCreatingCustomer(false);
            nextStep();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar cliente');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Vehicle ---
    useEffect(() => {
        if (currentStep === 1 && selectedCustomer) {
            loadVehicles();
        }
    }, [currentStep, selectedCustomer]);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const vehicles = await fetchAdminVehicles(selectedCustomer.id);
            setCustomerVehicles(vehicles || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVehicle = async () => {
        setLoading(true);
        try {
            const res = await createAdminVehicle({ ...newVehicleData, user_id: selectedCustomer.id });
            setSelectedVehicle(res);
            setIsCreatingVehicle(false);
            nextStep();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar veículo');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 4: Time ---
    useEffect(() => {
        if (selectedDate) {
            loadSlots(selectedDate);
        }
    }, [selectedDate]);

    const loadSlots = async (date: string) => {
        setLoading(true);
        try {
            const slots = await fetchAvailableSlots(date);
            setAvailableSlots(slots || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Final: Create Appointment ---
    const handleConfirm = async () => {
        if (!selectedCustomer || !selectedVehicle || !selectedService || !selectedTimeSlot || !selectedDate) return;

        setLoading(true);
        try {
            // Construct start_time and end_time
            // selectedTimeSlot.start_time is "HH:MM:SS"
            // selectedDate is "YYYY-MM-DD"
            const startDateTime = new Date(`${selectedDate}T${selectedTimeSlot.start_time}`);
            const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

            const productsTotal = selectedProducts.reduce((acc, p) => acc + p.price, 0);
            const totalPrice = selectedService.price + productsTotal;

            await createAppointment({
                p_user_id: selectedCustomer.id,
                p_vehicle_id: selectedVehicle.id,
                p_time_slot_id: selectedTimeSlot.id,
                p_service_type: selectedService.id,
                p_special_instructions: 'Agendamento presencial (Admin)',
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString(),
                p_products: selectedProducts,
                p_total_price: totalPrice,
                p_status: 'confirmed', // Auto-confirm for POS
                payment_method: paymentMethod,
                auto_confirm: true
            });

            alert('Agendamento criado com sucesso!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar agendamento: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(p => Math.min(STEPS.length - 1, p + 1));
    const prevStep = () => setCurrentStep(p => Math.max(0, p - 1));

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Customer
                return (
                    <div className="space-y-4">
                        {!isCreatingCustomer ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nome, email ou telefone..."
                                        className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={customerSearch}
                                        onChange={(e) => handleSearchCustomer(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {searchResults.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => { setSelectedCustomer(customer); nextStep(); }}
                                            className="p-4 border rounded-xl hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{customer.first_name} {customer.last_name}</p>
                                                <p className="text-sm text-gray-500">{customer.email}</p>
                                                <p className="text-sm text-gray-500">{customer.phone}</p>
                                            </div>
                                            <ChevronRight className="text-gray-400 w-5 h-5" />
                                        </div>
                                    ))}
                                    {customerSearch.length > 2 && searchResults.length === 0 && (
                                        <div className="text-center py-4 text-gray-500">Nenhum cliente encontrado</div>
                                    )}
                                </div>

                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => setIsCreatingCustomer(true)}
                                        className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Novo Cliente
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Nome" className="p-3 border rounded-xl" value={newCustomerData.first_name} onChange={e => setNewCustomerData({ ...newCustomerData, first_name: e.target.value })} />
                                    <input placeholder="Sobrenome" className="p-3 border rounded-xl" value={newCustomerData.last_name} onChange={e => setNewCustomerData({ ...newCustomerData, last_name: e.target.value })} />
                                </div>
                                <input placeholder="Email" className="w-full p-3 border rounded-xl" value={newCustomerData.email} onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })} />
                                <input placeholder="Telefone" className="w-full p-3 border rounded-xl" value={newCustomerData.phone} onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setIsCreatingCustomer(false)} className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button onClick={handleCreateCustomer} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                        {loading ? 'Criando...' : 'Criar Cliente'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 1: // Vehicle
                return (
                    <div className="space-y-4">
                        {!isCreatingVehicle ? (
                            <>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {customerVehicles.map(vehicle => (
                                        <div
                                            key={vehicle.id}
                                            onClick={() => { setSelectedVehicle(vehicle); nextStep(); }}
                                            className="p-4 border rounded-xl hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <Car className="w-6 h-6 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                                                    <p className="text-sm text-gray-500">{vehicle.plate}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-400 w-5 h-5" />
                                        </div>
                                    ))}
                                    {customerVehicles.length === 0 && !loading && (
                                        <div className="text-center py-4 text-gray-500">Este cliente não possui veículos cadastrados.</div>
                                    )}
                                </div>

                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => setIsCreatingVehicle(true)}
                                        className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 font-medium flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Novo Veículo
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Marca (ex: Toyota)" className="p-3 border rounded-xl" value={newVehicleData.make} onChange={e => setNewVehicleData({ ...newVehicleData, make: e.target.value })} />
                                    <input placeholder="Modelo (ex: Corolla)" className="p-3 border rounded-xl" value={newVehicleData.model} onChange={e => setNewVehicleData({ ...newVehicleData, model: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Ano" className="p-3 border rounded-xl" value={newVehicleData.year} onChange={e => setNewVehicleData({ ...newVehicleData, year: e.target.value })} />
                                    <input placeholder="Placa" className="p-3 border rounded-xl" value={newVehicleData.plate} onChange={e => setNewVehicleData({ ...newVehicleData, plate: e.target.value })} />
                                </div>
                                <input placeholder="Cor" className="w-full p-3 border rounded-xl" value={newVehicleData.color} onChange={e => setNewVehicleData({ ...newVehicleData, color: e.target.value })} />

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setIsCreatingVehicle(false)} className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button onClick={handleCreateVehicle} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                        {loading ? 'Criando...' : 'Criar Veículo'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 2: // Service
                return (
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Tipo de Lavagem</h4>
                        {SERVICE_TYPES.map(service => (
                            <div
                                key={service.id}
                                onClick={() => setSelectedService(service)}
                                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedService?.id === service.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-blue-300'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                        <p className="text-sm text-gray-500">{service.duration} min</p>
                                    </div>
                                    <span className="font-bold text-blue-600">R$ {service.price}</span>
                                </div>
                            </div>
                        ))}

                        <h4 className="font-medium text-gray-900 pt-4">Produtos Adicionais</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {PRODUCTS.map(product => {
                                const isSelected = selectedProducts.some(p => p.id === product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                                            } else {
                                                setSelectedProducts(prev => [...prev, product]);
                                            }
                                        }}
                                        className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:border-gray-300'}`}
                                    >
                                        <span className="text-gray-900">{product.name}</span>
                                        <span className="font-medium text-green-600">+ R$ {product.price}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={nextStep}
                                disabled={!selectedService}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                );

            case 3: // Time
                return (
                    <div className="space-y-4">
                        <input
                            type="date"
                            className="w-full p-3 border rounded-xl"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />

                        {selectedDate && (
                            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                {loading ? (
                                    <div className="col-span-3 text-center py-4 text-gray-500">Carregando horários...</div>
                                ) : availableSlots.length > 0 ? (
                                    availableSlots.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => { setSelectedTimeSlot(slot); nextStep(); }}
                                            className={`p-2 border rounded-lg text-sm font-medium transition-colors ${selectedTimeSlot?.id === slot.id ? 'bg-blue-600 text-white border-blue-600' : 'hover:border-blue-500 hover:text-blue-600'}`}
                                        >
                                            {slot.start_time.slice(0, 5)}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-4 text-gray-500">Nenhum horário disponível</div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 4: // Review
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cliente</span>
                                <span className="font-medium text-gray-900">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Veículo</span>
                                <span className="font-medium text-gray-900">{selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.plate})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Serviço</span>
                                <span className="font-medium text-gray-900">{selectedService?.name}</span>
                            </div>
                            {selectedProducts.length > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Adicionais</span>
                                    <span className="font-medium text-gray-900 text-right">
                                        {selectedProducts.map(p => p.name).join(', ')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Data e Hora</span>
                                <span className="font-medium text-gray-900">{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTimeSlot?.start_time.slice(0, 5)}</span>
                            </div>
                            <div className="pt-3 border-t flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-blue-600">
                                    R$ {selectedService?.price + selectedProducts.reduce((acc, p) => acc + p.price, 0)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full p-3 border rounded-xl bg-white"
                            >
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method.id} value={method.id}>{method.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processando...' : <><Check className="w-6 h-6" /> Confirmar Agendamento</>}
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400">O pagamento deve ser realizado presencialmente.</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Novo Agendamento</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                {/* Progress Steps */}
                <div className="px-4 py-3 flex justify-between items-center border-b">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === currentStep;
                        const isCompleted = idx < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.title}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {renderStepContent()}
                </div>

                {/* Footer Navigation */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                    <div className="p-4 border-t flex justify-between">
                        <button onClick={prevStep} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
