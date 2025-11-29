
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { useAuth } from "@/react-app/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    Layers,
    CreditCard,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock
} from "lucide-react";

// Types
interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    is_active: boolean;
}

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

interface TimeSlot {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_active: boolean;
}

export default function AdminSettings() {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'services' | 'subscriptions' | 'availability' | 'products'>('services');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data States
    const [services, setServices] = useState<Service[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Modal States
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceForm, setServiceForm] = useState<Partial<Service>>({
        name: '', description: '', price: 0, duration_minutes: 60, is_active: true
    });

    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [planForm, setPlanForm] = useState<Partial<SubscriptionPlan>>({
        name: '', description: '', price: 0, duration_months: 1, washes_per_month: 4, features: [''], is_active: true
    });

    const [showSlotModal, setShowSlotModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
    const [slotForm, setSlotForm] = useState<Partial<TimeSlot>>({
        day_of_week: 'Segunda-feira', start_time: '09:00', end_time: '18:00', is_available: true
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({
        name: '', description: '', price: 0, image_url: '', is_active: true
    });

    useEffect(() => {
        if (!currentUser && !loading) {
            navigate("/");
        } else if (currentUser) {
            fetchData();
        }
    }, [currentUser, loading, navigate, activeTab]);

    const showFeedback = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const fetchData = async () => {
        setDataLoading(true);
        try {
            if (activeTab === 'services') {
                const { data, error } = await supabase.from('services').select('*').order('id');
                if (error) throw error;
                setServices(data || []);
            } else if (activeTab === 'subscriptions') {
                const { data, error } = await supabase.from('subscription_plans').select('*').order('id');
                if (error) throw error;
                setPlans(data || []);
            } else if (activeTab === 'availability') {
                const { data, error } = await supabase.from('time_slots').select('*').order('id');
                if (error) throw error;
                setSlots(data || []);
            } else if (activeTab === 'products') {
                const { data, error } = await supabase.from('products').select('*').order('id');
                if (error) throw error;
                setProducts(data || []);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            showFeedback('error', 'Erro ao carregar dados: ' + error.message);
        } finally {
            setDataLoading(false);
        }
    };

    // --- Services Handlers ---
    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                const { error } = await supabase.from('services').update(serviceForm).eq('id', editingService.id);
                if (error) throw error;
                showFeedback('success', 'Serviço atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('services').insert([serviceForm]);
                if (error) throw error;
                showFeedback('success', 'Serviço criado com sucesso!');
            }
            setShowServiceModal(false);
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao salvar serviço: ' + error.message);
        }
    };

    const handleDeleteService = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            showFeedback('success', 'Serviço excluído com sucesso!');
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao excluir serviço: ' + error.message);
        }
    };

    // --- Plans Handlers ---
    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Filter empty features
            const features = (planForm.features || []).filter(f => f.trim() !== '');
            const dataToSave = { ...planForm, features };

            if (editingPlan) {
                const { error } = await supabase.from('subscription_plans').update(dataToSave).eq('id', editingPlan.id);
                if (error) throw error;
                showFeedback('success', 'Plano atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('subscription_plans').insert([dataToSave]);
                if (error) throw error;
                showFeedback('success', 'Plano criado com sucesso!');
            }
            setShowPlanModal(false);
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao salvar plano: ' + error.message);
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return;
        try {
            const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
            if (error) throw error;
            showFeedback('success', 'Plano excluído com sucesso!');
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao excluir plano: ' + error.message);
        }
    };

    // --- Slots Handlers ---
    const handleSaveSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSlot) {
                const { error } = await supabase.from('time_slots').update(slotForm).eq('id', editingSlot.id);
                if (error) throw error;
                showFeedback('success', 'Slot atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('time_slots').insert([slotForm]);
                if (error) throw error;
                showFeedback('success', 'Slot criado com sucesso!');
            }
            setShowSlotModal(false);
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao salvar slot: ' + error.message);
        }
    };

    const handleDeleteSlot = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este slot?')) return;
        try {
            const { error } = await supabase.from('time_slots').delete().eq('id', id);
            if (error) throw error;
            showFeedback('success', 'Slot excluído com sucesso!');
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao excluir slot: ' + error.message);
        }
    };

    // --- Products Handlers ---
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                const { error } = await supabase.from('products').update(productForm).eq('id', editingProduct.id);
                if (error) throw error;
                showFeedback('success', 'Produto atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('products').insert([productForm]);
                if (error) throw error;
                showFeedback('success', 'Produto criado com sucesso!');
            }
            setShowProductModal(false);
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao salvar produto: ' + error.message);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            showFeedback('success', 'Produto excluído com sucesso!');
            fetchData();
        } catch (error: any) {
            showFeedback('error', 'Erro ao excluir produto: ' + error.message);
        }
    };


    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Carregando...</div></div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNavigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
                    <p className="text-gray-600">Gerencie serviços, planos de assinatura e disponibilidade.</p>
                </div>

                {message && (
                    <div className={`mb - 6 p - 4 rounded - xl flex items - center space - x - 2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'} `}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex items - center px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'services' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'} `}
                    >
                        <Layers className="w-4 h-4 mr-2" />
                        Serviços
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={`flex items - center px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'subscriptions' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'} `}
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Assinaturas
                    </button>
                    <button
                        onClick={() => setActiveTab('availability')}
                        className={`flex items - center px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'availability' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'} `}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Disponibilidade
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items - center px - 4 py - 2 rounded - lg text - sm font - medium transition - colors ${activeTab === 'products' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'} `}
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Produtos
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">

                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Serviços de Lavagem</h2>
                                <button
                                    onClick={() => {
                                        setEditingService(null);
                                        setServiceForm({ name: '', description: '', price: 0, duration_minutes: 60, is_active: true });
                                        setShowServiceModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Novo Serviço
                                </button>
                            </div>

                            {dataLoading ? <div className="text-center py-8">Carregando...</div> : (
                                <div className="grid gap-4">
                                    {services.map(service => (
                                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                                <p className="text-sm text-gray-500">{service.description}</p>
                                                <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                                                    <span>R$ {service.price}</span>
                                                    <span>{service.duration_minutes} min</span>
                                                    <span className={`px - 2 py - 0.5 rounded - full text - xs ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} `}>
                                                        {service.is_active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => { setEditingService(service); setServiceForm(service); setShowServiceModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteService(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {services.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum serviço cadastrado.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUBSCRIPTIONS TAB */}
                    {activeTab === 'subscriptions' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Planos de Assinatura</h2>
                                <button
                                    onClick={() => {
                                        setEditingPlan(null);
                                        setPlanForm({ name: '', description: '', price: 0, duration_months: 1, washes_per_month: 4, features: [''], is_active: true });
                                        setShowPlanModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Novo Plano
                                </button>
                            </div>

                            {dataLoading ? <div className="text-center py-8">Carregando...</div> : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {plans.map(plan => (
                                        <div key={plan.id} className={`border rounded - xl p - 6 ${plan.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'} `}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-lg">{plan.name}</h3>
                                                <span className="font-bold text-xl">R$ {plan.price}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                                            <ul className="text-sm space-y-2 mb-6">
                                                <li className="flex items-center"><CheckCircle className="w-3 h-3 mr-2 text-green-500" /> {plan.washes_per_month} lavagens/mês</li>
                                                <li className="flex items-center"><Clock className="w-3 h-3 mr-2 text-blue-500" /> Duração: {plan.duration_months} meses</li>
                                                {plan.features?.map((f, i) => (
                                                    <li key={i} className="flex items-center text-gray-500"><CheckCircle className="w-3 h-3 mr-2 text-gray-400" /> {f}</li>
                                                ))}
                                            </ul>
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => { setEditingPlan(plan); setPlanForm(plan); setShowPlanModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {plans.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">Nenhum plano cadastrado.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* AVAILABILITY TAB */}
                    {activeTab === 'availability' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Slots de Horário</h2>
                                <button
                                    onClick={() => {
                                        setEditingSlot(null);
                                        setSlotForm({ day_of_week: 'Segunda-feira', start_time: '09:00', end_time: '18:00', is_available: true });
                                        setShowSlotModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Novo Slot
                                </button>
                            </div>

                            {dataLoading ? <div className="text-center py-8">Carregando...</div> : (
                                <div className="grid gap-4">
                                    {slots.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{slot.day_of_week}</h3>
                                                <p className="text-sm text-gray-500">{slot.start_time} - {slot.end_time}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className={`px - 2 py - 0.5 rounded - full text - xs ${slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} `}>
                                                    {slot.is_available ? 'Disponível' : 'Indisponível'}
                                                </span>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => { setEditingSlot(slot); setSlotForm(slot); setShowSlotModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {slots.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum slot cadastrado.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Produtos Adicionais</h2>
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setProductForm({ name: '', description: '', price: 0, image_url: '', is_active: true });
                                        setShowProductModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Novo Produto
                                </button>
                            </div>

                            {dataLoading ? <div className="text-center py-8">Carregando...</div> : (
                                <div className="grid gap-4">
                                    {products.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                                            <div className="flex items-center space-x-4">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                    <p className="text-sm text-gray-500">{product.description}</p>
                                                    <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                                                        <span>R$ {product.price}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {product.is_active ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {products.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum produto cadastrado.</p>}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Service Modal */}
            {showServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                        <form onSubmit={handleSaveService} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                                <input required placeholder="Ex: Lavagem Completa" className="w-full border rounded-xl p-2" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea placeholder="Descreva o que está incluso no serviço..." className="w-full border rounded-xl p-2" value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                    <input required type="number" placeholder="0.00" className="w-full border rounded-xl p-2" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                                    <input required type="number" placeholder="60" className="w-full border rounded-xl p-2" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} />
                                </div>
                            </div>
                            <label className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={serviceForm.is_active} onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Serviço Ativo</span>
                            </label>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">Salvar Serviço</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                        <form onSubmit={handleSavePlan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
                                <input required placeholder="Ex: Plano Básico" className="w-full border rounded-xl p-2" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea placeholder="Descreva os benefícios do plano..." className="w-full border rounded-xl p-2" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                    <input required type="number" placeholder="0.00" className="w-full border rounded-xl p-2" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lavagens/mês</label>
                                    <input required type="number" placeholder="4" className="w-full border rounded-xl p-2" value={planForm.washes_per_month} onChange={e => setPlanForm({ ...planForm, washes_per_month: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duração do Ciclo</label>
                                <select className="w-full border rounded-xl p-2" value={planForm.duration_months} onChange={e => setPlanForm({ ...planForm, duration_months: Number(e.target.value) })}>
                                    <option value={1}>Mensal (1 mês)</option>
                                    <option value={3}>Trimestral (3 meses)</option>
                                    <option value={6}>Semestral (6 meses)</option>
                                    <option value={12}>Anual (12 meses)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recursos e Benefícios</label>
                                {planForm.features?.map((feature, idx) => (
                                    <div key={idx} className="flex mb-2">
                                        <input className="flex-1 border rounded-xl p-2 mr-2" placeholder="Ex: Cera grátis" value={feature} onChange={e => {
                                            const newFeatures = [...(planForm.features || [])];
                                            newFeatures[idx] = e.target.value;
                                            setPlanForm({ ...planForm, features: newFeatures });
                                        }} />
                                        <button type="button" onClick={() => {
                                            const newFeatures = (planForm.features || []).filter((_, i) => i !== idx);
                                            setPlanForm({ ...planForm, features: newFeatures });
                                        }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setPlanForm({ ...planForm, features: [...(planForm.features || []), ''] })} className="text-blue-600 text-sm font-medium hover:underline flex items-center">
                                    <Plus className="w-3 h-3 mr-1" /> Adicionar Recurso
                                </button>
                            </div>

                            <label className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={planForm.is_active} onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Plano Ativo</span>
                            </label>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowPlanModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">Salvar Plano</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Slot Modal */}
            {showSlotModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{editingSlot ? 'Editar Slot' : 'Novo Slot'}</h3>
                        <form onSubmit={handleSaveSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                                <select className="w-full border rounded-xl p-2" value={slotForm.day_of_week} onChange={e => setSlotForm({ ...slotForm, day_of_week: e.target.value })}>
                                    {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                    <input required type="time" className="w-full border rounded-xl p-2" value={slotForm.start_time} onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                                    <input required type="time" className="w-full border rounded-xl p-2" value={slotForm.end_time} onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })} />
                                </div>
                            </div>
                            <label className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={slotForm.is_available} onChange={e => setSlotForm({ ...slotForm, is_available: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Disponível para Agendamento</span>
                            </label>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowSlotModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">Salvar Slot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Product Modal */}
            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                                <input required placeholder="Ex: Cera Premium" className="w-full border rounded-xl p-2" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea placeholder="Descrição do produto..." className="w-full border rounded-xl p-2" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                <input required type="number" placeholder="0.00" className="w-full border rounded-xl p-2" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Opcional)</label>
                                <input placeholder="https://..." className="w-full border rounded-xl p-2" value={productForm.image_url || ''} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} />
                            </div>
                            <label className="flex items-center space-x-2 p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
                            </label>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm">Salvar Produto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
