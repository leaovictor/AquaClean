import { useEffect, useState } from 'react';
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { fetchAdminFinance } from '@/react-app/lib/admin-helpers';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';

export default function Finance() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await fetchAdminFinance();
            setStats(data);
        } catch (error) {
            console.error("Error loading finance stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-pulse text-gray-600">
                    <DollarSign className="w-12 h-12" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNavigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão Financeira</h1>
                    <p className="text-gray-600">Visão geral das receitas e desempenho financeiro.</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Receita Total</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            R$ {stats?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Receita Mensal (Estimada)</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            R$ {stats?.monthlyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Receita de Assinaturas</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            R$ {stats?.subscriptionRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">{stats?.activeSubscriptions} assinantes ativos</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Total de Serviços</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {stats?.appointmentCount}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue by Payment Method */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Receita por Método de Pagamento</h3>
                        <div className="space-y-4">
                            {Object.entries(stats?.revenueByMethod || {}).map(([method, amount]: [string, any]) => {
                                const total = stats?.totalRevenue || 1;
                                const percentage = (amount / total) * 100;

                                const methodLabels: Record<string, string> = {
                                    'cash': 'Dinheiro',
                                    'credit_card': 'Cartão de Crédito',
                                    'debit_card': 'Cartão de Débito',
                                    'pix': 'Pix',
                                    'Outros': 'Outros'
                                };

                                return (
                                    <div key={method}>
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className="text-gray-700 capitalize">{methodLabels[method] || method}</span>
                                            <span className="text-gray-900">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(stats?.revenueByMethod || {}).length === 0 && (
                                <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                            )}
                        </div>
                    </div>

                    {/* Revenue by Service Type */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Receita por Serviço</h3>
                        <div className="space-y-4">
                            {Object.entries(stats?.revenueByService || {}).map(([service, amount]: [string, any]) => {
                                const total = stats?.totalRevenue || 1;
                                const percentage = (amount / total) * 100;

                                return (
                                    <div key={service}>
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className="text-gray-700 capitalize">{service}</span>
                                            <span className="text-gray-900">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className="bg-purple-600 h-2.5 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(stats?.revenueByService || {}).length === 0 && (
                                <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
