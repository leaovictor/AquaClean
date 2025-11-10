import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AdminNavigation from "@/react-app/components/AdminNavigation";
import { useAuth } from "@/react-app/AuthContext";
import { Calendar, Clock, Plus, Trash2, Edit, Save, XCircle, CheckCircle, Loader2 } from "lucide-react";
import type { TimeSlotRule } from "@/shared/types"; // Assuming this type is defined for rules

const functionsBaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co/functions/v1';

const daysOfWeek: { [key: number]: string } = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export default function AdminTimeSlots() {
  const { currentUser, session, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [rules, setRules] = useState<TimeSlotRule[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for new rule form
  const [newRuleDay, setNewRuleDay] = useState<number>(1);
  const [newRuleStartTime, setNewRuleStartTime] = useState('09:00');
  const [newRuleEndTime, setNewRuleEndTime] = useState('17:00');

  // State for editing a rule
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editedRule, setEditedRule] = useState<Partial<TimeSlotRule>>({});

  useEffect(() => {
    if (!loading && !currentUser) navigate("/");
    if (!loading && userRole !== 'admin') navigate("/dashboard");
    if (currentUser && userRole === 'admin' && session) {
      fetchRules();
    }
  }, [currentUser, loading, userRole, navigate, session]);

  const fetchRules = async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const token = session.access_token;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, { headers });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch availability rules.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while fetching rules.' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSaving(true);
    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: newRuleDay,
          start_time: newRuleStartTime,
          end_time: newRuleEndTime,
        }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'New availability rule added.' });
        fetchRules();
      } else {
        setMessage({ type: 'error', text: 'Failed to add rule.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (rule: TimeSlotRule) => {
    setEditingRuleId(rule.id);
    setEditedRule({ ...rule });
  };

  const handleSaveEdit = async (id: number) => {
    if (!session) return;
    setIsSaving(true);
    try {
      const token = session.access_token;
      const { id: ruleId, ...updateData } = editedRule;
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updateData }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Rule updated successfully.' });
        setEditingRuleId(null);
        fetchRules();
      } else {
        setMessage({ type: 'error', text: 'Failed to update rule.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!session || !confirm('Are you sure you want to delete this rule?')) return;
    try {
      const token = session.access_token;
      const response = await fetch(`${functionsBaseUrl}/manage-time-slots`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Rule deleted.' });
        fetchRules();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete rule.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred.' });
    }
  };

  if (loading || dataLoading) {
    return <div className="..."><Loader2 className="w-12 h-12 animate-spin" /></div>;
  }

  const groupedRules = rules.reduce((acc, rule) => {
    (acc[rule.day_of_week] = acc[rule.day_of_week] || []).push(rule);
    return acc;
  }, {} as Record<number, TimeSlotRule[]>);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Weekly Availability</h1>
        {message && <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Rule</h2>
          <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="day" className="block text-sm font-medium">Day</label>
              <select id="day" value={newRuleDay} onChange={e => setNewRuleDay(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                {Object.entries(daysOfWeek).map(([num, name]) => <option key={num} value={num}>{name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium">Start Time</label>
              <input type="time" id="start_time" value={newRuleStartTime} onChange={e => setNewRuleStartTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium">End Time</label>
              <input type="time" id="end_time" value={newRuleEndTime} onChange={e => setNewRuleEndTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <button type="submit" disabled={isSaving} className="..."><Plus className="w-5 h-5 mr-2" /> Add Rule</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Rules</h2>
          <div className="space-y-4">
            {Object.entries(daysOfWeek).map(([dayNum, dayName]) => (
              <div key={dayNum}>
                <h3 className="text-lg font-medium text-gray-800 mb-2">{dayName}</h3>
                {groupedRules[Number(dayNum)]?.length > 0 ? (
                  <div className="space-y-2">
                    {groupedRules[Number(dayNum)].map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md">
                        {editingRuleId === rule.id ? (
                          <div className="flex items-center gap-2 flex-grow">
                            <input type="time" value={editedRule.start_time} onChange={e => setEditedRule({...editedRule, start_time: e.target.value})} className="..."/>
                            <span>-</span>
                            <input type="time" value={editedRule.end_time} onChange={e => setEditedRule({...editedRule, end_time: e.target.value})} className="..."/>
                            <button onClick={() => handleSaveEdit(rule.id)}><Save className="w-5 h-5"/></button>
                            <button onClick={() => setEditingRuleId(null)}><XCircle className="w-5 h-5"/></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between flex-grow">
                            <span>{rule.start_time} - {rule.end_time}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditClick(rule)}><Edit className="w-5 h-5"/></button>
                              <button onClick={() => handleDeleteRule(rule.id)}><Trash2 className="w-5 h-5"/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No availability set for {dayName}.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
