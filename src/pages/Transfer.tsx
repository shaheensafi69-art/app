import { useState, useEffect } from 'react';

import { Search, UserPlus, Building2, Send, AtSign, ArrowLeft, Globe, Zap, CreditCard as CardIcon, Shield, MapPin } from 'lucide-react';
import { getDashboard } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'EU', name: 'Eurozone', currency: 'EUR' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'IN', name: 'India', currency: 'INR' },
];

export default function Transfer() {
  const [view, setView] = useState<'list' | 'safitag' | 'country' | 'bank' | 'amount' | 'processing' | 'success' | 'failed'>('list');
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', bankCode: '' });
  const [msg, setMsg] = useState('');
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
     if (userId) {
         getDashboard(userId).then(res => {
             if (res.balance) setBalance(res.balance);
             if (res.user) setKycStatus(res.user.kycStatus);
         }).catch(console.error);
     }
  }, [userId]);

  if (kycStatus && kycStatus !== 'approved') {
     return (
       <div className="min-h-[100dvh] flex flex-col items-center">
         <div className="w-full max-w-md p-6 flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
               <Shield className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Verification Required</h2>
            <p className="text-slate-400 mb-8 max-w-[280px]">
               You need to verify your identity to transfer money and unlock full limits.
            </p>
            <button 
              onClick={() => window.location.href = '/profile'} 
              className="w-full bg-emerald-500 text-slate-900 font-bold text-lg py-4 rounded-full hover:bg-emerald-400 transition"
            >
              Verify Identity
            </button>
         </div>
         
       </div>
     );
  }

  const handleTransfer = async () => {
     if (parseFloat(amount) > balance) {
        setMsg('Insufficient balance');
        setView('failed');
        return;
     }

     setView('processing');
     try {
       const resp = await fetch(`/api/transfer/${userId}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount: parseFloat(amount), to: recipient || (bankDetails.accountName + ' ('+country.name+')') || 'Unknown' })
       });
       const data = await resp.json();
       
       setTimeout(() => {
         if (resp.ok && data.success) {
            setMsg(data.message || 'Transfer successful');
            setView('success');
         } else {
            setMsg(data.error || 'Transfer failed');
            setView('failed');
         }
       }, 1500);
     } catch(e: any) {
        setTimeout(() => {
           setMsg('Network error.');
           setView('failed');
        }, 1500);
     }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center overflow-hidden">
      <AnimatePresence mode="wait">
        
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md p-6 space-y-6"
          >
            <header className="pt-2">
              <h1 className="text-2xl font-bold text-slate-100">Transfer</h1>
            </header>

            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
               <input
                 type="text"
                 placeholder="Name, @safitag, or email"
                 className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-emerald-500 outline-none transition text-slate-100 placeholder-slate-500"
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setView('safitag')} className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-5 flex flex-col items-start gap-4 hover:bg-slate-700 transition">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                     <AtSign className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-200 mb-1">SafiTag</div>
                    <div className="text-xs text-slate-400 leading-relaxed">Send instantly to anyone on SafiPay</div>
                  </div>
               </button>
               <button onClick={() => setView('country')} className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-5 flex flex-col items-start gap-4 hover:bg-slate-700 transition">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                     <Globe className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-200 mb-1">Bank Transfer</div>
                    <div className="text-xs text-slate-400 leading-relaxed">Send to local or international banks</div>
                  </div>
               </button>
            </div>

            <div className="pt-4">
               <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">Recent Contacts</h3>
               
               <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-800/30 rounded-3xl border border-slate-700/30 border-dashed">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
                     <UserPlus className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">No contacts yet</h4>
                  <p className="text-xs text-slate-500 max-w-[200px]">When you send or receive money, your contacts will appear here.</p>
               </div>
            </div>
          </motion.div>
        )}

        {view === 'safitag' && (
          <motion.div 
            key="safitag"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-md p-6 h-full flex flex-col"
          >
             <header className="flex items-center gap-4 pt-2 mb-8">
                <button onClick={() => setView('list')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold">Send via SafiTag</h1>
             </header>

             <div className="flex-1">
                <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 bg-slate-800/50 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                   
                   <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-2">Recipient SafiTag</label>
                   <div className="flex items-center border-b-2 border-slate-700 focus-within:border-emerald-500 transition-colors py-2 mb-6">
                      <span className="text-emerald-500 font-bold text-xl mr-1">@</span>
                      <input 
                         type="text" 
                         className="w-full bg-transparent text-xl font-semibold text-slate-100 placeholder-slate-600 outline-none"
                         placeholder="username"
                         value={recipient}
                         onChange={(e) => setRecipient(e.target.value)}
                         autoFocus
                      />
                   </div>

                   <button onClick={() => setView('amount')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 mt-4 flex items-center justify-center gap-2">
                     Next <ArrowLeft className="w-5 h-5 rotate-180" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {view === 'country' && (
          <motion.div 
            key="country"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-md p-6 h-full flex flex-col"
          >
             <header className="flex items-center gap-4 pt-2 mb-6">
                <button onClick={() => setView('list')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold">Select Country</h1>
             </header>

             <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar pb-20">
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-widest font-semibold">Where are you sending to?</label>
                {COUNTRIES.map(c => (
                   <button 
                     key={c.code}
                     onClick={() => { setCountry(c); setView('bank'); }}
                     className="w-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 transition-colors rounded-2xl p-4 flex items-center justify-between"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 font-bold">
                            {c.code}
                         </div>
                         <div className="text-left">
                            <p className="font-semibold text-slate-200">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.currency}</p>
                         </div>
                      </div>
                   </button>
                ))}
             </div>
          </motion.div>
        )}

        {view === 'bank' && (
          <motion.div 
            key="bank"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-md p-6"
          >
             <header className="flex items-center gap-4 pt-2 mb-6">
                <button onClick={() => setView('country')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold">Bank Details</h1>
             </header>

             <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg font-bold">
                        {country.code}
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-200">Sending to {country.name}</h3>
                        <p className="text-xs text-slate-400">Currency: {country.currency}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                       <label className="text-xs text-slate-500 font-medium ml-1 block mb-1">Full Name of Account Holder</label>
                       <input 
                         type="text" 
                         value={bankDetails.accountName}
                         onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                         placeholder="e.g. John Doe"
                         className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 font-medium ml-1 block mb-1">
                          {country.code === 'US' ? 'Account Number' : country.code === 'GB' ? 'Account Number' : 'IBAN'}
                       </label>
                       <input 
                         type="text" 
                         value={bankDetails.accountNumber}
                         onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                         placeholder={country.code === 'US' ? 'Account Number' : 'Enter account number or IBAN'}
                         className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 font-medium ml-1 block mb-1">
                          {country.code === 'US' ? 'Routing Number' : country.code === 'GB' ? 'Sort Code' : 'SWIFT / BIC'}
                       </label>
                       <input 
                         type="text" 
                         value={bankDetails.bankCode}
                         onChange={(e) => setBankDetails({...bankDetails, bankCode: e.target.value})}
                         placeholder={country.code === 'US' ? '9-digit Routing Number' : country.code === 'GB' ? '6-digit Sort Code' : 'Enter bank code'}
                         className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                       />
                     </div>
                  </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setView('amount')} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                     Continue <ArrowLeft className="w-5 h-5 rotate-180" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {view === 'amount' && (
          <motion.div 
            key="amount"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-md p-6 h-full flex flex-col"
          >
             <header className="flex items-center gap-4 pt-2 mb-8">
                <button onClick={() => setView('list')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
                  <XIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center pr-10">
                   <h1 className="text-sm font-semibold text-slate-400">Transfer Amount</h1>
                </div>
             </header>

             <div className="flex-1 flex flex-col justify-center items-center pb-20">
                <div className="flex items-center justify-center text-5xl font-semibold text-slate-100 mb-2">
                   <span className="text-3xl text-emerald-500 mr-2">{country && bankDetails.accountName ? country.currency === 'GBP' ? '£' : country.currency === 'EUR' ? '€' : '$' : '$'}</span>
                   <input 
                      type="number" 
                      className="bg-transparent w-full text-center border-none outline-none focus:ring-0 p-0 text-slate-100 max-w-[200px]"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                   />
                </div>
                <div className="bg-slate-800/80 border border-slate-700 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mt-4">
                   <CardIcon className="w-4 h-4 text-emerald-400" />
                   <span className="text-xs font-medium text-slate-300">Balance: ${balance.toFixed(2)}</span>
                </div>
             </div>

             <div className="mt-auto pt-4">
                <button onClick={handleTransfer} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-[1.5rem] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 text-base">
                  Send <Send className="w-4 h-4 ml-1" />
                </button>
             </div>
          </motion.div>
        )}

        {view === 'processing' && (
           <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-xl font-bold text-slate-200">Processing Transfer...</h2>
              <p className="text-slate-400 text-sm">Please securely wait</p>
           </motion.div>
        )}

        {view === 'success' && (
           <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Transfer Successful!</h2>
                <p className="text-slate-400 text-sm">{msg}</p>
              </div>
              <button onClick={() => window.location.href = '/dashboard'} className="w-full mt-10 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-4 rounded-[1.5rem] transition-all max-w-[200px]">
                Back to Dashboard
              </button>
           </motion.div>
        )}

        {view === 'failed' && (
           <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
              <div className="w-24 h-24 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Transfer Failed</h2>
                <p className="text-red-400 text-sm font-medium">{msg}</p>
              </div>
              <button onClick={() => setView('amount')} className="w-full mt-10 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-4 rounded-[1.5rem] transition-all max-w-[200px]">
                Try Again
              </button>
           </motion.div>
        )}

      </AnimatePresence>
      
    </div>
  );
}

function XIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>;
}

