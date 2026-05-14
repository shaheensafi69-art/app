import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, ArrowUpRight, ArrowDownLeft, ShieldAlert, BadgeCheck } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../lib/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      getNotifications(userId).then(setNotifications).catch(console.error);
    }
  }, [userId]);

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'credit': return <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400"><ArrowDownLeft className="w-4 h-4" /></div>;
      case 'debit': return <div className="p-2 rounded-full bg-rose-500/20 text-rose-400"><ArrowUpRight className="w-4 h-4" /></div>;
      case 'security': return <div className="p-2 rounded-full bg-amber-500/20 text-amber-400"><ShieldAlert className="w-4 h-4" /></div>;
      case 'system': return <div className="p-2 rounded-full bg-sky-500/20 text-sky-400"><BadgeCheck className="w-4 h-4" /></div>;
      default: return <div className="p-2 rounded-full bg-slate-700 text-slate-300"><Bell className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="pt-safe min-h-[100dvh] flex flex-col items-center">
      <div className="w-full max-w-md p-6 h-[100dvh] flex flex-col">
        <header className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-xl font-semibold text-slate-100">Notifications</h1>
        </header>

        <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-10">You have no new notifications.</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => handleRead(n.id, n.is_read)}
                className={`flex gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${n.is_read ? 'glass-card border-slate-700/50 opacity-70' : 'bg-slate-800 border-slate-600'}`}
              >
                {getIcon(n.type)}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-200">{n.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.body}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
