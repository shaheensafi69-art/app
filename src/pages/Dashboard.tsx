import { useEffect, useState } from 'react';
import { getDashboard } from '../lib/api';
import { useNavigate } from 'react-router-dom';

import { ArrowDownLeft, ArrowUpRight, Plus, ScanLine, Wallet, User, CreditCard, ArrowDownRight, Gift, Headphones, Bell } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    getDashboard(userId).then(res => {
      setData(res);
    }).catch(err => {
      console.error(err);
      setData({ error: "Network or server error fetching dashboard. " + err.message });
    });
  }, [userId, navigate]);

  if (!data) {
    return <div className="min-h-[100dvh] flex items-center justify-center text-emerald-500">Loading...</div>;
  }

  if (data.error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-red-500 p-6 text-center">
        <p>Error: {data.error}</p>
        <button onClick={() => { localStorage.removeItem('userId'); navigate('/'); }} className="mt-4 px-4 py-2 bg-slate-800 rounded">Go back</button>
      </div>
    );
  }

  const { user, balance, transactions, currencies } = data;
  const isKycApproved = user.kycStatus === 'approved';

  const quickActions = [
    { name: 'Add Money', icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-400/20', path: '/topup', locked: !isKycApproved },
    { name: 'Send', icon: ArrowUpRight, color: 'text-slate-200', bg: 'bg-slate-700/50', path: '/transfer', locked: !isKycApproved },
    { name: 'Withdraw', icon: ArrowDownRight, color: 'text-slate-200', bg: 'bg-slate-700/50', path: '/withdraw', locked: !isKycApproved },
    { name: 'Gift Cards', icon: Gift, color: 'text-rose-400', bg: 'bg-rose-500/20', path: '/giftcards', locked: !isKycApproved },
    { name: 'My Cards', icon: CreditCard, color: 'text-slate-200', bg: 'bg-slate-700/50', path: '/cards', locked: !isKycApproved },
    { name: 'Support', icon: Headphones, color: 'text-sky-400', bg: 'bg-sky-500/20', path: '/support', locked: false },
    { name: 'Mobile', icon: ScanLine, color: 'text-amber-400', bg: 'bg-amber-500/20', path: '/topup', locked: false },
    { name: 'Profile', icon: User, color: 'text-slate-200', bg: 'bg-slate-700/50', path: '/profile', locked: false },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleActionClick = (action: any) => {
     if (action.locked) {
        navigate('/profile');
     } else {
        navigate(action.path);
     }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center">
      <div className="w-full max-w-md p-6 space-y-8">
        
        {!isKycApproved && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
             className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between mt-2"
           >
              <div>
                <h3 className="text-amber-400 font-semibold text-sm">Action Required</h3>
                <p className="text-slate-300 text-xs mt-1">Verify your identity to unlock all features.</p>
              </div>
              <button 
                onClick={() => navigate('/profile')} 
                className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-400"
              >
                Verify
              </button>
           </motion.div>
        )}

        {/* Header section */}
        <header className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden hover:opacity-80 transition cursor-pointer">
              {user.image_url ? (
                <img src={user.image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-medium text-slate-300 capitalize">{user.first_name?.[0] || user.firstName?.[0] || 'U'}</span>
              )}
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Welcome back</p>
              <h2 className="text-sm font-bold text-slate-100">{user.first_name || user.firstName} {user.last_name || user.lastName}</h2>
            </div>
          </div>
          <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-slate-800 transition-colors">
             <Bell className="w-5 h-5 text-slate-300" />
          </button>
        </header>

        {/* Balance section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <p className="text-sm text-slate-400 mb-2 font-medium">Total Balance</p>
          <h1 className="text-5xl font-semibold tracking-tighter text-emerald-400 mb-1 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] flex justify-center items-end">
            <span className="text-3xl mr-1 mb-1">$</span>
            {balance ? balance.toFixed(2) : "0.00"}
          </h1>
          <p className="text-emerald-500/80 text-sm font-medium">+2.4% today</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={action.name} 
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => handleActionClick(action)}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 border border-white/5 relative ${action.locked ? 'bg-slate-800 opacity-60' : action.bg}`}>
                <action.icon className={`w-6 h-6 outline-none ${action.locked ? 'text-slate-500' : action.color}`} strokeWidth={2.5} />
                {action.locked && (
                  <div className="absolute -top-1 -right-1 bg-slate-900 border border-slate-700 rounded-full p-1">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-400">{action.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Currencies */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Currencies</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
             {currencies?.map((curr: any, idx: number) => (
               <motion.div 
                 key={curr.id}
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * (idx + 1) }}
                 className="min-w-[140px] snap-center glass-card p-4 rounded-2xl flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
               >
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold">
                      {curr.symbolChar}
                    </div>
                    <span className="text-xs text-slate-400 font-medium tracking-wider">{curr.symbol}</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-100">{curr.rate.toFixed(2)}</div>
                    <div className={`text-[10px] uppercase mt-0.5 ${curr.change >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {curr.change > 0 ? '+' : ''}{curr.change}%
                    </div>
                  </div>
               </motion.div>
             ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="pt-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Recent Transactions</h3>
            <button className="text-xs text-emerald-500 font-medium">See all</button>
          </div>
          <div className="space-y-3">
            {transactions?.map((tx: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                key={tx.id} 
                className="flex items-center justify-between p-4 glass-card rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium uppercase">
                    {tx.vendorName ? tx.vendorName[0] : 'T'}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-200">{tx.vendorName || tx.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className={`font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
