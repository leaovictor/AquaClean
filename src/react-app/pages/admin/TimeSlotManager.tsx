import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { useAuth } from "@/react-app/AuthContext";


// --- TYPE DEFINITIONS ---

interface TimeSlot {
  id?: string; // Supabase/Postgres usa string (UUID)
  day_of_week: number; // 0 (Sunday) - 6 (Saturday)
  start_time: string;
  end_time: string;
  max_appointments: number;
  is_available: boolean;
  created_at?: string; // Supabase usa snake_case e timestamp
  updated_at?: string;
}

// --- TIME UTILITIES ---

// Helper para converter HH:mm para minutos desde a meia-noite
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper para converter minutos totais para HH:mm
const minutesToTime = (totalMinutes: number): string => {
    // Garante que o tempo está dentro de um dia (0-1439 minutos)
    const minutesInDay = totalMinutes % 1440;
    const h = Math.floor(minutesInDay / 60);
    const m = minutesInDay % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// --- MOCK/HELPER COMPONENTS AND HOOKS ---

// 3. Custom Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transform transition-all p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};


// --- TIME SLOT MODAL (Criação de Slot Único) ---

function TimeSlotModal({ slot, onClose, onSave }: { slot: TimeSlot | null, onClose: () => void, onSave: (slot: TimeSlot) => Promise<void> }) {
  const initialData = slot || {
    day_of_week: 1, // Segunda-feira
    start_time: '09:00',
    end_time: '17:00',
    max_appointments: 1,
    is_available: true
  };

  const initialFormData = {
    ...initialData,
    day_of_week: Number(initialData.day_of_week)
  }

  const [formData, setFormData] = useState<TimeSlot>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-40">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-xl bg-white transform transition-all duration-300 scale-100">
        <form onSubmit={handleSubmit}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Clock className="mr-2 h-6 w-6 text-indigo-600" /> {slot ? 'Editar Slot de Tempo' : 'Adicionar Novo Slot'}</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
              <select
                id="day_of_week"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {daysOfWeek.map((day, index) => <option key={index} value={index}>{index} - {day}</option>)}
              </select>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">Hora de Início</label>
                <input
                  id="start_time"
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">Hora de Fim</label>
                <input
                  id="end_time"
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="max_appointments" className="block text-sm font-medium text-gray-700 mb-1">Máx. Agendamentos Simultâneos</label>
              <input
                id="max_appointments"
                type="number"
                name="max_appointments"
                value={formData.max_appointments}
                onChange={handleChange}
                required
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="is_available"
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_available" className="ml-2 block text-sm font-medium text-gray-700">
                Está Disponível
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {slot ? 'Atualizar Slot' : 'Criar Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- BATCH TIME SLOT MODAL (Criação de Slots em Lote) ---

interface BatchForm {
    startDay: number;
    endDay: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    maxAppointments: number;
}

function BatchTimeSlotModal({ onClose, onSaveBatch }: { onClose: () => void, onSaveBatch: (slots: TimeSlot[]) => Promise<void> }) {
    const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

    const [formData, setFormData] = useState<BatchForm>({
        startDay: 1, // Segunda
        endDay: 5,   // Sexta
        startTime: '08:00',
        endTime: '18:00',
        durationMinutes: 60,
        maxAppointments: 1,
    });
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const generateSlots = (data: BatchForm): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const startMinutes = timeToMinutes(data.startTime);
        const endMinutes = timeToMinutes(data.endTime);

        if (endMinutes <= startMinutes || data.durationMinutes <= 0) {
            setStatusMessage("Erro: A hora final deve ser maior que a inicial, e a duração deve ser positiva.");
            return [];
        }

        if (data.endDay < data.startDay) {
             setStatusMessage("Erro: O dia de fim deve ser igual ou posterior ao dia de início.");
             return [];
        }

        for (let day = data.startDay; day <= data.endDay; day++) {
            let currentStartMinutes = startMinutes;

            while (currentStartMinutes + data.durationMinutes <= endMinutes) {
                const slotStartTime = minutesToTime(currentStartMinutes);
                const slotEndMinutes = currentStartMinutes + data.durationMinutes;
                const slotEndTime = minutesToTime(slotEndMinutes);

                slots.push({
                    day_of_week: day,
                    start_time: slotStartTime,
                    end_time: slotEndTime,
                    max_appointments: Number(data.maxAppointments),
                    is_available: true,
                });

                currentStartMinutes = slotEndMinutes;
            }
        }
        return slots;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage("Gerando slots...");
        const slots = generateSlots(formData);

        if (slots.length > 0) {
            setStatusMessage(`Salvando ${slots.length} slots...`);
            await onSaveBatch(slots);
            setStatusMessage(`Sucesso! ${slots.length} slots salvos.`);
            setTimeout(onClose, 1500); // Fechar após o sucesso
        } else if (!statusMessage || !statusMessage.startsWith("Erro")) {
            setStatusMessage("Nenhum slot foi gerado. Verifique os horários e duração.");
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-40">
            <div className="relative mx-auto p-6 border w-full max-w-lg shadow-2xl rounded-xl bg-white transform transition-all duration-300 scale-100">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Calendar className="mr-2 h-6 w-6 text-green-600" /> Adicionar Slots em Lote</h3>

                    {statusMessage && (
                        <div className={`p-3 mb-4 rounded-lg text-sm ${statusMessage.startsWith("Erro") ? 'bg-red-100 text-red-700' : statusMessage.startsWith("Sucesso") ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {statusMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="startDay" className="block text-sm font-medium text-gray-700 mb-1">Dia de Início</label>
                                <select
                                    id="startDay"
                                    name="startDay"
                                    value={formData.startDay}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {daysOfWeek.map((day, index) => <option key={index} value={index}>{index} - {day}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="endDay" className="block text-sm font-medium text-gray-700 mb-1">Dia de Fim</label>
                                <select
                                    id="endDay"
                                    name="endDay"
                                    value={formData.endDay}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {daysOfWeek.map((day, index) => <option key={index} value={index}>{index} - {day}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Hora de Início</label>
                                <input
                                    id="startTime"
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Hora de Fim</label>
                                <input
                                    id="endTime"
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-1">Duração do Slot (minutos)</label>
                                <input
                                    id="durationMinutes"
                                    type="number"
                                    name="durationMinutes"
                                    value={formData.durationMinutes}
                                    onChange={handleChange}
                                    required
                                    min="10"
                                    step="5"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="maxAppointments" className="block text-sm font-medium text-gray-700 mb-1">Máx. Agendamentos</label>
                                <input
                                    id="maxAppointments"
                                    type="number"
                                    name="maxAppointments"
                                    value={formData.maxAppointments}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-base font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Gerar e Salvar Slots
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- MAIN COMPONENT (TimeSlotManager) ---

const TimeSlotManager = () => {
  const { currentUser, loading } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [slotToDeleteId, setSlotToDeleteId] = useState<string | null>(null);

  const DAYS_OF_WEEK = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const TABLE_NAME = 'time_slots'; // Convenção Supabase snake_case

  // 1. Fetching Data with Supabase Realtime
  useEffect(() => {
    if (loading) return;

    const fetchTimeSlots = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('day_of_week')
            .order('start_time');

        if (error) {
            console.error("Erro ao buscar slots de tempo:", error);
            setTimeSlots([]);
        } else {
            setTimeSlots(data || []);
        }
        setIsLoading(false);
    };

    fetchTimeSlots();

    const channel = supabase.channel(`realtime:${TABLE_NAME}`);

    const subscription = channel
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME },
            (payload) => {
                console.log('Change received!', payload);
                // Re-fetch data to update the UI
                fetchTimeSlots();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [loading]);


  // 2. CRUD Operations (Slot Único)
  const handleSave = async (slot: TimeSlot) => {
    try {
      const { id, ...dataToSave } = slot;
      dataToSave.day_of_week = Number(dataToSave.day_of_week);
      dataToSave.max_appointments = Number(dataToSave.max_appointments);

      if (id) {
        // Editar existente: Supabase usa .update().eq('id', id)
        const { error } = await supabase
            .from(TABLE_NAME)
            .update(dataToSave)
            .eq('id', id);

        if (error) throw error;

      } else {
        // Adicionar novo: Supabase usa .insert(slot)
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert(dataToSave);

        if (error) throw error;
      }

      setShowSingleModal(false);
      setEditingSlot(null);
    } catch (error) {
      console.error("Erro ao salvar slot de tempo:", error);
    }
  };

  // 3. CRUD Operations (Lote)
  const handleBatchSave = async (slots: TimeSlot[]) => {
      if (slots.length === 0) return;

      try {
          // Supabase não precisa de "batches" como o Firestore; ele aceita arrays no .insert()
          const { error } = await supabase
              .from(TABLE_NAME)
              .insert(slots);

          if (error) throw error;

          setShowBatchModal(false);
      } catch (error) {
          console.error("Erro ao salvar slots em lote:", error);
          // Manter o modal aberto se houver erro para o usuário ver a mensagem de status
      }
  };


  const startDelete = (id: string) => {
    setSlotToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!slotToDeleteId) return;

    try {
      // Deletar: Supabase usa .delete().eq('id', id)
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', slotToDeleteId);

      if (error) throw error;
      console.log(`Slot ${slotToDeleteId} deletado com sucesso.`);
    } catch (error) {
      console.error("Erro ao deletar slot:", error);
    } finally {
      setIsConfirmOpen(false);
      setSlotToDeleteId(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-2" />
        <span className="text-gray-600">Carregando autenticação...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Disponibilidade de Agendamentos</h1>
            <p className="text-gray-600 text-lg">Gerencie os slots de tempo recorrentes semanais usando Supabase.</p>
            <p className="text-xs text-gray-400 mt-2">
                ID do Usuário (apenas referência): <span className="font-mono bg-gray-200 p-1 rounded-md">{currentUser?.id}</span>
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => {
                setEditingSlot(null);
                setShowSingleModal(true);
              }}
              className="inline-flex items-center justify-center rounded-xl border-0 bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-transform duration-150 hover:bg-indigo-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <Plus className="mr-2 h-5 w-5" />
              Slot Único
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center justify-center rounded-xl border-0 bg-green-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-transform duration-150 hover:bg-green-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Criar em Lote
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-3" />
              <span className="text-gray-500">Carregando slots...</span>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nenhum slot de disponibilidade configurado ainda. Clique em "Slot Único" ou "Criar em Lote" para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dia da Semana</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hora de Início</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hora de Fim</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Máx. Agendamentos</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {timeSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-indigo-50 transition duration-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{DAYS_OF_WEEK[slot.day_of_week]}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slot.start_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slot.end_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{slot.max_appointments}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {slot.is_available ? 'Disponível' : 'Indisponível'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-4">
                        <button
                          onClick={() => { setEditingSlot(slot); setShowSingleModal(true); }}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 transition"
                          title="Editar"
                        >
                            <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => startDelete(slot.id!)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                          title="Excluir"
                        >
                            <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showSingleModal && (
        <TimeSlotModal
          slot={editingSlot}
          onClose={() => { setShowSingleModal(false); setEditingSlot(null); }}
          onSave={handleSave}
        />
      )}

      {showBatchModal && (
        <BatchTimeSlotModal
          onClose={() => setShowBatchModal(false)}
          onSaveBatch={handleBatchSave}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir permanentemente este slot de tempo? Esta ação não pode ser desfeita."
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default TimeSlotManager;