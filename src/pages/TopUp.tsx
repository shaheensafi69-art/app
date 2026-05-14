import { useState, useEffect } from 'react';

import { ArrowLeft, CreditCard, CheckCircle2, ShieldCheck, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDashboard } from '../lib/api';

export default function TopUp() {
  const [amount, setAmount] = useState('100');
  const [step, setStep] = useState<'amount' | 'card' | 'processing' | 'success' | 'failed'>('amount');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  
  const userId = localStorage.getItem('userId');

  useEffect(() => {
     if (userId) {
         getDashboard(userId).then(res => {
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
               You need to verify your identity to add money to your account.
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

  const handleTopUp = async () => {
    if (!cardNumber || cardNumber.length < 12) {
       alert("Please enter a valid card number.");
       return;
    }
    setStep('processing');
    try {
      const resp = await fetch(`/api/topup/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), cardNumber })
      });
      const data = await resp.json();
      
      setTimeout(() => {
        if (resp.ok && data.success) {
           setPaymentMessage(data.message || 'Payment Successful via Webhook');
           setStep('success');
        } else {
           setPaymentMessage(data.error || 'Payment Failed via Webhook');
           setStep('failed');
        }
      }, 1500);
    } catch (e: any) {
      setTimeout(() => {
         setPaymentMessage(e.message || 'Network error.');
         setStep('failed');
      }, 1500);
    }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-md p-6 h-full flex flex-col pt-12">
        
        <header className="flex items-center gap-4 pt-2 mb-8 absolute top-6 w-full max-w-md px-6 z-10 left-1/2 -translate-x-1/2">
           <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="text-lg font-bold flex-1 text-center pr-10 text-slate-100">Add Money</h1>
        </header>

        <AnimatePresence mode="wait">
          {step === 'amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col min-h-[500px]">
               <div className="flex-1 flex flex-col items-center justify-center py-10 mt-10">
                  <h3 className="text-slate-400 font-medium mb-6">How much to add?</h3>
                  <div className="flex items-center text-5xl font-bold text-slate-100">
                     <span className="text-3xl mr-2 text-emerald-500 font-normal">$</span>
                     <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="bg-transparent border-none outline-none w-32 text-center focus:ring-0 p-0 text-slate-100"
                        placeholder="0"
                        autoFocus
                     />
                  </div>
                  <div className="flex gap-3 mt-8">
                     {[50, 100, 250, 500].map(val => (
                       <button key={val} onClick={() => setAmount(val.toString())} className="px-5 py-2 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-emerald-500/50 transition font-medium text-slate-300">
                         ${val}
                       </button>
                     ))}
                  </div>
               </div>
               <button onClick={() => setStep('card')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-[1.5rem] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-auto mb-4 text-lg">
                 Continue
               </button>
            </motion.div>
          )}

          {step === 'card' && (
            <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col min-h-[500px] mt-10">
               <div className="bg-slate-800/50 rounded-[2rem] p-6 border border-slate-700/50 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-200">Debit / Credit Card</h3>
                        <p className="text-xs text-slate-400">Securely top-up your balance</p>
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                     <div>
                       <label className="text-xs font-medium text-slate-500 ml-1 block mb-1">Card Number</label>
                       <input 
                         type="text" 
                         value={cardNumber}
                         onChange={e => setCardNumber(e.target.value)}
                         placeholder="0000 0000 0000 0000"
                         className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-medium text-slate-500 ml-1 block mb-1">Expiry Date</label>
                         <input 
                           type="text" 
                           value={expiry}
                           onChange={e => setExpiry(e.target.value)}
                           placeholder="MM/YY"
                           className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-medium text-slate-500 ml-1 block mb-1">CVC</label>
                         <input 
                           type="text" 
                           value={cvc}
                           onChange={e => setCvc(e.target.value)}
                           placeholder="123"
                           className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                         />
                       </div>
                     </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2 opactiy-80 relative z-10">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stripe Secure Connection</span>
                  </div>
               </div>

               <div className="mt-8 flex justify-between items-center px-2">
                 <span className="text-slate-400">Total to pay</span>
                 <span className="text-xl font-bold text-slate-100">${parseFloat(amount).toFixed(2)}</span>
               </div>

               <button onClick={handleTopUp} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-[1.5rem] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-auto mb-4 text-lg">
                 Pay ${parseFloat(amount).toFixed(2)}
               </button>
            </motion.div>
          )}

          {step === 'processing' && (
             <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[500px]">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <h2 className="text-xl font-bold text-slate-200">Verifying with Provider...</h2>
                <p className="text-slate-400 text-sm">Please securely wait for Webhook response</p>
             </motion.div>
          )}

          {step === 'failed' && (
             <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
                <div className="w-24 h-24 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                   <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">Payment Failed</h2>
                  <p className="text-red-400 text-sm font-medium">{paymentMessage}</p>
                </div>
                <button onClick={() => setStep('card')} className="w-full mt-10 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-4 rounded-[1.5rem] transition-all">
                  Try Again
                </button>
             </motion.div>
          )}

          {step === 'success' && (
             <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                   <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">Top-up Successful!</h2>
                  <p className="text-slate-400 text-sm">{paymentMessage}</p>
                </div>
                <button onClick={() => window.location.href = '/dashboard'} className="w-full mt-10 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-4 rounded-[1.5rem] transition-all">
                  Back to Dashboard
                </button>
             </motion.div>
          )}

        </AnimatePresence>

      </div>
      
    </div>
  );
}
