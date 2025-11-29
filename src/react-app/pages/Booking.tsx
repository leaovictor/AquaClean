import { useNavigate } from "react-router";
import { useEffect, useState, useCallback } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, CheckCircle, AlertCircle, Loader2, Package, Info } from "lucide-react";
import type { Vehicle, TimeSlot, Appointment, Service, Product } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Usando a URL de produção para a Edge Function
const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

type MessageState = { type: 'success' | 'error'; text: string } | null;

const formatDate = (dateString: string) => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Booking() {
  const { currentUser, session, loading } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // ISO strings of booked start times

  // Selection States
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // UI States
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  const displayMessage = useCallback((msg: MessageState, duration = 5000) => {
    setMessage(msg);
    if (msg) {
      setTimeout(() => setMessage(null), duration);
    }
  }, []);

  const handleAuthError = useCallback((text: string) => {
    displayMessage({ type: 'error', text: text }, 3000);
    setTimeout(() => navigate("/"), 2500);
  }, [displayMessage, navigate]);

  const fetchData = useCallback(async () => {
    if (!session || !session.access_token) {
      handleAuthError("Sessão inválida ou expirada. Faça login novamente.");
      return;
    }

    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      // 1. Fetch Public Data (Services, Products) directly from Supabase
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('price');

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (servicesError) throw servicesError;
      if (productsError) throw productsError;

      setServices(servicesData || []);
      setProducts(productsData || []);
      if (servicesData && servicesData.length > 0) {
        setSelectedService(servicesData[0].id);
      }

      // 2. Fetch User Data (Profile for subscription)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', currentUser?.id)
        .single();

      if (!profileError && profileData) {
        setIsSubscriber(profileData.subscription_status === 'active');
      }

      // 3. Fetch Edge Function Data
      const processResponse = async (res: Response, item: string) => {
        if (res.status === 401) {
          handleAuthError(`Falha de autenticação ao carregar ${item}.`);
          return null;
        }
        if (res.ok) return res.json();
        const errorData = await res.json();
        console.error(`Error fetching ${item}:`, errorData);
        return null;
      };

      const [vehiclesRes, timeSlotsRes, appointmentsRes] = await Promise.all([
        fetch(`${functionsBaseUrl}/vehicles`, { headers }),
        fetch(`${functionsBaseUrl}/time-slots`, { headers }),
        fetch(`${functionsBaseUrl}/appointments`, { headers }),
      ]);

      const vehiclesData = await processResponse(vehiclesRes, 'vehicles');
      const timeSlotsData = await processResponse(timeSlotsRes, 'time slots');
      const appointmentsData = await processResponse(appointmentsRes, 'appointments');

      if (vehiclesData) {
        setVehicles(vehiclesData);
        const defaultVehicle = vehiclesData.find((v: Vehicle) => v.is_default);
        if (defaultVehicle) setSelectedVehicle(defaultVehicle.id);
        else if (vehiclesData.length > 0) setSelectedVehicle(vehiclesData[0].id);
      }

      if (timeSlotsData) {
        const now = new Date();
        const filteredTimeSlots = timeSlotsData.filter((slot: TimeSlot) => {
          const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
          return slotDateTime > now;
        });
        setTimeSlots(filteredTimeSlots);
      }

      if (appointmentsData) setAppointments(appointmentsData);

      // 4. Fetch Booked Slots (Public Availability) via RPC
      // Fetch for next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { data: bookedData, error: bookedError } = await supabase
        .rpc('get_booked_slots', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (bookedError) {
        console.error("Error fetching booked slots:", bookedError);
      } else {
        // Store as ISO strings for easy comparison
        setBookedSlots(bookedData.map((b: any) => new Date(b.start_time).toISOString()));
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      displayMessage({ type: 'error', text: 'Falha ao conectar-se ao servidor.' });
    } finally {
      setDataLoading(false);
    }
  }, [session, currentUser, handleAuthError, displayMessage]);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
    if (currentUser && session) {
      fetchData();
    }
  }, [currentUser, session, loading, navigate, fetchData]);

  // --- Logic Helpers ---

  const isSlotBooked = (date: string, time: string) => {
    // Construct ISO string for the slot (assuming local time input, convert to UTC or match how backend stores it)
    // The backend stores as UTC. The 'date' and 'time' from time-slots are usually local representation or plain strings.
    // We need to be careful with timezones.
    // Let's assume the 'date' and 'time' from time-slots are what we want to book.
    // The RPC returns UTC timestamps.
    // We need to compare the slot's intended start time (as ISO) with the booked slots.

    const slotDate = new Date(`${date}T${time}:00`);
    const slotISO = slotDate.toISOString();

    // Check if any booked slot matches this time
    // Note: This exact match might be tricky with seconds/milliseconds. 
    // Ideally we check if it falls within a range or use a tolerance.
    // But for now, let's try exact ISO string match (stripping milliseconds if needed).

    return bookedSlots.some(bookedISO => {
      // Compare up to minutes
      const b = new Date(bookedISO);
      return b.getTime() === slotDate.getTime();
    });
  };

  const calculateTotal = () => {
    const service = services.find(s => s.id === selectedService);
    const servicePrice = (isSubscriber && service) ? 0 : (service?.price || 0);

    const productsPrice = selectedProducts.reduce((total, pId) => {
      const product = products.find(p => p.id === pId);
      return total + (product?.price || 0);
    }, 0);

    return servicePrice + productsPrice;
  };

  const toggleProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleInitiateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!selectedVehicle || !selectedTimeSlot || !selectedService) {
      displayMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!session?.access_token) return;
    setSubmitting(true);

    const selectedDateTime = new Date(`${selectedTimeSlot?.date}T${selectedTimeSlot?.time}:00`);

    try {
      const response = await fetch(`${functionsBaseUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          time_slot_id: selectedTimeSlot?.id,
          start_time_utc: selectedDateTime.toISOString(),
          service_type: selectedService,
          products: selectedProducts,
          special_instructions: specialInstructions || undefined,
        }),
      });

      if (response.ok) {
        displayMessage({ type: 'success', text: 'Agendamento realizado!' });
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        const errorData = await response.json();
        displayMessage({ type: 'error', text: errorData.error || 'Erro ao agendar.' });
      }
    } catch (error) {
      displayMessage({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const isSubscriberUser = currentUser?.profile?.subscription_status === 'active';

  if (loading || dataLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isSubscriberUser ? "bg-slate-900" : "bg-gradient-to-br from-blue-50 to-cyan-100"}`}>
        <Loader2 className={`w-12 h-12 animate-spin ${isSubscriberUser ? "text-yellow-400" : "text-blue-600"}`} />
      </div>
    );
  }

  // Group slots
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  const selectedServiceDetails = services.find(s => s.id === selectedService);

  const theme = {
    bg: isSubscriber ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 to-cyan-100",
    text: isSubscriber ? "text-white" : "text-gray-900",
    subText: isSubscriber ? "text-gray-300" : "text-gray-600",
    card: isSubscriber ? "bg-slate-800 border-yellow-500/30 shadow-xl shadow-yellow-900/10" : "bg-white border-blue-100 shadow-sm",
    cardHover: isSubscriber ? "hover:border-yellow-500/50" : "hover:border-blue-300",
    buttonPrimary: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white",
    iconPrimary: isSubscriber ? "text-yellow-400" : "text-blue-600",
    selectionBorder: isSubscriber ? "border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500" : "border-blue-600 bg-blue-50 ring-1 ring-blue-600",
    selectionText: isSubscriber ? "text-yellow-400" : "text-blue-600",
    checkbox: isSubscriber ? "text-yellow-500" : "text-blue-600",
    slotActive: isSubscriber ? "bg-yellow-500 text-slate-900 border-yellow-500" : "bg-blue-600 text-white border-blue-600",
    slotInactive: isSubscriber ? "hover:border-yellow-500/50 hover:bg-yellow-500/10" : "hover:border-blue-400 hover:bg-blue-50",
    modalBg: isSubscriber ? "bg-slate-800 text-white" : "bg-white text-gray-900",
    modalBorder: isSubscriber ? "border-slate-700" : "border-gray-200"
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <Navigation />

      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>Agendar Lavagem</h1>
        <p className={`mb-8 ${theme.subText}`}>Personalize seu serviço e escolha o melhor horário.</p>

        <form onSubmit={handleInitiateBooking} className="space-y-6">

          {/* 1. Vehicle */}
          <div className={`p-6 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme.text}`}><Car className={`w-5 h-5 mr-2 ${theme.iconPrimary}`} /> Veículo</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {vehicles.map(v => (
                <button key={v.id} type="button"
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`p-4 border rounded-xl text-left transition-all ${selectedVehicle === v.id ? theme.selectionBorder : `${isSubscriber ? 'border-slate-600' : 'border-gray-200'} ${theme.cardHover}`}`}
                >
                  <p className={`font-bold ${theme.text}`}>{v.make} {v.model}</p>
                  <p className={`text-sm ${theme.subText}`}>{v.plate}</p>
                </button>
              ))}
              {vehicles.length === 0 && <p className={theme.subText}>Nenhum veículo cadastrado.</p>}
            </div>
          </div>

          {/* 2. Service */}
          <div className={`p-6 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme.text}`}><CheckCircle className={`w-5 h-5 mr-2 ${theme.iconPrimary}`} /> Serviço</h2>
            <div className="grid gap-4">
              {services.map(s => (
                <button key={s.id} type="button"
                  onClick={() => setSelectedService(s.id)}
                  className={`p-4 border rounded-xl text-left transition-all flex justify-between items-center ${selectedService === s.id ? theme.selectionBorder : `${isSubscriber ? 'border-slate-600' : 'border-gray-200'} ${theme.cardHover}`}`}
                >
                  <div>
                    <h3 className={`font-bold ${theme.text}`}>{s.name}</h3>
                    <p className={`text-sm ${theme.subText}`}>{s.description}</p>
                    <p className={`text-xs mt-1 ${theme.iconPrimary}`}>{s.duration_minutes} min</p>
                  </div>
                  <div className="text-right">
                    {isSubscriber ? (
                      <div>
                        <span className="text-gray-500 line-through text-sm">R$ {s.price}</span>
                        <span className="block text-green-500 font-bold">Grátis</span>
                      </div>
                    ) : (
                      <span className={`font-bold text-lg ${theme.text}`}>R$ {s.price}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Products */}
          {products.length > 0 && (
            <div className={`p-6 rounded-2xl border ${theme.card}`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme.text}`}><Package className={`w-5 h-5 mr-2 ${theme.iconPrimary}`} /> Adicionais</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {products.map(p => (
                  <label key={p.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedProducts.includes(p.id) ? theme.selectionBorder : `${isSubscriber ? 'border-slate-600' : 'border-gray-200'} ${theme.cardHover}`}`}>
                    <input type="checkbox" className={`w-5 h-5 rounded ${theme.checkbox}`}
                      checked={selectedProducts.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme.text}`}>{p.name}</span>
                        <span className={`font-bold ${theme.text}`}>+ R$ {p.price}</span>
                      </div>
                      <p className={`text-xs ${theme.subText}`}>{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4. Time Slots */}
          <div className={`p-6 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme.text}`}><Clock className={`w-5 h-5 mr-2 ${theme.iconPrimary}`} /> Data e Hora</h2>
            {Object.keys(groupedTimeSlots).length === 0 ? (
              <p className={`text-center py-4 ${theme.subText}`}>Nenhum horário disponível.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className={`font-medium mb-3 border-b pb-1 ${theme.text} ${isSubscriber ? 'border-slate-700' : 'border-gray-200'}`}>{formatDate(date)}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {slots.map(slot => {
                        const booked = isSlotBooked(slot.date, slot.time);
                        return (
                          <button key={slot.id} type="button"
                            disabled={booked}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-2 border rounded-lg text-center text-sm transition-all ${booked
                              ? `cursor-not-allowed ${isSubscriber ? 'bg-slate-800 text-slate-600 border-slate-700' : 'bg-gray-100 text-gray-400 border-gray-200'}`
                              : selectedTimeSlot?.id === slot.id
                                ? theme.slotActive
                                : `${isSubscriber ? 'border-slate-600 text-gray-300' : 'border-gray-200 text-gray-700'} ${theme.slotInactive}`
                              }`}
                          >
                            {slot.time}
                            {booked && <span className="block text-[10px] text-red-500">Ocupado</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Summary & Submit */}
          <div className={`p-6 rounded-2xl shadow-lg border sticky bottom-4 ${theme.card}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className={`text-sm ${theme.subText}`}>Total Estimado</p>
                <p className={`text-3xl font-bold ${theme.text}`}>R$ {calculateTotal().toFixed(2)}</p>
              </div>
              <button type="submit" disabled={submitting} className={`px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-lg ${theme.buttonPrimary}`}>
                {submitting ? 'Processando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${theme.modalBg}`}>
            <h2 className="text-2xl font-bold mb-4">Confirmar Detalhes</h2>
            <div className="space-y-3 mb-6">
              <div className={`flex justify-between border-b pb-2 ${theme.modalBorder}`}>
                <span className={theme.subText}>Serviço</span>
                <span className="font-medium">{selectedServiceDetails?.name}</span>
              </div>
              {selectedProducts.length > 0 && (
                <div className={`flex justify-between border-b pb-2 ${theme.modalBorder}`}>
                  <span className={theme.subText}>Adicionais</span>
                  <span className="font-medium">{selectedProducts.length} selecionado(s)</span>
                </div>
              )}
              <div className={`flex justify-between border-b pb-2 ${theme.modalBorder}`}>
                <span className={theme.subText}>Data</span>
                <span className="font-medium">{selectedTimeSlot && formatDate(selectedTimeSlot.date)}</span>
              </div>
              <div className={`flex justify-between border-b pb-2 ${theme.modalBorder}`}>
                <span className={theme.subText}>Horário</span>
                <span className="font-medium">{selectedTimeSlot?.time}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-lg font-bold">Total</span>
                <span className={`text-lg font-bold ${theme.iconPrimary}`}>R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmation(false)} className={`flex-1 py-3 border rounded-xl font-medium ${isSubscriber ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>Voltar</button>
              <button onClick={handleConfirmBooking} className={`flex-1 py-3 rounded-xl font-bold shadow-lg ${theme.buttonPrimary}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}