import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Gift, Search, Copy, Check } from 'lucide-react';
import { getGiftCards, createGiftCard, redeemGiftCard } from '../lib/api';

export default function GiftCards() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'create' | 'redeem'>('my');
  const [copiedCode, setCopiedCode] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      getGiftCards(userId).then(setGiftCards).catch(console.error);
    }
  }, [userId]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    try {
      const res = await createGiftCard({ sender_id: userId, amount: parseFloat(amount), currency: 'GBP' });
      if (res.data) {
        setGiftCards([res.data, ...giftCards]);
        setAmount('');
        setActiveTab('my');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;
    try {
      const res = await redeemGiftCard({ user_id: userId, code: redeemCode });
      if (res.card) {
        setGiftCards([res.card, ...giftCards.filter(g => g.id !== res.card.id)]);
        setRedeemCode('');
        setActiveTab('my');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to redeem code.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="pt-safe min-h-[100dvh] flex flex-col items-center">
      <div className="w-full max-w-md p-6 h-[100dvh] flex flex-col">
        <header className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h1 className="text-xl font-semibold text-slate-100">Gift Cards</h1>
        </header>

        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6">
          <button onClick={() => setActiveTab('my')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'my' ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}>My Cards</button>
          <button onClick={() => setActiveTab('create')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'create' ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}>Create</button>
          <button onClick={() => setActiveTab('redeem')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'redeem' ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}>Redeem</button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
           {activeTab === 'my' && (
              giftCards.length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-10">No gift cards found.</div>
              ) : (
                giftCards.map(gc => (
                  <div key={gc.id} className="glass-card p-5 rounded-2xl border border-rose-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-2 text-rose-400">
                         <Gift className="w-5 h-5" />
                         <span className="font-semibold text-sm">Gift Card</span>
                       </div>
                       <h3 className="text-2xl font-bold text-slate-100">£{gc.amount}</h3>
                    </div>

                    <div className="flex justify-between flex-wrap gap-2 items-end">
                       <div>
                         <p className="text-[10px] text-slate-400 mb-1">CODE</p>
                         <p className="font-mono text-sm tracking-widest text-slate-200">{gc.code}</p>
                       </div>
                       
                       <div className="flex items-center gap-3">
                         {gc.is_redeemed ? (
                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800/80 px-2 py-1 rounded">Redeemed</span>
                         ) : (
                            <>
                              <button onClick={() => copyCode(gc.code)} className="p-2 rounded bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors">
                                {copiedCode === gc.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Active</span>
                            </>
                         )}
                       </div>
                    </div>
                  </div>
                ))
              )
           )}

           {activeTab === 'create' && (
              <motion.form onSubmit={handleCreateCard} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                 <div className="text-center p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-4">
                   <Gift className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                   <h3 className="text-slate-100 font-semibold mb-1">Send a Gift Card</h3>
                   <p className="text-xs text-slate-400">Generate a secure code to share with anyone.</p>
                 </div>
                 <div>
                    <label className="text-xs text-slate-400 mb-1 block">Value (GBP)</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors text-rose-400 font-bold" placeholder="0.00" />
                 </div>
                 <button type="submit" className="w-full py-4 rounded-xl bg-rose-500 text-white font-bold tracking-wide mt-2">Generate Card</button>
              </motion.form>
           )}

           {activeTab === 'redeem' && (
              <motion.form onSubmit={handleRedeem} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                 <div>
                    <label className="text-xs text-slate-400 mb-1 block">Gift Card Code</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input value={redeemCode} onChange={e => setRedeemCode(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-4 text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500 transition-colors uppercase" placeholder="ENTER 16-DIGIT CODE" />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-4 rounded-xl bg-slate-100 text-slate-900 font-bold tracking-wide mt-2">Redeem Now</button>
              </motion.form>
           )}
        </div>
      </div>
    </div>
  );
}
