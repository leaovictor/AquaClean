import { useEffect, useState } from "react";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { Plus, Edit, Trash, Clock, Calendar } from "lucide-react";

interface TimeSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_appointments: number;
  is_available: boolean;
}

export default function Availability() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch("/api/admin-time-slots");
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (slot: TimeSlot) => {
    const method = slot.id ? "PUT" : "POST";
    const url = slot.id ? `/api/admin-time-slots` : "/api/admin-time-slots";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });

      if (response.ok) {
        fetchTimeSlots();
        setShowModal(false);
        setEditingSlot(null);
      }
    } catch (error) {
      console.error("Error saving time slot:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      try {
        const response = await fetch(`/api/admin-time-slots`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          fetchTimeSlots();
        }
      } catch (error) {
        console.error("Error deleting time slot:", error);
      }
    }
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
            <p className="text-gray-600">Manage weekly recurring time slots for appointments.</p>
          </div>
          <button
            onClick={() => {
              setEditingSlot(null);
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Slot
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day of Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Appointments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{daysOfWeek[slot.day_of_week]}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{slot.start_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{slot.end_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{slot.max_appointments}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {slot.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => { setEditingSlot(slot); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit className="h-5 w-5" /></button>
                      <button onClick={() => handleDelete(slot.id)} className="text-red-600 hover:text-red-900 ml-4"><Trash className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <TimeSlotModal
          slot={editingSlot}
          onClose={() => { setShowModal(false); setEditingSlot(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TimeSlotModal({ slot, onClose, onSave }) {
  const [formData, setFormData] = useState(slot || {
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    max_appointments: 1,
    is_available: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg leading-6 font-medium text-gray-900">{slot ? 'Edit' : 'Add'} Time Slot</h3>
          <div className="mt-2">
            <label>Day of Week</label>
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="w-full p-2 border rounded">
              {daysOfWeek.map((day, index) => <option key={index} value={index}>{day}</option>)}
            </select>
          </div>
          <div className="mt-2">
            <label>Start Time</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mt-2">
            <label>End Time</label>
            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mt-2">
            <label>Max Appointments</label>
            <input type="number" name="max_appointments" value={formData.max_appointments} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
              <span className="ml-2">Is Available</span>
            </label>
          </div>
          <div className="items-center px-4 py-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
              Close
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
