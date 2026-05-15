import { useEffect, useState } from 'react';
import { getDashboard, getCachedData } from '../lib/api';
import { useNavigate } from 'react-router-dom';

import { ArrowDownLeft, ArrowUpRight, Plus, Wallet, Gift, Headphones, Bell, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  
  // Initialize with cached data if available
  const [data, setData] = useState<any>(() => userId ? getCachedData(`/api/dashboard/${userId}`) : null);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    // Fetch anyway to get background updates if cache misses or we want fresh data
    getDashboard(userId).then(res => {
      setData(res);
    }).catch(err => {
      console.error(err);
      if (!data) setData({ error: "Network or server error fetching dashboard. " + err.message });
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

  const { user, balance, transactions, wallets } = data;

  const defaultWallets = [
    { currency: 'GBP', symbolChar: '£', balance: 0 },
    { currency: 'USD', symbolChar: '$', balance: 0 },
    { currency: 'EUR', symbolChar: '€', balance: 0 },
  ];

  const displayWallets = defaultWallets.map(dw => {
    const fw = wallets?.find((w:any) => w.currency === dw.currency);
    return fw ? { ...dw, balance: fw.balance } : dw;
  });
  const isKycApproved = user.kycStatus === 'approved';

  const quickActions = [
    { name: 'Add Money', icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-400/20', path: '/topup', locked: !isKycApproved },
    { name: 'Send', icon: ArrowUpRight, color: 'text-slate-200', bg: 'bg-slate-700/50', path: '/transfer', locked: !isKycApproved },
    { name: 'Gift Cards', icon: Gift, color: 'text-rose-400', bg: 'bg-rose-500/20', path: '/giftcards', locked: !isKycApproved },
    { name: 'Support', icon: Headphones, color: 'text-sky-400', bg: 'bg-sky-500/20', path: '/support', locked: false },
    { name: 'Mobile Topup', icon: Smartphone, color: 'text-amber-400', bg: 'bg-amber-500/20', path: '/topup', locked: false, comingSoon: true },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleActionClick = (action: any) => {
     if (action.comingSoon) return;
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
              transition={{ duration: 0.2, delay: idx * 0.05 }}
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
                {action.comingSoon && (
                  <div className="absolute -bottom-2 -left-2 -right-2 bg-amber-500 text-slate-900 text-[8px] font-bold px-1 py-0.5 rounded-full z-10 text-center shadow-lg uppercase tracking-wide">
                    Coming Soon
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-400 text-center leading-tight whitespace-normal break-words px-1 min-h-[28px] flex items-center">{action.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Currencies / Balances */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Balances</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar snap-x">
             {displayWallets.map((curr: any, idx: number) => (
               <motion.div 
                 key={curr.currency}
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: 0.05 * (idx + 1) }}
                 className="min-w-[140px] snap-center glass-card p-4 rounded-2xl flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
               >
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold">
                      {curr.symbolChar}
                    </div>
                    <span className="text-xs text-slate-400 font-medium tracking-wider">{curr.currency}</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-100">{Number(curr.balance).toFixed(2)}</div>
                    <div className={`text-[10px] uppercase mt-0.5 text-emerald-400`}>
                      Active
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
            {transactions?.length > 0 ? transactions.map((tx: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + idx * 0.05 }}
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
            )) : (
              <div className="text-center py-6 text-slate-500 text-sm glass-card rounded-2xl">
                 No transactions yet
              </div>
            )}
          </div>
        </div>

        {/* Economic News */}
        <div className="pt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Market News</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 glass-card rounded-2xl">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=200&auto=format&fit=crop)'}}></div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200 leading-tight mb-1">Global markets surge as inflation cools down</h4>
                <p className="text-xs text-slate-400 line-clamp-2">Central banks consider pausing rate hikes stringently as recent data shows promising signs of economic stability.</p>
                <span className="text-[10px] text-emerald-500 font-medium mt-1 inline-block">2 hours ago</span>
              </div>
            </div>
            <div className="flex gap-4 p-4 glass-card rounded-2xl">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=200&auto=format&fit=crop)'}}></div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200 leading-tight mb-1">Tech stocks rally despite strict regulations</h4>
                <p className="text-xs text-slate-400 line-clamp-2">Major tech giants report strong quarterly earnings, overshadowing concerns about impending antitrust inquiries.</p>
                <span className="text-[10px] text-emerald-500 font-medium mt-1 inline-block">4 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* About SafiPay */}
        <div className="pt-8 pb-4">
          <div className="p-6 glass-card rounded-3xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl"></div>
            
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner z-10">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-sky-500 rounded-xl transform rotate-45"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2 z-10">Welcome to SafiPay</h3>
            <p className="text-sm text-slate-400 mb-4 z-10 leading-relaxed">
              SafiPay is your secure and borderless digital Bank. Experience lightning fast transactions, seamless top-ups, and full control over your physical and virtual cards.
            </p>
            <div className="text-xs text-slate-500 z-10">
              © {new Date().getFullYear()} SafiPay Inc. All rights reserved.
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
