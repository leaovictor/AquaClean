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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });
  const [weeklyTimeSlots, setWeeklyTimeSlots] = useState<Record<string, { time: string; is_available: boolean; id?: number }[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editedSlotDate, setEditedSlotDate] = useState('');
  const [editedSlotTime, setEditedSlotTime] = useState('');
  const [editedSlotAvailable, setEditedSlotAvailable] = useState(true);
  const [pendingNewSlots, setPendingNewSlots] = useState<Omit<TimeSlot, 'id'>[]>([]);
  const [pendingEditedSlots, setPendingEditedSlots] = useState<TimeSlot[]>([]);
  const [pendingDeletedSlotIds, setPendingDeletedSlotIds] = useState<number[]>([]);

  const generateWeeklyTimeSlots = (weekStart: string) => {
    const weekSchedule: Record<string, { time: string; is_available: boolean; id?: number }[]> = {};
    const startOfWeek = new Date(weekStart + 'T00:00:00');

    for (let d = 0; d < 6; d++) { // Monday to Saturday
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + d);
      const dateString = currentDay.toISOString().split('T')[0];
      
      const daySlots = [];
      for (let h = 9; h <= 17; h++) { // 9 AM to 5 PM
        daySlots.push({
          date: dateString,
          time: `${h.toString().padStart(2, '0')}:00`,
          is_available: true, // Default to available
        });
      }
      weekSchedule[dateString] = daySlots;
    }
    return weekSchedule;
  };

  const fetchAndMergeWeeklyTimeSlots = async (weekStart: string, currentSession: Session) => {
    setDataLoading(true);
    try {
      const token = currentSession.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      
      // Calculate end of week for fetching
      const endOfWeek = new Date(new Date(weekStart + 'T00:00:00').setDate(new Date(weekStart + 'T00:00:00').getDate() + 5)).toISOString().split('T')[0];

      // Fetch existing slots for the selected week
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots?weekStart=${weekStart}&weekEnd=${endOfWeek}`, { headers });

      let existingSlots: TimeSlot[] = [];
      if (response.ok) {
        existingSlots = await response.json();
      } else {
        console.error("Failed to fetch existing slots for week:", weekStart);
      }

      const baseWeeklySchedule = generateWeeklyTimeSlots(weekStart);
      const mergedWeeklySchedule: Record<string, { time: string; is_available: boolean; id?: number }[]> = {};

      Object.entries(baseWeeklySchedule).forEach(([date, slots]) => {
        mergedWeeklySchedule[date] = slots.map(generatedSlot => {
          const existing = existingSlots.find(es => es.date === date && es.time === generatedSlot.time);
          return {
            ...generatedSlot,
            id: existing?.id,
            is_available: existing ? existing.is_available : true,
          };
        });
      });
      setTimeSlots(Object.values(mergedWeeklySchedule).flat()); // Keep flat list for editing
      setWeeklyTimeSlots(mergedWeeklySchedule); // For display
    } catch (error) {
      console.error("Error fetching and merging weekly time slots:", error);
      setMessage({ type: 'error', text: 'Failed to load weekly time slots.' });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate("/");
      return;
    }
    if (userRole !== 'admin' && !loading) {
      navigate("/dashboard"); // Redirect non-admins
      return;
    }

    if (currentUser && userRole === 'admin' && session) {
      try {
        fetchAndMergeWeeklyTimeSlots(selectedWeekStart, session);
      } catch (error) {
        console.error("Error in useEffect fetchAndMergeWeeklyTimeSlots:", error);
        setMessage({ type: 'error', text: 'Failed to load time slots due to an unexpected error.' });
        setDataLoading(false); // Ensure loading state is resolved
      }
    }
  }, [currentUser, loading, userRole, navigate, selectedWeekStart, session]);

  const fetchTimeSlots = async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, { headers });

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

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTime) {
      setMessage({ type: 'error', text: 'Please enter both date and time.' });
      return;
    }

    const newSlot = {
      date: newSlotDate,
      time: newSlotTime,
      is_available: true,
    };

    setPendingNewSlots(prev => [...prev, newSlot]);
    // For immediate UI feedback, add to timeSlots with a temporary ID
    setTimeSlots(prev => [...prev, { ...newSlot, id: Date.now() }]); // Temporary ID
    setNewSlotDate('');
    setNewSlotTime('');
    setMessage({ type: 'success', text: 'New slot added to pending changes. Click "Save All Changes" to apply.' });
  };

  const handleEditClick = (slot: TimeSlot) => {
    setEditingSlotId(slot.id);
    setEditedSlotDate(slot.date);
    setEditedSlotTime(slot.time);
    setEditedSlotAvailable(slot.is_available);
  };

  const handleSaveEdit = (id: number) => {
    if (!editedSlotDate || !editedSlotTime) {
      setMessage({ type: 'error', text: 'Please enter both date and time.' });
      return;
    }

    const updatedSlot = {
      id,
      date: editedSlotDate,
      time: editedSlotTime,
      is_available: editedSlotAvailable,
    };

    setPendingEditedSlots(prev => {
      const existingIndex = prev.findIndex(slot => slot.id === id);
      if (existingIndex > -1) {
        return prev.map((slot, index) => index === existingIndex ? updatedSlot : slot);
      }
      return [...prev, updatedSlot];
    });

    setTimeSlots(prev => prev.map(slot => slot.id === id ? updatedSlot : slot));
    setEditingSlotId(null);
    setMessage({ type: 'success', text: 'Slot updated in pending changes. Click "Save All Changes" to apply.' });
  };

  const handleDeleteSlot = (id: number) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    setPendingDeletedSlotIds(prev => [...prev, id]);
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    setMessage({ type: 'success', text: 'Slot marked for deletion. Click "Save All Changes" to apply.' });
  };

  const handleSaveChanges = async () => {
    if (!session) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

      const response = await fetch(`${functionsBaseUrl}/manage-time-slots/bulk`, { // New bulk endpoint
        method: 'POST', // Or PUT, depending on backend design
        headers,
        body: JSON.stringify({
          newSlots: pendingNewSlots,
          editedSlots: pendingEditedSlots,
          deletedSlotIds: pendingDeletedSlotIds,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'All changes saved successfully!' });
        setPendingNewSlots([]);
        setPendingEditedSlots([]);
        setPendingDeletedSlotIds([]);
        fetchAndMergeWeeklyTimeSlots(selectedWeekStart, session); // Refresh data
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save changes' });
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (!confirm('Are you sure you want to discard all unsaved changes?')) return;
    setPendingNewSlots([]);
    setPendingEditedSlots([]);
    setPendingDeletedSlotIds([]);
    fetchAndMergeWeeklyTimeSlots(selectedWeekStart, session); // Revert to last saved state
    setMessage({ type: 'info', text: 'Unsaved changes have been discarded.' });
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
          <p className="text-gray-600">You do not have administrative privileges to view this page.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Group time slots by date for display
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    if (!groups[slot.date]) {
      groups[slot.date] = [];
    }
    groups[slot.date].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Time Slots</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mb-6">
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Previous Week
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            Week of {new Date(selectedWeekStart + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Next Week
          </button>
        </div>

        {/* Add New Time Slot Form */}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Slot
            </button>
          </form>
        </div>

        {/* Action Buttons for Bulk Operations */}
        {(pendingNewSlots.length > 0 || pendingEditedSlots.length > 0 || pendingDeletedSlotIds.length > 0) && (
          <div className="flex justify-end space-x-4 mb-8">
            <button
              onClick={handleCancelChanges}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel Changes
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Save All Changes
            </button>
          </div>
        )}

        {/* Existing Time Slots List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Time Slots</h2>
          {Object.keys(groupedTimeSlots).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              No time slots available. Add some above!
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                <div key={date}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md shadow-sm">
                        {editingSlotId === slot.id ? (
                          // Editing mode
                          <div className="flex flex-col w-full space-y-2">
                            <input
                              type="date"
                              value={editedSlotDate}
                              onChange={(e) => setEditedSlotDate(e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <input
                              type="time"
                              value={editedSlotTime}
                              onChange={(e) => setEditedSlotTime(e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <div className="flex items-center">
                              <input
                                id={`available-${slot.id}`}
                                type="checkbox"
                                checked={editedSlotAvailable}
                                onChange={(e) => setEditedSlotAvailable(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label htmlFor={`available-${slot.id}`} className="ml-2 block text-sm text-gray-900">
                                Available
                              </label>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(slot.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <Save className="w-4 h-4 mr-1" /> Save
                              </button>
                              <button
                                onClick={() => setEditingSlotId(null)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-900">{slot.time}</span>
                              {slot.is_available ? (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Available</span>
                              ) : (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">Booked</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditClick(slot)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </>
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
