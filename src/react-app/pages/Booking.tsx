import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { Calendar, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Vehicle, TimeSlot } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext";

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

export default function Booking() {
  const { currentUser, session, loading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedService, setSelectedService] = useState<string>("basic");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, loading, navigate]);

  const fetchData = async () => {
    if (!session) return;
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      const today = new Date().toISOString().split('T')[0];
      const limitDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days in the future

      const [vehiclesRes, timeSlotsRes] = await Promise.all([
        fetch(`${functionsBaseUrl}/vehicles`, { headers }),
        fetch(`${functionsBaseUrl}/time-slots?start_date=${today}&end_date=${limitDate}`, { headers })
      ]);

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData);
        
        const defaultVehicle = vehiclesData.find((v: Vehicle) => v.is_default);
        if (defaultVehicle) {
          setSelectedVehicle(defaultVehicle.id);
        } else if (vehiclesData.length > 0) {
          setSelectedVehicle(vehiclesData[0].id);
        }
      }

      if (timeSlotsRes.ok) {
        const timeSlotsData = await timeSlotsRes.json();
        setTimeSlots(timeSlotsData);
      } else {
        const errorData = await timeSlotsRes.json();
        console.error("Error fetching time slots:", timeSlotsRes.status, errorData);
        setMessage({ type: 'error', text: errorData.error || 'Failed to load time slots' });
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: 'error', text: 'Failed to load booking data' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle || !selectedTimeSlot) {
      setMessage({ type: 'error', text: 'Please select a vehicle and time slot' });
      return;
    }
    if (!session) {
      setMessage({ type: 'error', text: 'You must be logged in to book an appointment.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle,
          start_time: selectedTimeSlot.start_time,
          end_time: selectedTimeSlot.end_time,
          service_type: selectedService,
          special_instructions: specialInstructions || undefined,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Appointment booked successfully!' });
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to book appointment' });
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setMessage({ type: 'error', text: 'Failed to book appointment' });
    } finally {
      setSubmitting(false);
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

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Vehicles Found
            </h2>
            <p className="text-gray-600 mb-6">
              You need to add a vehicle before booking an appointment.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Add Vehicle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const serviceTypes = [
    {
      id: "basic",
      name: "Basic Wash",
      description: "Exterior wash with rinse and dry",
      price: "$15",
      duration: "20 min"
    },
    {
      id: "premium",
      name: "Premium Wash",
      description: "Interior and exterior cleaning with tire shine",
      price: "$25",
      duration: "35 min"
    },
    {
      id: "deluxe",
      name: "Deluxe Detail",
      description: "Complete detailing with wax and interior deep clean",
      price: "$45",
      duration: "60 min"
    }
  ];

  // Group time slots by date
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    const dateKey = new Date(slot.start_time).toISOString().split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Car Wash</h1>
          <p className="text-gray-600">Select your vehicle, service, and preferred time slot.</p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Vehicle</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedVehicle === vehicle.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
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
                      {vehicle.is_default && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Service</h2>
            <div className="grid gap-4">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService(service.id)}
                  className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedService === service.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                      <p className="text-blue-600 font-medium text-sm mt-2">{service.duration}</p>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date & Time</h2>
            
            {Object.keys(groupedTimeSlots).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No available time slots</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="font-medium text-gray-900 mb-3">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.start_time} // Use start_time as key
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)} // Set the whole slot object
                          className={`p-3 border rounded-xl text-center transition-all duration-200 ${
                            selectedTimeSlot?.start_time === slot.start_time
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">
                              {new Date(slot.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or areas that need extra attention..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <button
              type="submit"
              disabled={submitting || !selectedVehicle || !selectedTimeSlot}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
