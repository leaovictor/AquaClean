import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, Plus, ChevronRight, Trash2, CheckCircle, AlertCircle, UserX, Bell, MapPin, CalendarCheck, XCircle, Crown, Sparkles } from "lucide-react";
import type { Appointment, Vehicle, UserProfile, TimeSlot } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";
import AppointmentSummaryModal from "@/react-app/components/AppointmentSummaryModal";
import { supabase } from "@/lib/supabaseClient";

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

interface EnrichedAppointment extends Appointment {
  vehicle?: Vehicle;
  timeSlot?: TimeSlot;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "in_progress": return <Car className="w-4 h-4 text-blue-500 animate-pulse" />;
    case "ready_for_pickup": return <Bell className="w-4 h-4 text-purple-500" />;
    case "checked_in": return <MapPin className="w-4 h-4 text-cyan-500" />;
    case "confirmed": return <CalendarCheck className="w-4 h-4 text-blue-500" />;
    case "scheduled": return <Clock className="w-4 h-4 text-gray-400" />;
    case "canceled":
    case "canceled_by_admin":
    case "canceled_by_customer": return <XCircle className="w-4 h-4 text-red-500" />;
    case "no_show": return <UserX className="w-4 h-4 text-gray-400" />;
    default: return <Calendar className="w-4 h-4 text-gray-400" />;
  }
};

export default function Dashboard() {
  const statusLabels: { [key: string]: string } = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    checked_in: "Check-in",
    in_progress: "Em Lavagem",
    ready_for_pickup: "Pronto p/ Retirada",
    completed: "Finalizado",
    canceled_by_admin: "Cancelado pelo Lavajato",
    canceled_by_customer: "Cancelado pelo Cliente",
    no_show: "Não Compareceu",
  };

  const statusFlow = ['scheduled', 'confirmed', 'in_progress', 'ready_for_pickup', 'completed'];

  const { currentUser, session, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<EnrichedAppointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setToastMessage({ type: 'success', text: 'Pagamento processado! Atualizando sua assinatura...' });
      // Remove session_id from URL without reloading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('session_id');
      setSearchParams(newParams);

      // Re-fetch data after a short delay to allow webhook to process
      setTimeout(() => fetchDashboardData(), 2000);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${currentUser.id}` },
        () => fetchDashboardData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!session) return;
    try {
      const token = session.access_token;
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

  const handleViewSummary = (appointment: EnrichedAppointment) => setSelectedAppointment(appointment);

  const confirmCancellation = async () => {
    if (!session || !appointmentToCancel) return;
    setShowCancelConfirmation(false);
    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/cancel-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ appointment_id: appointmentToCancel.id }),
      });

      if (response.ok) {
        setToastMessage({ type: 'success', text: 'Agendamento cancelado com sucesso!' });
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        setToastMessage({ type: 'error', text: errorData.error || 'Falha ao cancelar agendamento.' });
      }
    } catch (error) {
      setToastMessage({ type: 'error', text: 'Erro ao cancelar agendamento: Problema de conexão.' });
    } finally {
      setAppointmentToCancel(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const isSubscriber = currentUser?.profile?.subscription_status === 'active';

  if (loading || dataLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isSubscriber ? "bg-slate-900" : "bg-gradient-to-br from-blue-50 to-cyan-100"}`}>
        <div className={`animate-pulse ${isSubscriber ? "text-yellow-400" : "text-blue-600"}`}><Car className="w-12 h-12" /></div>
      </div>
    );
  }

  const activeStatuses = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'ready_for_pickup'];
  const currentAppointment = appointments
    .filter(apt => activeStatuses.includes(apt.status))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const pastAppointments = appointments
    .filter(apt => !activeStatuses.includes(apt.status))
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // --- Premium Logic ---
  // isSubscriber is already defined at the top of the component


  const theme = {
    bg: isSubscriber ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 to-cyan-100",
    text: isSubscriber ? "text-white" : "text-gray-900",
    subText: isSubscriber ? "text-gray-300" : "text-gray-600",
    card: isSubscriber ? "bg-slate-800 border-yellow-500/30 shadow-xl shadow-yellow-900/10" : "bg-white border-blue-100 shadow-lg",
    cardHover: isSubscriber ? "hover:border-yellow-500/50" : "hover:border-blue-300",
    buttonPrimary: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900" : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white",
    iconPrimary: isSubscriber ? "text-yellow-400" : "text-blue-600",
    iconBg: isSubscriber ? "bg-yellow-500/10" : "bg-blue-100",
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <Navigation />

      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-opacity duration-300 ${toastMessage.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          {isSubscriber && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg shadow-yellow-500/20">
              <Crown className="w-3 h-3 mr-1.5" /> Membro Premium
            </div>
          )}
          <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>
            Bem-vindo(a) de volta, {profile.first_name || currentUser?.email}!
          </h1>
          <p className={theme.subText}>
            {isSubscriber
              ? "Aproveite a exclusividade e o cuidado premium que seu carro merece."
              : "Gerencie seus agendamentos de lavagem e mantenha seu veículo impecavelmente limpo."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate("/booking")}
            className={`${theme.buttonPrimary} p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group text-left relative overflow-hidden`}
          >
            {isSubscriber && <div className="absolute top-0 right-0 p-2 opacity-10"><Crown className="w-24 h-24 rotate-12" /></div>}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Calendar className="w-8 h-8" />
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1">Agendar Lavagem</h3>
              <p className={isSubscriber ? "text-slate-800 font-medium opacity-90" : "text-blue-100"}>
                {isSubscriber ? "Lavagem incluída no seu plano" : "Agende sua próxima lavagem"}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className={`${theme.card} ${theme.cardHover} border-2 p-6 rounded-2xl transition-all duration-200 group text-left`}
          >
            <div className="flex items-center justify-between mb-4">
              <Car className={`w-8 h-8 ${theme.iconPrimary}`} />
              <ChevronRight className={`w-5 h-5 ${isSubscriber ? 'text-gray-500' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Gerenciar Veículos</h3>
            <p className={theme.subText}>{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} registrado{vehicles.length !== 1 ? 's' : ''}</p>
          </button>

          <button
            onClick={() => navigate("/subscription")}
            className={`${theme.card} ${theme.cardHover} border-2 p-6 rounded-2xl transition-all duration-200 group text-left`}
          >
            <div className="flex items-center justify-between mb-4">
              {isSubscriber ? <Sparkles className={`w-8 h-8 ${theme.iconPrimary}`} /> : <Clock className={`w-8 h-8 ${theme.iconPrimary}`} />}
              <ChevronRight className={`w-5 h-5 ${isSubscriber ? 'text-gray-500' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Assinatura</h3>
            <p className={theme.subText}>{isSubscriber ? "Gerenciar benefícios" : "Conheça nossos planos"}</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Next Service */}
          <div className={`${theme.card} rounded-2xl p-6 lg:col-span-2 border`}>
            <h2 className={`text-xl font-semibold mb-6 ${theme.text}`}>
              Meu Próximo Serviço
            </h2>

            {currentAppointment ? (
              <div>
                {/* Status Tracker - Desktop */}
                <div className="hidden lg:flex justify-between items-center text-xs text-center mb-8">
                  {statusFlow.map((status, index, arr) => {
                    const statusIndex = arr.indexOf(currentAppointment.status);
                    const isActive = index === statusIndex;
                    const isCompleted = index < statusIndex;

                    return (
                      <div key={status} className="flex-1 relative">
                        <div className={`z-10 relative mx-auto w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                          ? (isSubscriber ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/50' : 'bg-blue-600 text-white shadow-lg')
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : (isSubscriber ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-500')
                          }`}>
                          {isCompleted ? <CheckCircle className="w-6 h-6" /> : getStatusIcon(status)}
                        </div>
                        <p className={`mt-2 font-medium ${isActive ? (isSubscriber ? 'text-yellow-400' : 'text-blue-600') : (isSubscriber ? 'text-slate-500' : 'text-gray-600')}`}>
                          {statusLabels[status as keyof typeof statusLabels]}
                        </p>
                        {index < arr.length - 1 && (
                          <div className={`absolute top-5 left-1/2 w-full h-0.5 ${isCompleted ? 'bg-green-500' : (isSubscriber ? 'bg-slate-700' : 'bg-gray-200')}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Appointment Details */}
                <div className={`${isSubscriber ? 'bg-slate-700/50' : 'bg-gray-50'} rounded-xl p-4 mt-8`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="mb-4 sm:mb-0">
                      <p className={`font-semibold text-lg ${theme.text}`}>
                        {currentAppointment.vehicle?.make} {currentAppointment.vehicle?.model} ({currentAppointment.vehicle?.year})
                      </p>
                      <p className={theme.subText}>{currentAppointment.service_type}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`font-semibold text-lg ${theme.text}`}>
                        {new Date(currentAppointment.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className={theme.subText}>
                        às {new Date(currentAppointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {(currentAppointment.status === 'scheduled' || currentAppointment.status === 'confirmed') && (
                    <div className={`mt-4 pt-4 border-t ${isSubscriber ? 'border-slate-600' : 'border-gray-200'} flex justify-end`}>
                      <button
                        onClick={() => {
                          setAppointmentToCancel(currentAppointment);
                          setShowCancelConfirmation(true);
                        }}
                        className="text-sm font-medium text-red-500 hover:text-red-600"
                      >
                        Cancelar Agendamento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className={`w-12 h-12 mx-auto mb-4 ${isSubscriber ? 'text-slate-600' : 'text-gray-400'}`} />
                <p className={`mb-4 ${theme.subText}`}>Nenhum agendamento ativo</p>
                <button
                  onClick={() => navigate("/booking")}
                  className={`${theme.buttonPrimary} px-4 py-2 rounded-xl font-medium transition-colors`}
                >
                  Agendar uma Lavagem
                </button>
              </div>
            )}
          </div>

          {/* Service History */}
          <div className={`${theme.card} rounded-2xl shadow-lg border p-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${theme.text}`}>
              Histórico de Serviços
            </h2>

            {pastAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className={`w-12 h-12 mx-auto mb-4 ${isSubscriber ? 'text-slate-600' : 'text-gray-400'}`} />
                <p className={theme.subText}>Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {pastAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    onClick={() => handleViewSummary(appointment)}
                    className={`flex items-center space-x-4 p-4 border rounded-xl transition-colors cursor-pointer ${isSubscriber
                      ? 'border-slate-700 hover:bg-slate-700/50'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${appointment.status === 'completed' ? 'bg-green-100' :
                      (appointment.status === 'canceled_by_admin' || appointment.status === 'canceled_by_customer') ? 'bg-red-100' :
                        isSubscriber ? 'bg-slate-700' : 'bg-gray-100'
                      }`}>
                      {appointment.status === 'completed' && <Car className="w-5 h-5 text-green-600" />}
                      {(appointment.status === 'canceled_by_admin' || appointment.status === 'canceled_by_customer') && <Trash2 className="w-5 h-5 text-red-600" />}
                      {appointment.status === 'no_show' && <UserX className={`w-5 h-5 ${isSubscriber ? 'text-slate-400' : 'text-gray-600'}`} />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${theme.text}`}>
                        {appointment.service_type} - {statusLabels[appointment.status as keyof typeof statusLabels]}
                      </p>
                      <p className={`text-sm ${theme.subText}`}>
                        {appointment.vehicle?.year} {appointment.vehicle?.make} {appointment.vehicle?.model}
                      </p>
                      <p className={`text-xs mt-1 ${isSubscriber ? 'text-slate-500' : 'text-gray-500'}`}>
                        Em: {new Date(appointment.start_time).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Overview */}
        {vehicles.length > 0 && (
          <div className={`mt-8 ${theme.card} rounded-2xl shadow-lg border p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${theme.text}`}>Seus Veículos</h2>
              <button
                onClick={() => navigate("/profile")}
                className={`flex items-center space-x-1 font-medium ${isSubscriber ? 'text-yellow-400 hover:text-yellow-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Veículo</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`border rounded-xl p-4 transition-colors ${isSubscriber
                    ? 'border-slate-700 hover:bg-slate-700/50'
                    : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.iconBg}`}>
                      <Car className={`w-5 h-5 ${theme.iconPrimary}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${theme.text}`}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className={`text-sm ${theme.subText}`}>{vehicle.color}</p>
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

      <AppointmentSummaryModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />

      {/* Popup de Confirmação de Cancelamento */}
      {showCancelConfirmation && appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Confirmar Cancelamento</h2>
            <p className="text-gray-700 mb-6 text-center">Você tem certeza que deseja cancelar este agendamento?</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <Car className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Veículo</p>
                  <p className="text-gray-700 text-sm">
                    {appointmentToCancel.vehicle?.year} {appointmentToCancel.vehicle?.make} {appointmentToCancel.vehicle?.model}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Serviço</p>
                  <p className="text-gray-700 text-sm">{appointmentToCancel.service_type}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <Calendar className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Data e Hora</p>
                  <p className="text-gray-700 text-sm">
                    {new Date(appointmentToCancel.start_time).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} às {new Date(appointmentToCancel.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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