import { useNavigate } from "react-router";
import { useEffect, useState, useCallback } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // IMPORT PARA EXEMPLO

// ⚠️ SUBSTITUA PELO SEU CLIENTE SUPABASE CONFIGURADO 
// import { supabase } from '@/caminho/para/seu/supabaseClient'; 
const supabase = createClient(
  'SUA_URL_SUPABASE', // Substitua
  'SUA_CHAVE_ANON'  // Substitua
);

import { 
  Users, 
  Search, 
  Car, 
  Calendar,
  Pencil,
  Trash2,
  Phone,
  MapPin
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext"; // Usado para obter currentUser

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

export default function AdminCustomers() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<AdminCustomer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [editableCustomer, setEditableCustomer] = useState<AdminCustomer | null>(null);
  const [showModal, setShowModal] = useState(false); // Modal de Edição (UPDATE)
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal de Criação (CREATE)
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

  // --- Funções de CRUD: READ (CORRIGIDA PARA INJETAR O TOKEN) ---
  const fetchCustomers = useCallback(async () => {
    setDataLoading(true);
    try {
      // 1. Obtém o token JWT da sessão do usuário logado
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.error("Failed to fetch customers: No access token found. User might need to re-login.");
        return; 
      }

      // 2. Faz a chamada HTTP, injetando o token no cabeçalho Authorization
      const response = await fetch("/api/admin/customers", {
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
        console.error("Failed to fetch customers:", response.status, errorText);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // --- Efeitos e Fetch de Dados ---
  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    if (currentUser) {
      // Chama fetchCustomers, que agora injeta o token
      fetchCustomers();
    }
  }, [currentUser, loading, navigate, fetchCustomers]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  useEffect(() => {
    if (selectedCustomer) {
      setEditableCustomer({ ...selectedCustomer });
    }
  }, [selectedCustomer]);

  // --- Funções de CRUD: UPDATE (AJUSTADA PARA ATUALIZAÇÃO OTIMIZADA) ---

  const handleSave = async () => {
    if (!editableCustomer) return;

    try {
      // 1. Obtém o token para autenticação
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/admin/customers/${editableCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify(editableCustomer),
      });

      if (response.ok) {
        const updatedCustomer = await response.json(); 
        
        // Atualiza o estado: Substitui o objeto antigo pelo atualizado
        setCustomers(prevCustomers => prevCustomers.map(c => 
          c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
        ));
        
        setShowModal(false);
      } else {
        console.error("Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  // --- Funções de CRUD: CREATE (AJUSTADA PARA REFAZER FETCH) ---

  const handleCreate = async () => {
    try {
      // 1. Obtém o token para autenticação
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/admin/customers', {
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
        
        // Refaz a busca para incluir o novo cliente com todos os dados agregados
        await fetchCustomers();

      } else {
        console.error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  // --- Funções de CRUD: DELETE (AJUSTADA PARA FILTRAR O ESTADO) ---

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      try {
        // 1. Obtém o token para autenticação
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        const response = await fetch(`/api/admin/customers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`, 
          },
        });

        if (response.ok) {
          // Remove o cliente deletado da lista
          setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
        } else {
          console.error("Failed to delete customer");
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  // --- Funções Auxiliares de Exibição ---

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.first_name && customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  };

  const getCustomerName = (customer: AdminCustomer) => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return customer.email;
  };

  const getCustomerAddress = (customer: AdminCustomer) => {
    const parts = [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Sem endereço';
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          <Users className="w-12 h-12" />
        </div>
      </div>
    );
  }

  // --- Renderização Principal ---
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length || 0).toFixed(0)}
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