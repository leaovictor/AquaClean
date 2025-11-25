import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Definição local do tipo, já que não temos acesso ao arquivo de tipos compartilhados
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  washes_per_month: number;
  features: string[];
  is_active: boolean;
}

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export default function AdminPlans() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_months: "1",
    washes_per_month: "",
    features: [""],
    is_active: true
  });

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    if (currentUser) {
      fetchPlans();
    }
  }, [currentUser, loading, navigate]);

  const fetchPlans = async () => {
    setDataLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.error("No session token found");
        return;
      }

      const response = await fetch(`${FUNCTIONS_URL}/admin-subscription-plans`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        console.error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: "",
      description: "",
      price: "",
      duration_months: "1",
      washes_per_month: "",
      features: [""],
      is_active: true
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      washes_per_month: plan.washes_per_month.toString(),
      features: plan.features && plan.features.length > 0 ? plan.features : [""],
      is_active: plan.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const featuresArray = planForm.features.filter(f => f.trim() !== "");
    
    if (!planForm.name || !planForm.price || !planForm.washes_per_month || featuresArray.length === 0) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios' });
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const planData = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        duration_months: parseInt(planForm.duration_months),
        washes_per_month: parseInt(planForm.washes_per_month),
        features: featuresArray,
        is_active: planForm.is_active
      };

      const url = editingPlan
        ? `${FUNCTIONS_URL}/admin-subscription-plans/${editingPlan.id}`
        : `${FUNCTIONS_URL}/admin-subscription-plans`;

      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Plano ${editingPlan ? 'atualizado' : 'criado'} com sucesso!` 
        });
        setShowModal(false);
        resetForm();
        fetchPlans();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || `Falha ao ${editingPlan ? 'atualizar' : 'criar'} plano` });
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      setMessage({ type: 'error', text: `Falha ao ${editingPlan ? 'atualizar' : 'criar'} plano` });
    }
  };

  const togglePlanStatus = async (planId: number, currentStatus: boolean) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`${FUNCTIONS_URL}/admin-subscription-plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchPlans();
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
    }
  };

  const deletePlan = async (planId: number) => {
    if (!confirm("Tem certeza de que deseja excluir este plano?")) {
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`${FUNCTIONS_URL}/admin-subscription-plans/${planId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Plano excluído com sucesso!' });
        fetchPlans();
      } else {
        setMessage({ type: 'error', text: 'Falha ao excluir plano' });
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      setMessage({ type: 'error', text: 'Falha ao excluir plano' });
    }
  };

  const addFeature = () => {
    setPlanForm({ ...planForm, features: [...planForm.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = planForm.features.filter((_, i) => i !== index);
    setPlanForm({ ...planForm, features: newFeatures.length > 0 ? newFeatures : [""] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...planForm.features];
    newFeatures[index] = value;
    setPlanForm({ ...planForm, features: newFeatures });
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          <CreditCard className="w-12 h-12" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planos de Assinatura</h1>
            <p className="text-gray-600">Gerencie planos de preços e recursos para clientes.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar Plano</span>
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                plan.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {plan.is_active ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${plan.price}
                    <span className="text-lg text-gray-600">/mês</span>
                  </div>
                  <p className="text-blue-600 font-medium">
                    {plan.washes_per_month} lavagens por mês
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {!plan.is_active && (
                  <div className="mt-3 text-center">
                    <span className="text-red-600 text-sm font-medium">Plano Inativo</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum plano de assinatura criado ainda</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Crie Seu Primeiro Plano
            </button>
          </div>
        )}

        {/* Plan Form Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-2xl bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Plano *
                    </label>
                    <input
                      type="text"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Plano Básico"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="29.99"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Breve descrição do plano"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração (Meses) *
                    </label>
                    <select
                      value={planForm.duration_months}
                      onChange={(e) => setPlanForm({ ...planForm, duration_months: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">1 Mês</option>
                      <option value="3">3 Meses</option>
                      <option value="6">6 Meses</option>
                      <option value="12">12 Meses</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lavagens por Mês *
                    </label>
                    <input
                      type="number"
                      required
                      value={planForm.washes_per_month}
                      onChange={(e) => setPlanForm({ ...planForm, washes_per_month: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recursos *
                  </label>
                  <div className="space-y-3">
                    {planForm.features.map((feature, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ex: Agendamento prioritário"
                        />
                        {planForm.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    + Adicionar Recurso
                  </button>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planForm.is_active}
                      onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Plano ativo (visível para clientes)</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-200"
                  >
                    {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
