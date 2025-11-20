import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Edit2,
  Eye
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext";
import { fetchAllAppointments, updateAppointmentStatus, AdminAppointment } from "@/react-app/lib/admin-helpers";

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
  }, [currentUser, currentPage]);

  const loadAppointments = async (page: number) => {
    setDataLoading(true);
    try {
      const { data, count } = await fetchAllAppointments(page, pageSize);
      setAppointments(data);
      setTotalAppointments(count || 0);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev => prev.map(app =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'canceled':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totalPages = Math.ceil(totalAppointments / pageSize);

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data e Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.customer_name || 'N/D'}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Car className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.make} {appointment.model}
                            </div>
                            {appointment.year && (
                              <div className="text-sm text-gray-500">{appointment.year}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {appointment.service_type}
                        </div>
                        {appointment.total_price && (
                          <div className="text-sm text-gray-500">
                            R$ {appointment.total_price}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">
                            {appointment.status === 'scheduled' ? 'Agendado' :
                             appointment.status === 'in_progress' ? 'Em Progresso' :
                             appointment.status === 'completed' ? 'Concluído' :
                             appointment.status === 'canceled' ? 'Cancelado' :
                             appointment.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>

        {/* Appointment Detail Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-2xl bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Detalhes do Agendamento
                </h3>
                <p className="text-gray-600">ID: {selectedAppointment.id}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações do Cliente</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nome:</span> {selectedAppointment.customer_name || 'N/D'}</p>
                    <p><span className="font-medium">Email:</span> {selectedAppointment.user_email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações do Veículo</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Veículo:</span> {selectedAppointment.year} {selectedAppointment.make} {selectedAppointment.model}</p>
                    <p><span className="font-medium">Serviço:</span> {selectedAppointment.service_type}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Agendamento</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Data:</span> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Hora:</span> {selectedAppointment.time}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusIcon(selectedAppointment.status)}
                        <span className="capitalize">{selectedAppointment.status === 'scheduled' ? 'Agendado' :
                                                      selectedAppointment.status === 'in_progress' ? 'Em Progresso' :
                                                      selectedAppointment.status === 'completed' ? 'Concluído' :
                                                      selectedAppointment.status === 'canceled' ? 'Cancelado' :
                                                      selectedAppointment.status}</span>
                      </span>
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
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                    {selectedAppointment.special_instructions}
                  </p>
                </div>
              )}

              {/* Status Update */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Atualizar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['scheduled', 'in_progress', 'completed', 'canceled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedAppointment.id, status)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        selectedAppointment.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {status === 'scheduled' ? 'Agendado' :
                       status === 'in_progress' ? 'Em Progresso' :
                       status === 'completed' ? 'Concluído' :
                       status === 'canceled' ? 'Cancelado' :
                       status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
