import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { getSupportTickets, createSupportTicket } from '../lib/api';

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      getSupportTickets(userId).then(setTickets).catch(console.error);
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    try {
      const res = await createSupportTicket({ user_id: userId, subject, message, priority: 'normal' });
      if (res.data) {
        setTickets([res.data, ...tickets]);
        setIsAdding(false);
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pt-safe min-h-[100dvh] flex flex-col items-center">
      <div className="w-full max-w-md p-6 h-[100dvh] flex flex-col">
        <header className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-xl font-semibold text-slate-100">Support</h1>
        </header>

        {isAdding ? (
          <motion.form onSubmit={handleSubmit} className="flex-1 space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Card not working" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors min-h-[150px]" placeholder="Describe your issue..." />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold focus:outline-none">Cancel</button>
              <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold focus:outline-none">Submit Ticket</button>
            </div>
          </motion.form>
        ) : (
          <div className="flex-1 flex flex-col">
            <button onClick={() => setIsAdding(true)} className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl font-medium mb-6 flex justify-center items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              New Ticket
            </button>
            
            <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
              {tickets.length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-10">No support tickets found.</div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="glass-card p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium text-slate-200">{ticket.subject}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${ticket.status === 'open' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{ticket.message}</p>
                    <div className="text-[10px] text-slate-500 flex justify-end mt-2">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
