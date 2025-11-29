import { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Check, CheckCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase.functions.invoke('notifications', {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const markAsRead = async (id: string, event?: React.MouseEvent) => {
        if (event) event.stopPropagation();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke('notifications', {
            method: 'PUT',
            body: { id },
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const deleteNotification = async (id: string, event?: React.MouseEvent) => {
        if (event) event.stopPropagation();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke('notifications', {
            method: 'DELETE',
            body: { id },
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        setNotifications(prev => {
            const newNotifications = prev.filter(n => n.id !== id);
            setUnreadCount(newNotifications.filter(n => !n.is_read).length);
            return newNotifications;
        });
    };

    const markAllAsRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke('notifications', {
            method: 'PUT',
            body: { all: true },
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const deleteAll = async () => {
        if (!window.confirm('Tem certeza que deseja apagar todas as notificações?')) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke('notifications', {
            method: 'DELETE',
            body: { all: true },
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile Overlay for closing */}
                    <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed left-4 right-4 top-20 md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                            <div className="flex items-center space-x-2">
                                {notifications.length > 0 && (
                                    <>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            title="Marcar todas como lidas"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={deleteAll}
                                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                                            title="Apagar todas"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="md:hidden text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Nenhuma notificação
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group relative ${!notification.is_read ? 'bg-blue-50/50' : ''
                                            }`}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    >
                                        <div className="absolute right-2 top-2 hidden group-hover:flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => markAsRead(notification.id, e)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                                                    title="Marcar como lida"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => deleteNotification(notification.id, e)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                                                title="Apagar"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
