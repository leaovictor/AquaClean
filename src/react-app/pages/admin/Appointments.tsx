import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import {
  Clock,
  CheckCircle,
  Car,
  Eye,
  Check,
  XCircle,
  Bell,
  MapPin,
  UserX,
  CalendarCheck,
  Calendar,
  MessageCircle,
}
  from "lucide-react";
import { useAuth } from "@/react-app/AuthContext";
import {
  fetchAllAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  confirmAppointment,
  fetchAppointmentLogs,
  fetchAvailableSlots,
  AdminAppointment,
} from "@/react-app/lib/admin-helpers";

const statusLabels: { [key: string]: string } = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  checked_in: "Check-in",
  in_progress: "Em Lavagem",
  ready_for_pickup: "Pronto para Retirada",
  completed: "Finalizado",
  canceled_by_admin: "Cancelado pelo Lavajato",
  canceled_by_customer: "Cancelado pelo Cliente",
  no_show: "Não Compareceu",
};

export default function AdminAppointments() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // local fields for reschedule UI
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null); // ISO date string
  const [rescheduleTimeSlotId, setRescheduleTimeSlotId] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ id: number; start_time: string }>>([]);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (currentUser) {
      loadAppointments(currentPage);
    }
  }, [currentUser, currentPage, searchQuery, statusFilter]);

  const loadAppointments = async (page: number) => {
    setDataLoading(true);
    try {
      const { data, count } = await fetchAllAppointments(page, pageSize, searchQuery, statusFilter);

      const flattenedData = data.map((apt: any) => ({
        id: apt.id,
        user_email: apt.profiles.email,
        customer_name: `${apt.profiles.first_name} ${apt.profiles.last_name}`,
        phone: apt.profiles.phone,
        whatsapp_number: apt.profiles.whatsapp_number,
        phone_is_whatsapp: apt.profiles.phone_is_whatsapp,
        make: apt.vehicles.make,
        model: apt.vehicles.model,
        year: apt.vehicles.year,
        plate: apt.vehicles.plate ? apt.vehicles.plate.toUpperCase() : undefined,
        service_type: apt.service_type,
        status: apt.status,
        start_time: apt.start_time, // Store ISO string directly
        special_instructions: apt.special_instructions,
        total_price: apt.total_price,
        created_at: apt.created_at,
        confirmed_at: apt.confirmed_at,
      }));

      setAppointments(flattenedData || []);
      setTotalAppointments(count || 0);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      alert("Erro ao carregar agendamentos. Veja o console.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      const typedStatus = newStatus as AdminAppointment['status'];
      setAppointments(prev => prev.map(app => (app.id === appointmentId ? { ...app, status: typedStatus } : app)));
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: typedStatus });
        refreshLogs(appointmentId);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Erro ao atualizar status");
    }
  };

  const [appointmentLogs, setAppointmentLogs] = useState<any[]>([]);

  const refreshLogs = async (appointmentId: number) => {
    try {
      const logs = await fetchAppointmentLogs(appointmentId);
      setAppointmentLogs(logs);
    } catch (error) {
      console.error("Error refreshing appointment logs:", error);
    }
  };

  const handleOpenModal = async (appointment: AdminAppointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(null);
    setRescheduleTimeSlotId(null);
    setAvailableSlots([]);
    setShowModal(true);

    try {
      const logs = await fetchAppointmentLogs(appointment.id);
      setAppointmentLogs(logs);
    } catch (error) {
      console.error("Error fetching appointment logs:", error);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    if (!confirm("Confirma o cancelamento deste agendamento?")) return;

    try {
      await cancelAppointment(selectedAppointment.id);
      // update local list
      setAppointments(prev => prev.map(a => (a.id === selectedAppointment.id ? { ...a, status: "canceled_by_admin" } : a)));
      setSelectedAppointment(prev => (prev ? { ...prev, status: "canceled_by_admin" } : prev));
      alert("Agendamento cancelado com sucesso.");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao cancelar agendamento");
    }
  };

  // load available time slots for a date (example endpoint). You should replace with your real API.
  const loadAvailableSlots = async (isoDate: string) => {
    try {
      const slots = await fetchAvailableSlots(isoDate);
      setAvailableSlots(slots || []);
    } catch (err) {
      console.error("Error loading slots:", err);
      setAvailableSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment) return;
    if (!rescheduleDate || !rescheduleTimeSlotId) {
      alert("Escolha data e horário para reagendar");
      return;
    }

    try {
      // build ISO datetime using date + keep original time if needed; here backend expects full ISO
      const newStartTime = new Date(rescheduleDate).toISOString();
      await rescheduleAppointment(selectedAppointment.id, newStartTime, String(rescheduleTimeSlotId));
      alert("Agendamento reagendado com sucesso.");
      // refresh list
      await loadAppointments(currentPage);
      refreshLogs(selectedAppointment.id);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao reagendar");
    }
  };

  const handleConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      await confirmAppointment(selectedAppointment.id);
      setAppointments(prev => prev.map(a => (a.id === selectedAppointment.id ? { ...a, confirmed_at: new Date().toISOString(), status: 'confirmed' } : a)));
      setSelectedAppointment(prev => (prev ? { ...prev, confirmed_at: new Date().toISOString(), status: 'confirmed' } : prev));
      refreshLogs(selectedAppointment.id);
      alert("Agendamento confirmado com sucesso.");
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar agendamento");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Car className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "ready_for_pickup":
        return <Bell className="w-4 h-4 text-purple-600" />;
      case "checked_in":
        return <MapPin className="w-4 h-4 text-cyan-600" />;
      case "confirmed":
        return <CalendarCheck className="w-4 h-4 text-blue-600" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-gray-600" />;
      case "canceled":
      case "canceled_by_admin":
      case "canceled_by_customer":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "no_show":
        return <UserX className="w-4 h-4 text-gray-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800 animate-pulse";
      case "ready_for_pickup":
        return "bg-purple-100 text-purple-800";
      case "checked_in":
        return "bg-cyan-100 text-cyan-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-gray-100 text-gray-800";
      case "canceled":
      case "canceled_by_admin":
      case "canceled_by_customer":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'scheduled':
        return ['confirmed', 'no_show'];
      case 'confirmed':
        return ['checked_in', 'canceled_by_admin'];
      case 'checked_in':
        return ['in_progress'];
      case 'in_progress':
        return ['ready_for_pickup'];
      case 'ready_for_pickup':
        return ['completed'];
      default:
        return [];
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          <Calendar className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendamentos</h1>
          <p className="text-gray-600">Gerencie todos os agendamentos e reservas de lavagem de carros.</p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-xl px-4 py-2 w-full"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-xl px-4 py-2 w-full"
            >
              <option value="">Todos os Status</option>
              {Object.keys(statusLabels).map(status => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </div>
          <button onClick={() => loadAppointments(1)} className="px-4 py-2 bg-blue-600 text-white rounded-xl w-full md:w-auto">
            Buscar
          </button>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {dataLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-600">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data e Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{appointment.customer_name || 'N/D'}</div>
                          <div className="text-sm text-gray-500">{appointment.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Car className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.make} {appointment.model}</div>
                            {appointment.year && <div className="text-sm text-gray-500">{appointment.year}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{appointment.service_type}</div>
                        {appointment.total_price && <div className="text-sm text-gray-500">R$ {appointment.total_price}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{new Date(appointment.start_time).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-gray-500">{new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{statusLabels[appointment.status] || appointment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenModal(appointment)} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4" /></button>
                          {(appointment.whatsapp_number || (appointment.phone_is_whatsapp && appointment.phone)) && (
                            <a
                              href={`https://wa.me/${appointment.phone_is_whatsapp ? appointment.phone : appointment.whatsapp_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-600 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {appointments.length === 0 && !dataLoading && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); loadAppointments(Math.max(1, currentPage - 1)); }} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
            <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); loadAppointments(Math.min(totalPages, currentPage + 1)); }} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Próxima</button>
          </div>
        </div>

        {/* Appointment Detail Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                <XCircle className="w-6 h-6" />
              </button>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Detalhes do Agendamento</h3>
                <p className="text-gray-600">ID: {selectedAppointment.id}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações do Cliente</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nome:</span> {selectedAppointment.customer_name || 'N/D'}</p>
                    <p><span className="font-medium">Email:</span> {selectedAppointment.user_email}</p>
                    <p className="flex items-center space-x-2">
                      <span className="font-medium">Telefone:</span>
                      <span>{selectedAppointment.phone || 'N/D'}</span>
                      {(selectedAppointment.whatsapp_number || (selectedAppointment.phone_is_whatsapp && selectedAppointment.phone)) && (
                        <a
                          href={`https://wa.me/${selectedAppointment.phone_is_whatsapp ? selectedAppointment.phone : selectedAppointment.whatsapp_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-600 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações do Veículo</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Veículo:</span> {selectedAppointment.year} {selectedAppointment.make} {selectedAppointment.model}</p>
                    {selectedAppointment.plate && <p><span className="font-medium">Placa:</span> {selectedAppointment.plate}</p>}
                    <p><span className="font-medium">Serviço:</span> {selectedAppointment.service_type}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Agendamento</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Data:</span> {new Date(selectedAppointment.start_time).toLocaleDateString('pt-BR')}</p>
                    <p><span className="font-medium">Hora:</span> {new Date(selectedAppointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusIcon(selectedAppointment.status)}
                        <span className="capitalize">{statusLabels[selectedAppointment.status] || selectedAppointment.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Confirmação:</span>
                      {selectedAppointment.confirmed_at ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirmado em {new Date(selectedAppointment.confirmed_at).toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-4 h-4" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações Adicionais</h4>
                  <div className="space-y-2">
                    {selectedAppointment.total_price && (
                      <p><span className="font-medium">Preço:</span> R$ {selectedAppointment.total_price}</p>
                    )}
                    <p><span className="font-medium">Agendado em:</span> {new Date(selectedAppointment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedAppointment.special_instructions && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Instruções Especiais</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedAppointment.special_instructions}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: Main Actions */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Ações Rápidas</h4>

                    {/* Confirm Button */}
                    {selectedAppointment.status === 'scheduled' && (
                      <button
                        onClick={handleConfirm}
                        className="w-full px-4 py-3 rounded-xl font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Confirmar Agendamento</span>
                      </button>
                    )}

                    {/* Status Update Buttons */}
                    <div>
                      <h5 className="text-md font-medium text-gray-800 mb-2">Alterar Status</h5>
                      <div className="flex flex-wrap gap-2">
                        {getNextStatuses(selectedAppointment.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(selectedAppointment.id, status)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700`}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cancel Button */}
                    {selectedAppointment.status !== 'canceled_by_admin' && selectedAppointment.status !== 'canceled_by_customer' && selectedAppointment.status !== 'completed' && (
                      <div>
                        <h5 className="text-md font-medium text-gray-800 mb-2">Cancelar</h5>
                        <button
                          onClick={handleCancel}
                          className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center justify-center space-x-2"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Cancelar Agendamento</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Reschedule */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Reagendar</h4>
                    <div className="space-y-3">
                      <input
                        type="date"
                        className="w-full border rounded-xl px-3 py-2"
                        onChange={(e) => {
                          const iso = e.target.value;
                          setRescheduleDate(iso);
                          if (iso) loadAvailableSlots(iso);
                        }}
                      />
                      <select
                        className="w-full border rounded-xl px-3 py-2"
                        value={rescheduleTimeSlotId ?? ""}
                        onChange={(e) => setRescheduleTimeSlotId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Selecione um novo horário</option>
                        {availableSlots.map(s => (
                          <option key={s.id} value={s.id}>{s.start_time}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleReschedule}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                      >
                        Reagendar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change History */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Histórico de Alterações</h4>
                <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                  {appointmentLogs.length > 0 ? (
                    <ol className="relative border-l border-gray-200">
                      {appointmentLogs.map((log) => {
                        const previousValue = log.previous_value ? JSON.parse(log.previous_value) : {};
                        const newValue = log.new_value ? JSON.parse(log.new_value) : {};

                        return (
                          <li key={log.id} className="mb-6 ml-4">
                            <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                            <time className="mb-1 text-sm font-normal leading-none text-gray-400">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </time>
                            <h3 className="text-lg font-semibold text-gray-900">{log.action}</h3>
                            {log.action === 'status_update' && (
                              <p className="text-base font-normal text-gray-500">
                                Status alterado de <span className="font-medium">{statusLabels[previousValue.status as keyof typeof statusLabels]}</span> para <span className="font-medium">{statusLabels[newValue.status as keyof typeof statusLabels]}</span>
                              </p>
                            )}
                            {log.action === 'cancellation' && (
                              <p className="text-base font-normal text-gray-500">
                                Agendamento cancelado. Status anterior: <span className="font-medium">{previousValue.status}</span>
                              </p>
                            )}
                            {log.action === 'admin_cancellation' && (
                              <p className="text-base font-normal text-gray-500">
                                Agendamento cancelado pelo lavajato. Status anterior: <span className="font-medium">{previousValue.status}</span>
                              </p>
                            )}
                            {log.action === 'customer_cancellation' && (
                              <p className="text-base font-normal text-gray-500">
                                Agendamento cancelado pelo cliente. Status anterior: <span className="font-medium">{previousValue.status}</span>
                              </p>
                            )}
                            {log.action === 'reschedule' && (
                              <p className="text-base font-normal text-gray-500">
                                Reagendado de {new Date(previousValue.start_time).toLocaleString('pt-BR')} para {new Date(newValue.start_time).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="text-gray-500">Nenhuma alteração encontrada.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
