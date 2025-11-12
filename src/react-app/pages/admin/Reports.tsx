import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Users,
  Car,
  Download
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext"; // New Firebase AuthContext

interface ReportData {
  revenue: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
    daily_revenue: Array<{ date: string; amount: number }>;
  };
  customers: {
    total: number;
    new_this_month: number;
    growth_percentage: number;
  };
  appointments: {
    total_this_month: number;
    completed: number;
    canceled: number;
    completion_rate: number;
  };
  popular_services: Array<{ service_type: string; count: number; revenue: number }>;
  monthly_trends: Array<{ month: string; appointments: number; revenue: number; customers: number }>;
}

export default function AdminReports() {
  const { currentUser, loading } = useAuth(); // Use currentUser and loading from new context
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData>({
    revenue: {
      current_month: 0,
      previous_month: 0,
      growth_percentage: 0,
      daily_revenue: []
    },
    customers: {
      total: 0,
      new_this_month: 0,
      growth_percentage: 0
    },
    appointments: {
      total_this_month: 0,
      completed: 0,
      canceled: 0,
      completion_rate: 0
    },
    popular_services: [],
    monthly_trends: []
  });
  const [dataLoading, setDataLoading] = useState(true); // Renamed to avoid conflict with auth loading
  const [dateRange, setDateRange] = useState("30"); // days

  useEffect(() => {
    if (!currentUser && !loading) { // Use currentUser and loading
      navigate("/");
      return;
    }

    if (currentUser) { // Use currentUser
      fetchReportData();
    }
  }, [currentUser, loading, navigate, dateRange]); // Update dependencies

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/admin/reports?period=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setDataLoading(false); // Use dataLoading
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&period=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `car-wash-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Análises e Relatórios</h1>
            <p className="text-gray-600">Insights de negócios e métricas de desempenho.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('csv')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  {reportData.revenue.growth_percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportData.revenue.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(reportData.revenue.growth_percentage)}%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ${reportData.revenue.current_month.toLocaleString()}
            </h3>
            <p className="text-gray-600">Receita Mensal</p>
          </div>

          {/* Customers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  {reportData.customers.growth_percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    reportData.customers.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(reportData.customers.growth_percentage)}%
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reportData.customers.total}
            </h3>
            <p className="text-gray-600">Total de Clientes</p>
            <p className="text-sm text-gray-500 mt-1">
              +{reportData.customers.new_this_month} novos este mês
            </p>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600">
                {reportData.appointments.completion_rate}% de conclusão
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reportData.appointments.total_this_month}
            </h3>
            <p className="text-gray-600">Este Mês</p>
            <p className="text-sm text-gray-500 mt-1">
              {reportData.appointments.completed} concluídos, {reportData.appointments.canceled} cancelados
            </p>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Car className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ${reportData.appointments.total_this_month > 0 
                ? (reportData.revenue.current_month / reportData.appointments.total_this_month).toFixed(2)
                : '0'
              }
            </h3>
            <p className="text-gray-600">Valor Médio do Pedido</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Tendência de Receita</h3>
            <div className="space-y-4">
              {reportData.revenue.daily_revenue.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max((day.amount / Math.max(...reportData.revenue.daily_revenue.map(d => d.amount))) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-gray-900 font-medium min-w-[60px] text-right">
                      ${day.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Serviços Populares</h3>
            <div className="space-y-4">
              {reportData.popular_services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {service.service_type} Lavagem
                    </p>
                    <p className="text-sm text-gray-600">
                      {service.count} agendamentos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${service.revenue}
                    </p>
                    <p className="text-sm text-gray-600">
                      receita
                    </p>
                  </div>
                </div>
              ))}
              
              {reportData.popular_services.length === 0 && (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado de serviço disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tendências Mensais</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-600 font-medium">Mês</th>
                  <th className="text-right py-3 text-gray-600 font-medium">Agendamentos</th>
                  <th className="text-right py-3 text-gray-600 font-medium">Receita</th>
                  <th className="text-right py-3 text-gray-600 font-medium">Novos Clientes</th>
                  <th className="text-right py-3 text-gray-600 font-medium">Pedido Médio</th>
                </tr>
              </thead>
              <tbody>
                {reportData.monthly_trends.map((trend, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{trend.month}</td>
                    <td className="py-3 text-right text-gray-900">{trend.appointments}</td>
                    <td className="py-3 text-right text-gray-900">${trend.revenue.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-900">{trend.customers}</td>
                    <td className="py-3 text-right text-gray-900">
                      ${trend.appointments > 0 ? (trend.revenue / trend.appointments).toFixed(2) : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {reportData.monthly_trends.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dado de tendência disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
