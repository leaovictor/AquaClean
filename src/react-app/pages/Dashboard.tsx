import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, Plus, ChevronRight, Trash2 } from "lucide-react";
import type { Appointment, Vehicle, UserProfile } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

export default function Dashboard() {
  const { currentUser, session, loading } = useAuth(); // Get session from context
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, loading, navigate]);

  const fetchDashboardData = async () => {
    if (!session) return; // Use session for check
    try {
      const token = session.access_token; // Get token from session
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      const [appointmentsRes, vehiclesRes, timeSlotsRes, userRes] = await Promise.all([
        fetch(`${functionsBaseUrl}/appointments`, { headers }),
        fetch(`${functionsBaseUrl}/vehicles`, { headers }),
        fetch(`${functionsBaseUrl}/time-slots`, { headers }),
        fetch(`${functionsBaseUrl}/users-me`, { headers })
      ]);

      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : [];
      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];
      const timeSlotsData = timeSlotsRes.ok ? await timeSlotsRes.json() : [];
      const userData = userRes.ok ? await userRes.json() : {};

      const enrichedAppointments = appointmentsData.map((apt: Appointment) => {
        const vehicle = vehiclesData.find((v: Vehicle) => v.id === apt.vehicle_id);
        const timeSlot = timeSlotsData.find((ts: any) => ts.id === apt.time_slot_id);
        return { ...apt, vehicle, timeSlot };
      });

      setAppointments(enrichedAppointments.slice(0, 5));
      setVehicles(vehiclesData);
      setProfile(userData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!session) return;
    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/cancel-appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        console.error("Error canceling appointment:", errorData.error);
      }
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="animate-pulse text-blue-600">
          <Car className="w-12 h-12" />
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const recentAppointments = appointments.filter(apt => apt.status === 'completed').slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.first_name || currentUser?.email}!
          </h1>
          <p className="text-gray-600">
            Manage your car wash appointments and keep your vehicle sparkling clean.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate("/booking")}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Book a Wash</h3>
            <p className="text-blue-100">Schedule your next car wash</p>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Car className="w-8 h-8 text-blue-600" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900">Manage Vehicles</h3>
            <p className="text-gray-600">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
          </button>

          <button
            onClick={() => navigate("/subscription")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 p-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-gray-900">Subscription</h3>
            <p className="text-gray-600">Manage your plan</p>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Upcoming Appointments
              </h2>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No upcoming appointments</p>
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Book Your First Wash
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {appointment.timeSlot?.date} at {appointment.timeSlot?.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {appointment.service_type}
                        </span>
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {appointment.vehicle?.make} {appointment.vehicle?.model} {appointment.vehicle?.year && `(${appointment.vehicle?.year})`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h2>

            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {appointment.service_type} wash completed
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.make} {appointment.model} - {appointment.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Overview */}
        {vehicles.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Vehicles</h2>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className="text-sm text-gray-600">{vehicle.color}</p>
                      )}
                    </div>
                  </div>
                  {vehicle.is_default && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}