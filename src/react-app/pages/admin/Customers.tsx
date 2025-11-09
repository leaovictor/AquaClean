import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { 
  Users, 
  Search, 
  Car, 
  Calendar,
  Eye,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useAuth } from "@/react-app/AuthContext"; // New Firebase AuthContext

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
  const { currentUser, loading } = useAuth(); // Use currentUser and loading from new context
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<AdminCustomer[]>([]);
  const [dataLoading, setDataLoading] = useState(true); // Renamed to avoid conflict with auth loading
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!currentUser && !loading) { // Use currentUser and loading
      navigate("/");
      return;
    }

    if (currentUser) { // Use currentUser
      fetchCustomers();
    }
  }, [currentUser, loading, navigate]); // Update dependencies

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setDataLoading(false); // Use dataLoading
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  if (loading || dataLoading) { // Use combined loading states
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          <Users className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and view their activity.</p>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <p className="text-gray-600">Total Customers</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {customers.filter(c => c.subscription_status === 'active').length}
            </div>
            <p className="text-gray-600">Active Subscribers</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              ${customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
            </div>
            <p className="text-gray-600">Total Revenue</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length || 0).toFixed(0)}
            </div>
            <p className="text-gray-600">Avg. Spent per Customer</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          Joined {new Date(customer.created_at).toLocaleDateString()}
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
                          {customer.vehicle_count} vehicle{customer.vehicle_count !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center mb-1">
                          <Calendar className="w-3 h-3 text-gray-400 mr-2" />
                          {customer.appointment_count} appointment{customer.appointment_count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${customer.total_spent} total spent
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
                        <span className="text-sm text-gray-500">Pay per wash</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
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
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>

        {/* Customer Detail Modal */}
        {showModal && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-2xl bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Customer Details
                </h3>
                <p className="text-gray-600">{selectedCustomer.email}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-3">
                    <p><span className="font-medium">Name:</span> {getCustomerName(selectedCustomer)}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                    )}
                    <div>
                      <span className="font-medium">Address:</span>
                      <div className="text-gray-600 text-sm mt-1">
                        {getCustomerAddress(selectedCustomer)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Account Activity</h4>
                  <div className="space-y-3">
                    <p><span className="font-medium">Member since:</span> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                    <p><span className="font-medium">Vehicles:</span> {selectedCustomer.vehicle_count}</p>
                    <p><span className="font-medium">Total appointments:</span> {selectedCustomer.appointment_count}</p>
                    <p><span className="font-medium">Total spent:</span> ${selectedCustomer.total_spent}</p>
                    {selectedCustomer.last_appointment && (
                      <p><span className="font-medium">Last appointment:</span> {new Date(selectedCustomer.last_appointment).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedCustomer.subscription_status && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Subscription</h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedCustomer.subscription_status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCustomer.subscription_status}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`mailto:${selectedCustomer.email}`)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Customer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
