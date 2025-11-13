import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, Plus, ChevronRight, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import type { Appointment, Vehicle, UserProfile } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

// Função utilitária para formatação de data
const formatDate = (dateString: string) => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Função utilitária para formatação de hora
const formatTime = (timeString: string) => {
  // Assumes timeString is in "HH:MM" format
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function Dashboard() {
  const { currentUser, session, loading } = useAuth(); // Get session from context
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, loading, navigate]);

  const fetchDashboardData = async () => {
    if (!session) return; // Use session for check
    try {
      const token = session.access_token; // Get token from session
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      const [appointmentsRes, vehiclesRes, timeSlotsRes, userRes] = await Promise.all([
        fetch(`${functionsBaseUrl}/appointments`, { headers }),
        fetch(`${functionsBaseUrl}/vehicles`, { headers }),
        fetch(`${functionsBaseUrl}/time-slots`, { headers }),
        fetch(`${functionsBaseUrl}/users-me`, { headers })
      ]);

      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : [];
      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];
      const timeSlotsData = timeSlotsRes.ok ? await timeSlotsRes.json() : [];
      const userData = userRes.ok ? await userRes.json() : {};

      const enrichedAppointments = appointmentsData.map((apt: Appointment) => {
        const vehicle = vehiclesData.find((v: Vehicle) => v.id === apt.vehicle_id);
        const timeSlot = timeSlotsData.find((ts: any) => ts.id === apt.time_slot_id);
        return { ...apt, vehicle, timeSlot };
      });

      setAppointments(enrichedAppointments);
      setVehicles(vehiclesData);
      setProfile(userData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCancel = (appointment: Appointment) => {
    if (!session) return;
    setAppointmentToCancel(appointment);
    setShowCancelConfirmation(true);
  };

  const confirmCancellation = async () => {
    if (!session || !appointmentToCancel) return;

    setShowCancelConfirmation(false); // Close the popup immediately
    
    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/cancel-appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ appointment_id: appointmentToCancel.id }),
      });

      if (response.ok) {
        setToastMessage({ type: 'success', text: 'Agendamento cancelado com sucesso!' });
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        setToastMessage({ type: 'error', text: errorData.error || 'Falha ao cancelar agendamento.' });
        console.error("Error canceling appointment:", errorData.error);
      }
    } catch (error) {
      setToastMessage({ type: 'error', text: 'Erro ao cancelar agendamento: Problema de conexão.' });
      console.error("Error canceling appointment:", error);
    } finally {
      setAppointmentToCancel(null); // Clear the appointment to cancel
      setTimeout(() => setToastMessage(null), 5000);
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

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const recentAppointments = appointments.filter(apt => apt.status === 'completed' || apt.status === 'canceled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Navigation />
      
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-opacity duration-300 ${
          toastMessage.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
          'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo(a) de volta, {profile.first_name || currentUser?.email}!
          </h1>
          <p className="text-gray-600">
            Gerencie seus agendamentos de lavagem e mantenha seu veículo impecavelmente limpo.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate("/booking")}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Agendar uma Lavagem</h3>
            <p className="text-blue-100">Agende sua próxima lavagem de carro</p>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Car className="w-8 h-8 text-blue-600" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900">Gerenciar Veículos</h3>
            <p className="text-gray-600">{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} registrado{vehicles.length !== 1 ? 's' : ''}</p>
          </button>

          <button
            onClick={() => navigate("/subscription")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900">Assinatura</h3>
            <p className="text-gray-600">Gerenciar seu plano</p>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Próximos Agendamentos
              </h2>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhum agendamento próximo</p>
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  {recentAppointments.length === 0 ? "Agende Sua Primeira Lavagem" : "Agendar Lavagem"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-gray-900">
                          {new Date(appointment.start_time).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} at {new Date(appointment.start_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {appointment.service_type}
                        </span>
                        <button onClick={() => handleCancel(appointment)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {appointment.vehicle?.make} {appointment.vehicle?.model} {appointment.vehicle?.year && `(${appointment.vehicle?.year})`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Atividade Recente
            </h2>

            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {recentAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      appointment.status === 'completed' ? 'bg-green-100' :
                      appointment.status === 'canceled' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {appointment.status === 'completed' && <Car className="w-5 h-5 text-green-600" />}
                      {appointment.status === 'canceled' && <Trash2 className="w-5 h-5 text-red-600" />}
                      {appointment.status === 'scheduled' && <Calendar className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {appointment.service_type} lavagem {appointment.status === 'completed' ? 'concluída' :
                                                      appointment.status === 'canceled' ? 'cancelada' :
                                                      'agendada'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.vehicle?.year} {appointment.vehicle?.make} {appointment.vehicle?.model}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Agendado em: {new Date(appointment.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {appointment.status === 'canceled' && (
                        <p className="text-xs text-red-500 mt-1">
                          Cancelado em: {new Date(appointment.start_time).toLocaleDateString('pt-BR')} {/* Usando start_time como placeholder para a data de cancelamento */}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Overview */}
        {vehicles.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Seus Veículos</h2>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Veículo</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
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
                    </div>
                  </div>
                  {vehicle.is_default && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Padrão
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popup de Confirmação de Cancelamento */}
      {showCancelConfirmation && appointmentToCancel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Confirmar Cancelamento</h2>
            <p className="text-gray-700 mb-6 text-center">Você tem certeza que deseja cancelar este agendamento?</p>
            
            <div className="space-y-4 mb-8">
              {/* Detalhe do Veículo */}
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <Car className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Veículo</p>
                  <p className="text-gray-700 text-sm">
                    {appointmentToCancel.vehicle?.year}{' '}
                    {appointmentToCancel.vehicle?.make}{' '}
                    {appointmentToCancel.vehicle?.model}
                  </p>
                </div>
              </div>

              {/* Detalhe do Serviço */}
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Serviço</p>
                  <p className="text-gray-700 text-sm">
                    {appointmentToCancel.service_type}
                  </p>
                </div>
              </div>

              {/* Detalhe da Data/Hora */}
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <Calendar className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Data e Hora</p>
                  <p className="text-gray-700 text-sm">
                    {new Date(appointmentToCancel.start_time).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}{' '}
                    às {new Date(appointmentToCancel.start_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row-reverse justify-start sm:justify-between gap-3">
              <button
                onClick={confirmCancellation}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                Confirmar Cancelamento
              </button>
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Manter Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}