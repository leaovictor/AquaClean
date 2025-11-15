import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
// ⚠️ SUBSTITUA PELO SEU CLIENTE SUPABASE REAL
import { supabase } from "@/lib/supabaseClient";

import { 
  Users, 
  Search, 
  Car, 
  Calendar,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext";

// Interface que define o formato de dados esperado da sua API
interface AdminCustomer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  vehicle_count: number;
  appointment_count: number;
  total_spent: number;
  last_appointment?: string;
  subscription_status?: string;
}

// URL base das suas Edge Functions (pode vir de uma variável de ambiente)
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export default function AdminCustomers() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<AdminCustomer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [editableCustomer, setEditableCustomer] = useState<AdminCustomer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // --- Sistema de Feedback (Toast) ---
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Efeito para limpar a mensagem após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setIsError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Função auxiliar para exibir o toast
  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  // --- Funções de CRUD ---
  const fetchCustomers = useCallback(async () => {
    setDataLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        showMessage("Sessão expirada. Faça login novamente.", true);
        navigate("/sign-in");
        return; 
      }

      const response = await fetch(`${FUNCTIONS_URL}/admin-customers`, { // Rota corrigida
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        const errorText = await response.text();
        showMessage(`Erro ao buscar clientes: ${errorText}`, true);
        setCustomers([]);
      }
    } catch (error) {
      showMessage("Erro de conexão ao buscar clientes.", true);
      setCustomers([]);
    } finally {
      setDataLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser, loading, navigate, fetchCustomers]);

  useEffect(() => {
    let filtered = customers;
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.first_name && customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  useEffect(() => {
    if (selectedCustomer) {
      setEditableCustomer({ ...selectedCustomer });
    }
  }, [selectedCustomer]);

  const handleSave = async () => {
    if (!editableCustomer) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        showMessage("Sessão expirada.", true);
        return;
      }
      const response = await fetch(`${FUNCTIONS_URL}/admin-customers/${editableCustomer.id}`, { // Rota corrigida
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify(editableCustomer),
      });

      if (response.ok) {
        const updatedCustomer = await response.json(); 
        setCustomers(prevCustomers => prevCustomers.map(c => 
          c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
        ));
        setShowModal(false);
        showMessage("Cliente atualizado com sucesso!");
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || "Falha ao atualizar cliente.", true);
      }
    } catch (error) {
      showMessage("Ocorreu um erro de rede ao atualizar o cliente.", true);
    }
  };

  const handleCreate = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        showMessage("Sessão expirada.", true);
        return;
      }
      const response = await fetch(`${FUNCTIONS_URL}/admin-customers`, { // Rota corrigida
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCustomer({
          email: '', password: '', first_name: '', last_name: '', 
          phone: '', address: '', city: '', state: '', zip_code: '',
        });
        await fetchCustomers(); // Atualiza a lista
        showMessage("Cliente criado com sucesso!");
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || "Falha ao criar cliente.", true);
      }
    } catch (error) {
      showMessage("Ocorreu um erro de rede ao criar o cliente.", true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação é irreversível.")) {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) {
          showMessage("Sessão expirada.", true);
          return;
        }
        const response = await fetch(`${FUNCTIONS_URL}/admin-customers/${id}`, { // Rota corrigida
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
          showMessage("Cliente excluído com sucesso!");
        } else {
          const errorData = await response.json();
          showMessage(errorData.error || "Falha ao excluir cliente.", true);
        }
      } catch (error) {
        showMessage("Ocorreu um erro de rede ao excluir o cliente.", true);
      }
    }
  };

  // --- Funções Auxiliares de Exibição ---
  const getCustomerName = (customer: AdminCustomer) => {
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
  };

  const getCustomerAddress = (customer: AdminCustomer) => {
    return [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ') || 'Sem endereço';
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Users className="w-12 h-12 animate-pulse text-gray-500" />
      </div>
    );
  }

  // --- Renderização ---
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      {/* Componente Toast */}
      {message && (
        <div
          className={`fixed top-24 right-5 p-4 rounded-xl shadow-2xl text-white flex items-center z-[100] transition-transform duration-300 transform ${isError ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isError ? <AlertCircle className="mr-3" /> : <CheckCircle className="mr-3" />}
          {message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... O restante do JSX permanece o mesmo ... */}
        {/* Cabeçalho e Botão Criar */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
            <p className="text-gray-600">Gerencie as contas dos clientes e visualize suas atividades.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Criar Cliente
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <p className="text-gray-600">Total de Clientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {customers.filter(c => c.subscription_status === 'active').length}
            </div>
            <p className="text-gray-600">Assinantes Ativos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              ${customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
            </div>
            <p className="text-gray-600">Receita Total</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {(customers.reduce((sum, c) => sum + c.total_spent, 0) / (customers.length || 1)).toFixed(0)}
            </div>
            <p className="text-gray-600">Gasto Médio por Cliente</p>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Clientes (READ) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atividade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assinatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getCustomerName(customer)}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        <div className="text-xs text-gray-400">
                          Membro desde {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {customer.phone ? (
                          <div className="flex items-center mb-1">
                            <Phone className="w-3 h-3 text-gray-400 mr-2" />
                            {customer.phone}
                          </div>
                        ) : null}
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-500">
                            {getCustomerAddress(customer)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Car className="w-3 h-3 text-gray-400 mr-2" />
                          {customer.vehicle_count} veículo{customer.vehicle_count !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center mb-1">
                          <Calendar className="w-3 h-3 text-gray-400 mr-2" />
                          {customer.appointment_count} agendamento{customer.appointment_count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${customer.total_spent} total gasto
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.subscription_status ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.subscription_status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.subscription_status}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Pagamento por lavagem</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>

        {/* ... Modais de Edição e Criação ... */}
        {/* Modal de Edição (UPDATE) */}
        {showModal && editableCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Editar Cliente
                </h3>
                <p className="text-gray-600">{editableCustomer.email}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações Pessoais</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium">Nome</label>
                      <input
                        type="text"
                        value={editableCustomer.first_name || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, first_name: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Sobrenome</label>
                      <input
                        type="text"
                        value={editableCustomer.last_name || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, last_name: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Telefone</label>
                      <input
                        type="text"
                        value={editableCustomer.phone || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, phone: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Endereço</label>
                      <input
                        type="text"
                        value={editableCustomer.address || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, address: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Cidade</label>
                      <input
                        type="text"
                        value={editableCustomer.city || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, city: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Estado</label>
                      <input
                        type="text"
                        value={editableCustomer.state || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, state: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">CEP</label>
                      <input
                        type="text"
                        value={editableCustomer.zip_code || ''}
                        onChange={(e) => setEditableCustomer({ ...editableCustomer, zip_code: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Atividade da Conta</h4>
                  <div className="space-y-3">
                    <p><span className="font-medium">Membro desde:</span> {new Date(editableCustomer.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Veículos:</span> {editableCustomer.vehicle_count}</p>
                    <p><span className="font-medium">Total de agendamentos:</span> {editableCustomer.appointment_count}</p>
                    <p><span className="font-medium">Total gasto:</span> ${editableCustomer.total_spent}</p>
                    {editableCustomer.last_appointment && (
                      <p><span className="font-medium">Último agendamento:</span> {new Date(editableCustomer.last_appointment).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação (CREATE) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Criar Novo Cliente
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Login e Senha</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium">Email</label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Senha</label>
                      <input
                        type="password"
                        value={newCustomer.password}
                        onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Nome</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium">Nome</label>
                      <input
                        type="text"
                        value={newCustomer.first_name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Sobrenome</label>
                      <input
                        type="text"
                        value={newCustomer.last_name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Informações de Contato e Endereço</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium">Telefone</label>
                      <input
                        type="text"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Endereço</label>
                      <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Cidade</label>
                      <input
                        type="text"
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">Estado</label>
                      <input
                        type="text"
                        value={newCustomer.state}
                        onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-medium">CEP</label>
                      <input
                        type="text"
                        value={newCustomer.zip_code}
                        onChange={(e) => setNewCustomer({ ...newCustomer, zip_code: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
