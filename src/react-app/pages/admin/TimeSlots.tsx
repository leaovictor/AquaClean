import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { useAuth } from "@/react-app/AuthContext";
import { Calendar, Clock, Plus, Trash2, Edit, Save, XCircle, CheckCircle, Loader2 } from "lucide-react";
import type { TimeSlot } from "@/shared/types"; // Assuming TimeSlot type is defined here

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

export default function AdminTimeSlots() {
  const { currentUser, session, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editedSlot, setEditedSlot] = useState<Partial<TimeSlot>>({});

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/");
      return;
    }
    if (!loading && userRole !== 'admin') {
      navigate("/dashboard");
      return;
    }
    if (currentUser && userRole === 'admin' && session) {
      fetchTimeSlotsForWeek(selectedWeekStart);
    }
  }, [currentUser, loading, userRole, navigate, selectedWeekStart, session]);

  const fetchTimeSlotsForWeek = async (weekStart: string) => {
    if (!session) return;
    setDataLoading(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const endOfWeek = new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toISOString().split('T')[0];

      const response = await fetch(`${functionsBaseUrl}/manage-time-slots?weekStart=${weekStart}&weekEnd=${endOfWeek}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to fetch time slots' });
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setMessage({ type: 'error', text: 'Failed to fetch time slots' });
    } finally {
      setDataLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const currentWeekStart = new Date(selectedWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    setSelectedWeekStart(currentWeekStart.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const currentWeekStart = new Date(selectedWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    setSelectedWeekStart(currentWeekStart.toISOString().split('T')[0]);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTime || !session) return;

    setIsSaving(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: newSlotDate, time: newSlotTime, is_available: true }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'New slot added successfully!' });
        setNewSlotDate('');
        setNewSlotTime('');
        fetchTimeSlotsForWeek(selectedWeekStart);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to add slot' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add slot' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (slot: TimeSlot) => {
    setEditingSlotId(slot.id);
    setEditedSlot({ date: slot.date, time: slot.time, is_available: slot.is_available });
  };

  const handleSaveEdit = async (id: number) => {
    if (!session) return;
    setIsSaving(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...editedSlot }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Slot updated successfully!' });
        setEditingSlotId(null);
        fetchTimeSlotsForWeek(selectedWeekStart);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update slot' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update slot' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time slot?') || !session) return;

    setIsSaving(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Slot deleted successfully!' });
        fetchTimeSlotsForWeek(selectedWeekStart);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to delete slot' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete slot' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        </div>
      </div>
    );
  }

  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    const date = slot.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Time Slots</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
             message.type === 'error' ? <XCircle className="w-5 h-5 text-red-600" /> : null}
            <span className={message.type === 'success' ? 'text-green-800' :
                             message.type === 'error' ? 'text-red-800' : 'text-blue-800'}>
              {message.text}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mb-6">
          <button onClick={handlePreviousWeek} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Previous Week</button>
          <h2 className="text-xl font-semibold text-gray-800">
            Week of {new Date(selectedWeekStart + 'T00:00:00').toLocaleDateString()}
          </h2>
          <button onClick={handleNextWeek} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Next Week</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Time Slot</h2>
          <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="newSlotDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="newSlotDate"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="newSlotTime" className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                id="newSlotTime"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />} Add Slot
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Time Slots</h2>
          {Object.keys(groupedTimeSlots).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              No time slots scheduled for this week.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTimeSlots).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()).map(([date, slots]) => (
                <div key={date}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {slots.sort((a, b) => a.time.localeCompare(b.time)).map((slot) => (
                      <div key={slot.id} className="p-3 border rounded-md shadow-sm">
                        {editingSlotId === slot.id ? (
                          <div className="flex flex-col space-y-2">
                            <input
                              type="date"
                              value={editedSlot.date || ''}
                              onChange={(e) => setEditedSlot({...editedSlot, date: e.target.value})}
                              className="block w-full rounded-md border-gray-300"
                            />
                            <input
                              type="time"
                              value={editedSlot.time || ''}
                              onChange={(e) => setEditedSlot({...editedSlot, time: e.target.value})}
                              className="block w-full rounded-md border-gray-300"
                            />
                            <div className="flex items-center">
                              <input
                                id={`available-${slot.id}`}
                                type="checkbox"
                                checked={editedSlot.is_available || false}
                                onChange={(e) => setEditedSlot({...editedSlot, is_available: e.target.checked})}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                              <label htmlFor={`available-${slot.id}`} className="ml-2 text-sm text-gray-900">
                                Available
                              </label>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button onClick={() => handleSaveEdit(slot.id)} className="..."><Save className="w-4 h-4 mr-1" /> Save</button>
                              <button onClick={() => setEditingSlotId(null)} className="..."><XCircle className="w-4 h-4 mr-1" /> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{slot.time}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {slot.is_available ? 'Available' : 'Booked'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleEditClick(slot)}><Edit className="w-5 h-5 text-blue-600" /></button>
                              <button onClick={() => handleDeleteSlot(slot.id)}><Trash2 className="w-5 h-5 text-red-600" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
