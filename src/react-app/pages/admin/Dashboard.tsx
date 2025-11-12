import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { 
  BarChart3, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext"; // New Firebase AuthContext

interface AdminStats {
  totalCustomers: number;
  activeSubscriptions: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  revenueGrowth: number;
}

export default function AdminDashboard() {
  const { currentUser, loading } = useAuth(); // Use currentUser and loading from new context
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    canceledAppointments: 0,
    revenueGrowth: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true); // Renamed to avoid conflict with auth loading

  useEffect(() => {
    if (!currentUser && !loading) { // Use currentUser and loading
      navigate("/");
      return;
    }

    if (currentUser) { // Use currentUser
      fetchAdminData();
    }
  }, [currentUser, loading, navigate]); // Update dependencies

  const fetchAdminData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/recent-appointments")
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setRecentAppointments(appointmentsData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setDataLoading(false); // Use dataLoading
    }
  };

  if (loading || dataLoading) { // Use combined loading states
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          <BarChart3 className="w-12 h-12" />
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
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
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel</h1>
          <p className="text-gray-600">
            Bem-vindo(a) de volta! Veja o que está acontecendo com seu negócio de lavagem de carros.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Customers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalCustomers}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Total de Clientes</h3>
            <p className="text-gray-600 text-sm">Usuários registrados</p>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <Car className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.activeSubscriptions}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Planos Ativos</h3>
            <p className="text-gray-600 text-sm">Clientes com assinatura</p>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.todayAppointments}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Agendamentos de Hoje</h3>
            <p className="text-gray-600 text-sm">Agendamentos programados</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">
                  ${stats.monthlyRevenue.toLocaleString()}
                </span>
                <div className="flex items-center text-sm">
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                  )}
                  <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(stats.revenueGrowth)}%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Receita Mensal</h3>
            <p className="text-gray-600 text-sm">Ganhos deste mês</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Appointment Status Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Status dos Agendamentos</h2>
            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <span className="font-medium text-gray-900">Concluídos</span>
                              </div>
                              <span className="text-2xl font-bold text-green-600">
                                {stats.completedAppointments}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Clock className="w-6 h-6 text-blue-600" />
                                <span className="font-medium text-gray-900">Pendentes</span>
                              </div>
                              <span className="text-2xl font-bold text-blue-600">
                                {stats.pendingAppointments}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <span className="font-medium text-gray-900">Cancelados</span>
                              </div>
                              <span className="text-2xl font-bold text-red-600">
                                {stats.canceledAppointments}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => navigate("/admin/appointments")}
                            className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                          >
                            Ver Todos os Agendamentos
                          </button>          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Agendamentos Recentes</h2>
            
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum agendamento recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.slice(0, 5).map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(appointment.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.make} {appointment.model}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.service_type} • {appointment.date} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => navigate("/admin/appointments")}
              className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors"
            >
              Ver Toda a Atividade Recente
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-4 gap-6">
          <button
            onClick={() => navigate("/admin/appointments")}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <Calendar className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold">Gerenciar Agendamentos</h3>
            <p className="text-blue-100 text-sm mt-1">Visualizar e atualizar reservas</p>
          </button>
          
          <button
            onClick={() => navigate("/admin/customers")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Gerenciamento de Clientes</h3>
            <p className="text-gray-600 text-sm mt-1">Visualizar perfis de clientes</p>
          </button>
          
          <button
            onClick={() => navigate("/admin/plans")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <Car className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Planos de Assinatura</h3>
            <p className="text-gray-600 text-sm mt-1">Gerenciar preços e recursos</p>
          </button>
          
          <button
            onClick={() => navigate("/admin/reports")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Análises e Relatórios</h3>
            <p className="text-gray-600 text-sm mt-1">Insights de negócios</p>
          </button>
        </div>
      </div>
    </div>
  );
}
