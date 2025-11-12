import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Vehicle, TimeSlot, Appointment } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";

// Usando a URL de produção para a Edge Function
const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

export default function Booking() {
  const { currentUser, session, loading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedService, setSelectedService] = useState<string>("basic");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // New state for confirmation popup

  useEffect(() => {
    // Redireciona se não houver usuário logado após o carregamento
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    // Só inicia a busca de dados se a sessão estiver válida
    if (currentUser && session) {
      fetchData();
    }
  }, [currentUser, session, loading, navigate]); // Adicionado 'session' como dependência

  const handleAuthError = (text: string) => {
    setMessage({ type: 'error', text: text });
    // Força o usuário a refazer o login em caso de falha de autenticação (401)
    setTimeout(() => navigate("/"), 2000); 
  }

  const fetchData = async () => {
    // Checagem de robustez: se a sessão ou o token sumirem
    if (!session || !session.access_token) {
        handleAuthError("Sessão inválida ou expirada. Faça login novamente.");
        return;
    }
    
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      // Fazendo as requisições GET para popular o formulário
      const [vehiclesRes, timeSlotsRes, appointmentsRes] = await Promise.all([
        fetch(`${functionsBaseUrl}/vehicles`, { headers }),
        fetch(`${functionsBaseUrl}/time-slots`, { headers }),
        fetch(`${functionsBaseUrl}/appointments`, { headers }),
      ]);

      // Função auxiliar para processar a resposta e capturar 401
      const processResponse = async (res: Response, item: string) => {
        if (res.status === 401) {
            handleAuthError(`Falha de autenticação ao carregar ${item}.`);
            return null;
        }
        if (res.ok) {
            return res.json();
        } else {
            const errorData = await res.json();
            console.error(`Error fetching ${item}:`, errorData);
            setMessage({ type: 'error', text: errorData.error || `Failed to load ${item}` });
            return null;
        }
      };

      const [vehiclesData, timeSlotsData, appointmentsData] = await Promise.all([
          processResponse(vehiclesRes, 'vehicles'),
          processResponse(timeSlotsRes, 'time slots'),
          processResponse(appointmentsRes, 'appointments'),
      ]);

      // Atualiza os estados se os dados foram carregados com sucesso (não nulos)
      if (vehiclesData) {
        setVehicles(vehiclesData);
        const defaultVehicle = vehiclesData.find((v: Vehicle) => v.is_default);
        if (defaultVehicle) {
          setSelectedVehicle(defaultVehicle.id);
        } else if (vehiclesData.length > 0) {
          setSelectedVehicle(vehiclesData[0].id);
        }
      }

      if (timeSlotsData) {
        const now = new Date();
        const filteredTimeSlots = timeSlotsData.filter((slot: TimeSlot) => {
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          return slotDateTime > now;
        });
        setTimeSlots(filteredTimeSlots);
      }

      if (appointmentsData) {
        setAppointments(appointmentsData);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: 'error', text: 'Falha ao conectar-se ao servidor.' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleInitiateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !session.access_token) { 
      handleAuthError('Sua sessão expirou. Faça login para agendar.');
      return;
    }

    if (!selectedVehicle || !selectedTimeSlot) {
      setMessage({ type: 'error', text: 'Selecione um veículo e um horário.' });
      return;
    }

    setShowConfirmation(true); // Open confirmation popup
  };

  const handleConfirmBooking = async () => {
    // Checagem de robustez
    if (!session || !session.access_token) { 
      handleAuthError('Sua sessão expirou. Faça login para agendar.');
      setShowConfirmation(false); // Close popup if session invalid
      return;
    }
    const token = session.access_token;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${functionsBaseUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          time_slot_id: selectedTimeSlot?.id, // Use optional chaining as it might be null
          appointment_date: selectedTimeSlot?.date,
          appointment_time: selectedTimeSlot?.time,
          service_type: selectedService,
          special_instructions: specialInstructions || undefined,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Agendamento concluído com sucesso!' });
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        if (response.status === 401) {
             handleAuthError(errorData.error || 'Autenticação falhou. Faça login novamente.');
             return;
        }
        setMessage({ type: 'error', text: errorData.error || 'Falha ao agendar.' });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setMessage({ type: 'error', text: 'Falha ao agendar: erro de conexão.' });
    } finally {
      setSubmitting(false);
      setShowConfirmation(false); // Close confirmation popup
      setTimeout(() => setMessage(null), 5000); // Clear message after 5 seconds
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="animate-pulse text-blue-600">
          <Car className="w-12 h-12" />
        </div>
      </div>
    );
  }

  // Lógica de Renderização Condicional (Sem Veículos, Já Agendado)
  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nenhum Veículo Encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              Você precisa adicionar um veículo antes de agendar um serviço.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Adicionar Veículo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveAppointment = appointments.some(apt => apt.status === 'scheduled');

  if (hasActiveAppointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Agendamento Ativo Encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              Você já tem um agendamento ativo. Você pode ter apenas um agendamento de lavagem por vez.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Ir para o Painel
            </button>
          </div>
        </div>
      </div>
    );
  }


  const serviceTypes = [
    {
      id: "basic",
      name: "Lavagem Básica",
      description: "Lavagem externa com enxágue e secagem",
      price: "$15",
      duration: "20 min"
    },
    {
      id: "premium",
      name: "Lavagem Premium",
      description: "Limpeza interna e externa com brilho nos pneus",
      price: "$25",
      duration: "35 min"
    },
    {
      id: "deluxe",
      name: "Detalhe Deluxe",
      description: "Detalhe completo com cera e limpeza interna profunda",
      price: "$45",
      duration: "60 min"
    }
  ];

  // Group time slots by date
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    if (!groups[slot.date]) {
      groups[slot.date] = [];
    }
    groups[slot.date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Navigation />
      
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-opacity duration-300 ${
          message.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
          'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendar uma Lavagem</h1>
          <p className="text-gray-600">Selecione seu veículo, serviço e horário preferido.</p>
        </div>

        <form onSubmit={handleInitiateBooking} className="space-y-8">
          {/* Vehicle Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selecione o Veículo</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedVehicle === vehicle.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className="text-sm text-gray-600">{vehicle.color}</p>
                      )}
                      {vehicle.is_default && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selecione o Serviço</h2>
            <div className="grid gap-4">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService(service.id)}
                  className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedService === service.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                      <p className="text-blue-600 font-medium text-sm mt-2">{service.duration}</p>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selecione Data e Hora</h2>
            
            {Object.keys(groupedTimeSlots).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Não há horários disponíveis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="font-medium text-gray-900 mb-3">
                      {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {slots.map((slot) => (
                        <button
                          key={`${slot.id}-${slot.time}`}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`p-3 border rounded-xl text-center transition-all duration-200 ${
                            selectedTimeSlot?.id === slot.id
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{slot.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instruções Especiais</h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Quaisquer solicitações especiais ou áreas que precisam de atenção extra..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <button
              type="submit"
              disabled={submitting || !selectedVehicle || !selectedTimeSlot}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {submitting ? "Agendando..." : "Agendar Serviço"}
            </button>
          </div>
        </form>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Confirmar Agendamento</h2>
            <p className="text-gray-700 mb-6 text-center">Por favor, revise os detalhes do seu agendamento:</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                <Car className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Veículo:</p>
                  <p className="text-gray-700">
                    {vehicles.find(v => v.id === selectedVehicle)?.year}{' '}
                    {vehicles.find(v => v.id === selectedVehicle)?.make}{' '}
                    {vehicles.find(v => v.id === selectedVehicle)?.model}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Serviço:</p>
                  <p className="text-gray-700">
                    {serviceTypes.find(s => s.id === selectedService)?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Data e Hora:</p>
                  <p className="text-gray-700">
                    {selectedTimeSlot?.date && new Date(selectedTimeSlot.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}{' '}
                    às {selectedTimeSlot?.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Confirmando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>