import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Building } from 'lucide-react';
import { getWithdrawals, createWithdrawal } from '../lib/api';

export default function Withdraw() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [bankParams, setBankParams] = useState({ accountNumber: '', sortCode: '' });
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      getWithdrawals(userId).then(setWithdrawals).catch(console.error);
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !bankParams.accountNumber) return;
    try {
      const res = await createWithdrawal({ 
        user_id: userId, 
        amount: parseFloat(amount), 
        currency: 'GBP', 
        bank_details: JSON.stringify(bankParams) 
      });
      if (res.data) {
        setWithdrawals([res.data, ...withdrawals]);
        setIsAdding(false);
        setAmount('');
        setBankParams({ accountNumber: '', sortCode: '' });
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
          <h1 className="text-xl font-semibold text-slate-100">Withdraw Funds</h1>
        </header>

        {isAdding ? (
          <motion.form onSubmit={handleSubmit} className="flex-1 space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (GBP)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-emerald-400 font-bold" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Number</label>
              <input value={bankParams.accountNumber} onChange={e => setBankParams({...bankParams, accountNumber: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="8 digits" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sort Code</label>
              <input value={bankParams.sortCode} onChange={e => setBankParams({...bankParams, sortCode: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="XX-XX-XX" />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold focus:outline-none">Cancel</button>
              <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold focus:outline-none">Confirm</button>
            </div>
          </motion.form>
        ) : (
          <div className="flex-1 flex flex-col">
             <button onClick={() => setIsAdding(true)} className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 py-4 rounded-xl font-medium mb-6 flex items-center gap-3 px-4 transition-colors hover:bg-slate-800">
               <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
                  <Building className="w-5 h-5" />
               </div>
               <div className="text-left">
                  <p className="font-semibold">Withdraw to Bank</p>
                  <p className="text-xs text-slate-400">Takes 1-3 business days</p>
               </div>
             </button>

             <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Withdrawals</h3>
            <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
              {withdrawals.length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-10">No recent withdrawals.</div>
              ) : (
                withdrawals.map(w => (
                  <div key={w.id} className="flex justify-between items-center glass-card p-4 rounded-xl border border-slate-700/50">
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">Bank Transfer</h4>
                      <p className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-semibold text-slate-100">-{w.amount.toFixed(2)} {w.currency}</p>
                       <p className={`text-[10px] uppercase font-bold mt-0.5 ${w.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>{w.status}</p>
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
