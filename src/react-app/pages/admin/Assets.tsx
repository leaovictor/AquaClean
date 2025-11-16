import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { useAuth } from "@/react-app/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PlusCircle, Edit, Trash2, BarChart2, Calendar, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

// Interfaces para os tipos de dados
interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  description: string;
}
interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}
interface VehicleStat {
  make: string;
  model: string;
  vehicle_count: number;
}
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export default function AdminAssets() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [dataLoading, setDataLoading] = useState(true);

  // Estados para os dados
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStat[]>([]);

  // Estados para o sistema de feedback
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Estados para modais e edição
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editablePlan, setEditablePlan] = useState<SubscriptionPlan | null>(null);
  const [editableSlot, setEditableSlot] = useState<TimeSlot | null>(null);

  // Efeito para limpar a mensagem de feedback
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setIsError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  // Busca inicial dos dados
  const fetchAssets = useCallback(async () => {
    setDataLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        showMessage("Sessão inválida. Faça login.", true);
        navigate('/sign-in');
        return;
      }

      const response = await fetch(`${FUNCTIONS_URL}/admin-assets-get`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
        setSlots(data.slots || []);
        setVehicleStats(data.vehicleStats || []);
      } else {
        throw new Error('Falha ao carregar os dados de configuração.');
      }
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      setDataLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/');
    }
    if (currentUser) {
      fetchAssets();
    }
  }, [currentUser, loading, navigate, fetchAssets]);

  // Funções CRUD genéricas
  const handleCrud = async (
    method: 'POST' | 'PUT' | 'DELETE',
    resource: 'plans' | 'slots',
    body?: any,
    id?: number
  ) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        showMessage("Sessão expirada.", true);
        return;
      }

      const url = id
        ? `${FUNCTIONS_URL}/admin-assets-crud/${resource}/${id}`
        : `${FUNCTIONS_URL}/admin-assets-crud/${resource}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha na operação de ${method}.`);
      }

      if (method !== 'DELETE') {
        const result = await response.json();
        return result;
      }

      return null;

    } catch (error) {
      showMessage(error.message, true);
      return null;
    }
  };

  // Handlers para Planos
  const handleSavePlan = async () => {
    if (!editablePlan) return;
    const isNew = !editablePlan.id;
    const method = isNew ? 'POST' : 'PUT';

    const savedPlan = await handleCrud(method, 'plans', editablePlan, editablePlan.id);

    if (savedPlan) {
      if (isNew) {
        setPlans([...plans, savedPlan]);
      } else {
        setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
      }
      showMessage(`Plano ${isNew ? 'criado' : 'atualizado'} com sucesso!`);
      setShowPlanModal(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este plano?")) return;
    await handleCrud('DELETE', 'plans', undefined, id);
    setPlans(plans.filter(p => p.id !== id));
    showMessage("Plano excluído com sucesso!");
  };

  // Handlers para Slots
  const handleSaveSlot = async () => {
    if (!editableSlot) return;
    const isNew = !editableSlot.id;
    const method = isNew ? 'POST' : 'PUT';

    const savedSlot = await handleCrud(method, 'slots', editableSlot, editableSlot.id);

    if (savedSlot) {
      if (isNew) {
        setSlots([...slots, savedSlot]);
      } else {
        setSlots(slots.map(s => s.id === savedSlot.id ? savedSlot : s));
      }
      showMessage(`Slot ${isNew ? 'criado' : 'atualizado'} com sucesso!`);
      setShowSlotModal(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este slot?")) return;
    await handleCrud('DELETE', 'slots', undefined, id);
    setSlots(slots.filter(s => s.id !== id));
    showMessage("Slot excluído com sucesso!");
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Carregando...</div>
      </div>
    );
  }

  // --- Renderização ---
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />

      {message && (
        <div className={`fixed top-24 right-5 p-4 rounded-xl shadow-2xl text-white flex items-center z-[100] ${isError ? 'bg-red-600' : 'bg-green-600'}`}>
          {isError ? <AlertCircle className="mr-3" /> : <CheckCircle className="mr-3" />}
          {message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Ativos e Configurações</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna de Planos e Slots */}
          <div className="lg:col-span-2 space-y-8">
            {/* Planos de Assinatura */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><DollarSign className="mr-2"/>Planos de Assinatura</h2>
                <button onClick={() => { setEditablePlan({ id: 0, name: '', price: 0, description: '' }); setShowPlanModal(true); }} className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <PlusCircle className="w-4 h-4 mr-2"/>Novo Plano
                </button>
              </div>
              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{plan.name} - R${plan.price}</p>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                    <div>
                      <button onClick={() => { setEditablePlan(plan); setShowPlanModal(true); }} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slots de Tempo */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><Calendar className="mr-2"/>Slots de Tempo</h2>
                <button onClick={() => { setEditableSlot({ id: 0, day_of_week: 'Segunda-feira', start_time: '09:00', end_time: '18:00', is_available: true }); setShowSlotModal(true); }} className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <PlusCircle className="w-4 h-4 mr-2"/>Novo Slot
                </button>
              </div>
              <div className="space-y-3">
                {slots.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{slot.day_of_week}: {slot.start_time} - {slot.end_time}</p>
                      <p className={`text-sm ${slot.is_available ? 'text-green-600' : 'text-red-600'}`}>{slot.is_available ? 'Disponível' : 'Indisponível'}</p>
                    </div>
                    <div>
                      <button onClick={() => { setEditableSlot(slot); setShowSlotModal(true); }} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna de Estatísticas */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><BarChart2 className="mr-2"/>Estatísticas de Veículos</h2>
            <div className="space-y-3">
              {vehicleStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{stat.make} {stat.model}</p>
                  <p className="text-gray-600">{stat.vehicle_count} {stat.vehicle_count > 1 ? 'unidades' : 'unidade'}</p>
                </div>
              ))}
              {vehicleStats.length === 0 && <p className="text-gray-500">Nenhuma estatística de veículo para exibir.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Planos */}
      {showPlanModal && editablePlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editablePlan.id ? 'Editar' : 'Criar'} Plano</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={editablePlan.name} onChange={e => setEditablePlan({...editablePlan, name: e.target.value})} className="w-full p-2 border rounded"/>
              <input type="number" placeholder="Preço" value={editablePlan.price} onChange={e => setEditablePlan({...editablePlan, price: parseFloat(e.target.value)})} className="w-full p-2 border rounded"/>
              <textarea placeholder="Descrição" value={editablePlan.description} onChange={e => setEditablePlan({...editablePlan, description: e.target.value})} className="w-full p-2 border rounded"/>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleSavePlan} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Slots */}
      {showSlotModal && editableSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editableSlot.id ? 'Editar' : 'Criar'} Slot</h3>
            <div className="space-y-4">
              <select value={editableSlot.day_of_week} onChange={e => setEditableSlot({...editableSlot, day_of_week: e.target.value})} className="w-full p-2 border rounded">
                {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => <option key={day} value={day}>{day}</option>)}
              </select>
              <input type="time" value={editableSlot.start_time} onChange={e => setEditableSlot({...editableSlot, start_time: e.target.value})} className="w-full p-2 border rounded"/>
              <input type="time" value={editableSlot.end_time} onChange={e => setEditableSlot({...editableSlot, end_time: e.target.value})} className="w-full p-2 border rounded"/>
              <label className="flex items-center">
                <input type="checkbox" checked={editableSlot.is_available} onChange={e => setEditableSlot({...editableSlot, is_available: e.target.checked})} className="mr-2"/>
                Disponível
              </label>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowSlotModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleSaveSlot} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
