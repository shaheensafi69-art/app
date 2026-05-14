import { useEffect, useState } from 'react';
import { getCards, toggleCard, issueCard, getDashboard, deleteCard } from '../lib/api';

import { CreditCard, Eye, EyeOff, Lock, Globe, RotateCcw, X, CreditCard as CardIcon, MonitorSmartphone, Snowflake, Flame, Grid3x3, List, Settings, Gauge, Unlock, PenLine, Repeat, Shield, Trash2, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CARD_DESIGNS: Record<string, any> = {
  'Galaxy Black': {
    name: 'Galaxy Black',
    bgClass: "bg-slate-950",
    overlay: (
       <>
         <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-950/80 to-black"></div>
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-fuchsia-600/30 rounded-full blur-[70px] pointer-events-none"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[60px] pointer-events-none"></div>
         <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 24px', backgroundPosition: '0 0' }}></div>
         <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '15px 15px', backgroundPosition: '5px 5px' }}></div>
       </>
    ),
    textColor: "text-white",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
  },
  'Textured Gold': {
    name: 'Textured Gold',
    bgClass: "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600",
    overlay: (
       <>
         <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
         <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/30 via-transparent to-yellow-100/40 pointer-events-none mix-blend-overlay"></div>
         <div className="absolute top-[-20%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/40 to-transparent blur-[30px] mix-blend-overlay"></div>
       </>
    ),
    textColor: "text-amber-950",
    filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.5))"
  },
  'Platinum': {
    name: 'Platinum',
    bgClass: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400",
    overlay: (
       <>
         <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
         <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.8)_0deg,transparent_60deg,rgba(255,255,255,0.8)_180deg,transparent_240deg,rgba(255,255,255,0.8)_360deg)] opacity-40 mix-blend-overlay pointer-events-none blur-2xl"></div>
       </>
    ),
    textColor: "text-slate-800",
    filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.6))"
  },
  'Ruby Red': {
    name: 'Ruby Red',
    bgClass: "bg-gradient-to-br from-rose-500 via-red-600 to-red-900",
    overlay: (
       <>
          <div className="absolute inset-0 opacity-[0.3] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
          <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-orange-400/30 to-transparent blur-[40px] pointer-events-none"></div>
       </>
    ),
    textColor: "text-white",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
  },
  'Emerald Green': {
    name: 'Emerald Green',
    bgClass: "bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-900",
    overlay: (
       <>
          <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-[100%] h-[100%] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-green-300/30 to-transparent blur-[50px] pointer-events-none"></div>
       </>
    ),
    textColor: "text-white",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
  },
  'Sapphire Blue': {
    name: 'Sapphire Blue',
    bgClass: "bg-gradient-to-br from-blue-400 via-indigo-600 to-blue-900",
    overlay: (
       <>
          <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
       </>
    ),
    textColor: "text-white",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
  },
  'Amethyst Purple': {
    name: 'Amethyst Purple',
    bgClass: "bg-gradient-to-br from-fuchsia-500 via-purple-600 to-purple-900",
    overlay: (
       <>
         <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 2px, transparent 2px)', backgroundSize: '30px 30px', backgroundPosition: '0 0' }}></div>
         <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[70%] bg-pink-400/30 blur-[60px] pointer-events-none"></div>
       </>
    ),
    textColor: "text-white",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
  }
};

export default function Cards() {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addingStep, setAddingStep] = useState<'type' | 'design'>('type');
  const [selectedDesign, setSelectedDesign] = useState<string>('Galaxy Black');
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [viewingPin, setViewingPin] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState<{title: string, desc: string} | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  
  const handleInteraction = (title: string, desc: string) => {
    setInteractionMessage({ title, desc });
  };
  
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
       getDashboard(userId).then(res => {
         if (res.user) setKycStatus(res.user.kycStatus);
       }).catch(console.error);

      getCards(userId).then(data => {
        if (data.error) {
           console.error("Cards error: ", data.error);
        } else {
           setCards(data.cards);
        }
      }).catch(console.error);
    }
  }, [userId]);

  if (kycStatus && kycStatus !== 'approved') {
     return (
       <div className="min-h-[100dvh] flex flex-col items-center border-t border-white/5">
         <div className="w-full max-w-md p-6 flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
               <Shield className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Verification Required</h2>
            <p className="text-slate-400 mb-8 max-w-[280px]">
               You need to verify your identity to access and issue virtual cards.
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

  const activeCard = cards[activeIndex];
  const activeDesign = activeCard ? (CARD_DESIGNS[activeCard.design] || CARD_DESIGNS['Galaxy Black']) : CARD_DESIGNS['Galaxy Black'];

  const handleToggleFreeze = async () => {
    if (!activeCard) return;
    const newStatus = activeCard.status === 'active' ? 'inactive' : 'active';
    await toggleCard(userId!, activeCard.stripeCardId, newStatus);
    const newCards = [...cards];
    newCards[activeIndex] = { ...activeCard, status: newStatus };
    setCards(newCards);
  };

  const handleIssueCard = async (type: 'virtual' | 'physical') => {
    if (type === 'physical') {
       handleInteraction('Coming Soon', 'Physical cards will be available to order very soon. Stay tuned!');
       setIsAdding(false);
       return;
    }
    
    if (addingStep === 'type') {
       setAddingStep('design');
       return;
    }

    setIssuing(true);
    setIssueError(null);
    try {
       const newCard = await issueCard(userId!, type, cardholderName, selectedDesign);
       if (newCard.error) {
         setIssueError(newCard.error);
       } else {
         setCards(prev => [...prev, newCard]);
         setActiveIndex(cards.length);
         setIsAdding(false);
         setCardholderName('');
         setAddingStep('type');
       }
    } catch(err: any) {
       setIssueError(err.message || "An error occurred while issuing the card.");
    }
    setIssuing(false);
  }

  const handleDeleteCard = async () => {
    if (!activeCard) return;
    try {
        await deleteCard(userId!, activeCard.stripeCardId);
        setCards(cards.filter(c => c.id !== activeCard.id));
        setActiveIndex(0);
        setInteractionMessage({ title: 'Card Deleted', desc: 'The virtual card has been permanently deleted.' });
    } catch(err) {
        console.error(err);
    }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center">
      <div className="w-full max-w-md p-6 space-y-8">
        
        <header className="pt-2 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Your Cards</h1>
          {cards.length < 3 && (
            <button 
               onClick={() => setIsAdding(true)}
               className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-emerald-400 border-emerald-500/30">
               <PlusIcon className="w-5 h-5" />
            </button>
          )}
        </header>

        {activeCard ? (
          <div className="flex flex-col items-center w-full">
            <div className="relative h-56 w-full perspective-1000 mt-6 group" onClick={() => setFlipped(!flipped)}>
              <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotateY: flipped ? 180 : 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                className="w-full h-full relative preserve-3d cursor-pointer"
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              >
                {/* Front of Card */}
                <div className={`absolute w-full h-full backface-hidden rounded-[2rem] p-6 border flex flex-col justify-between overflow-hidden shadow-2xl border-white/10 ${activeDesign.bgClass}`}>
                  {activeDesign.overlay}
                  
                  {/* Huge cut-off VISA logo */}
                  <div className={`absolute -right-8 -bottom-10 text-[140px] font-black italic pointer-events-none z-0 tracking-tighter leading-none opacity-10 mix-blend-overlay ${activeDesign.textColor}`}>
                    VISA
                  </div>

                  {activeCard.status === 'inactive' && (
                     <>
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[4px] pointer-events-none z-10 border-[0.5px] border-white/50"></div>
                     </>
                  )}
                  
                  <div className="flex justify-between items-start relative z-20">
                    <img 
                      src="/logo.png" 
                      alt="SafiPay" 
                      className={`h-12 object-contain drop-shadow-md ${activeCard.status === 'active' ? '' : 'grayscale opacity-60'}`} 
                    />
                    <WifiIcon className={`w-8 h-8 rotate-90 opacity-80 ${activeCard.status === 'active' ? activeDesign.textColor : 'text-slate-800'}`} style={{ filter: activeCard.status === 'active' ? activeDesign.filter : 'none' }} />
                  </div>

                  {activeCard.status === 'inactive' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pb-4">
                        <Snowflake className="w-10 h-10 text-slate-800" strokeWidth={1.5} />
                        <span className="text-slate-800 font-bold mt-2 tracking-wide uppercase text-sm drop-shadow-sm">Frozen</span>
                     </div>
                  )}
                  
                  <div className="relative z-20">
                    <div className={`text-[10.px] mb-1.5 uppercase tracking-widest font-bold flex items-center gap-1.5 opacity-90 ${activeCard.status === 'active' ? activeDesign.textColor : 'text-slate-800 drop-shadow-sm'}`}>
                       {activeCard.type === 'physical' ? <CardIcon className="w-3.5 h-3.5"/> : <MonitorSmartphone className="w-3.5 h-3.5"/>}
                       {activeCard.type}
                    </div>
                    <div className={`text-lg sm:text-xl font-mono tracking-[0.16em] flex justify-between items-end gap-2 mt-1 ${activeCard.status === 'active' ? activeDesign.textColor : 'text-slate-800 drop-shadow-sm'}`} style={{ filter: activeCard.status === 'active' ? activeDesign.filter : 'none' }}>
                      <span className="whitespace-nowrap">**** **** **** {activeCard.last4}</span>
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="absolute w-full h-full backface-hidden rounded-[2rem] bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
                  <div className="w-full h-12 bg-black/80 mt-6"></div>
                  <div className="p-6 pt-4">
                    <div className="w-full bg-slate-700/50 rounded p-2 mb-4 flex justify-between items-center h-10">
                      <span className="font-mono text-[13px] tracking-widest text-slate-300">
                        {showDetails ? `4124 9381 2911 ${activeCard.last4}` : '•••• •••• •••• ••••'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                        className="text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded text-xs font-medium"
                      >
                        {showDetails ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-[2]">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Expiry Date</div>
                          <div className="bg-slate-700/50 rounded p-2 h-8 font-mono text-sm text-slate-300">
                            {showDetails ? `${activeCard.expMonth?.toString().padStart(2, '0') || '12'}/${activeCard.expYear?.toString().slice(-2) || '28'}` : '•• / ••'}
                          </div>
                       </div>
                       <div className="flex-1">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">CVV</div>
                          <div className="bg-slate-700/50 rounded p-2 h-8 font-mono text-sm text-slate-300">
                            {showDetails ? '203' : '•••'}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              </AnimatePresence>
            </div>
            
            {cards.length > 1 && (
              <div className="flex gap-2 justify-center mt-6">
                 {cards.map((_, i) => (
                    <button 
                       key={i} 
                       onClick={() => { setActiveIndex(i); setFlipped(false); setShowDetails(false); }}
                       className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-emerald-500 w-6' : 'bg-slate-700 w-2'}`}
                    />
                 ))}
              </div>
            )}
            
            <div className="text-center font-bold text-sm text-slate-200 mt-6 mb-2 flex items-center justify-center gap-2">
               {activeCard.type === 'physical' ? 'Physical card' : 'Virtual card'} 
               <span className="opacity-60 font-mono font-medium tracking-widest text-xs">•••• {activeCard.last4}</span>
            </div>

            <div className="pt-2 flex pl-1 text-sm text-slate-400 gap-1 items-center justify-center mb-6 mt-2">
              <RotateCcw className="w-3 h-3" /> <span className="text-xs">Tap card to flip</span>
            </div>
          </div>
        ) : (
          <div className="h-56 w-full glass-card rounded-3xl flex items-center justify-center flex-col text-slate-400 text-center px-6">
            <CreditCard className="w-12 h-12 mb-4 opacity-50 text-emerald-500" />
            <p>You don't have any cards.</p>
            <button onClick={() => setIsAdding(true)} className="mt-4 px-4 py-2 bg-emerald-500 text-slate-900 rounded-xl font-medium text-sm">Issue Card</button>
          </div>
        )}

        {/* Management Options */}
        {activeCard && (
        <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Main Action Buttons */}
          <div className="flex justify-center gap-6 px-4">
            {activeCard.type === 'physical' && (
               <button onClick={() => setViewingPin(true)} className="flex flex-col items-center gap-2 group">
                 <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all group-active:scale-95 group-hover:bg-emerald-500/30">
                   <Grid3x3 className="w-6 h-6" />
                 </div>
                 <span className="text-[11px] font-medium text-emerald-400">Show PIN</span>
               </button>
            )}
            
            <button onClick={() => { setFlipped(!flipped); setShowDetails(!showDetails); }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center transition-all group-active:scale-95 border border-slate-700/50 group-hover:bg-slate-700">
                <CardIcon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-medium text-emerald-400">Card details</span>
            </button>
            
            <button 
              onClick={handleToggleFreeze}
              disabled={activeCard.status === 'canceled'}
              className="flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group-active:scale-95 border 
                 ${activeCard.status === 'inactive' ? 'bg-emerald-500/20 text-emerald-400 border-transparent group-hover:bg-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-transparent group-hover:bg-amber-500/20'}`}
              >
                {activeCard.status === 'inactive' ? <Flame className="w-6 h-6" /> : <Snowflake className="w-6 h-6" />}
              </div>
              <span className={`text-[11px] font-medium ${activeCard.status === 'inactive' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {activeCard.status === 'inactive' ? 'Unfreeze card' : 'Freeze card'}
              </span>
            </button>
          </div>

          {/* Notification Card */}
          {activeCard.type === 'physical' && activeCard.status === 'inactive' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-[1.5rem] p-4 flex gap-4 items-center">
               <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                 <span className="text-white font-bold text-xl drop-shadow-md z-10 italic">1</span>
               </div>
               <div>
                  <p className="text-sm text-slate-200">Your card should have arrived</p>
                  <button onClick={() => handleInteraction('Pending Activation', 'Your physical card is on the way! Once it arrives, use the Activate physical card flow to start using it.')} className="text-emerald-400 text-sm font-medium mt-1">More info</button>
               </div>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">Manage card</h3>
            
            <div className="space-y-1">
               <button onClick={() => handleInteraction('Recent Transactions', 'You have no recent transactions on this card.')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition">
                  <div className="flex items-center gap-4">
                     <List className="w-5 h-5 text-slate-400" />
                     <span className="text-sm font-medium text-slate-200">View recent card transactions</span>
                  </div>
                  <ChevronRightIcon />
               </button>
               
               <button onClick={() => handleInteraction('Card Controls', 'Card controls (such as contactless toggle, online payments) will be available once the card is active.')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition">
                  <div className="flex items-center gap-4">
                     <Settings className="w-5 h-5 text-slate-400" />
                     <span className="text-sm font-medium text-slate-200">Card controls</span>
                  </div>
                  <ChevronRightIcon />
               </button>

               <button onClick={() => handleInteraction('Spending Limits', 'Daily limit: £10,000\nMonthly limit: £50,000')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition">
                  <div className="flex items-center gap-4">
                     <Gauge className="w-5 h-5 text-slate-400" />
                     <span className="text-sm font-medium text-slate-200">Your spending limits</span>
                  </div>
                  <ChevronRightIcon />
               </button>
               
               <button onClick={() => handleInteraction('Unblock PIN', 'Your PIN is currently active and not blocked. If you enter it wrong 3 times at an ATM, you can unblock it here.')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition">
                  <div className="flex items-center gap-4">
                     <Unlock className="w-5 h-5 text-slate-400" />
                     <span className="text-sm font-medium text-slate-200">Unblock PIN</span>
                  </div>
                  <ChevronRightIcon />
               </button>

               <button onClick={() => handleInteraction('Card Label', 'This feature allows you to rename this card (e.g. Groceries).')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition">
                  <div className="flex items-center gap-4">
                     <PenLine className="w-5 h-5 text-slate-400" />
                     <span className="text-sm font-medium text-slate-200">Card label</span>
                  </div>
                  <ChevronRightIcon />
               </button>
               
               {activeCard.type === 'virtual' ? (
                 <button onClick={() => { if(confirm('Are you sure you want to permanently delete this card?')) handleDeleteCard(); }} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition text-rose-500 hover:text-rose-400">
                    <div className="flex items-center gap-4">
                       <Trash2 className="w-5 h-5 text-rose-500/70" />
                       <span className="text-sm font-medium">Delete card</span>
                    </div>
                    <ChevronRightIcon />
                 </button>
               ) : (
                 <button onClick={() => handleInteraction('Replace Card', 'If your card is lost or stolen, you can order a replacement for £5.00.')} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition text-rose-500 hover:text-rose-400">
                    <div className="flex items-center gap-4">
                       <Repeat className="w-5 h-5 text-rose-500/70" />
                       <span className="text-sm font-medium">Replace card</span>
                    </div>
                    <ChevronRightIcon />
                 </button>
               )}
            </div>
          </div>
        </div>
        )}
      </div>

      <AnimatePresence>
        {viewingPin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setViewingPin(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl relative"
               onClick={e => e.stopPropagation()}
             >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                   <Grid3x3 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Your Card PIN</h3>
                <p className="text-slate-400 text-sm mb-8">Memorize this PIN. Never share it with anyone.</p>
                <div className="flex justify-center gap-4 mb-8">
                   {[1, 9, 8, 4].map((num, i) => (
                      <div key={i} className="w-12 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-3xl font-mono text-emerald-400 font-bold border border-slate-700/50 shadow-inner">
                         {num}
                      </div>
                   ))}
                </div>
                <button onClick={() => setViewingPin(false)} className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition">
                   Close
                </button>
             </motion.div>
          </motion.div>
        )}

        {interactionMessage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setInteractionMessage(null)}
          >
             <motion.div 
               initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
               className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full relative sm:mb-0 mb-8"
               onClick={e => e.stopPropagation()}
             >
                <button 
                  onClick={() => setInteractionMessage(null)}
                  className="absolute top-4 right-4 text-slate-500 bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
                >
                   <X className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold mb-3 text-slate-100">{interactionMessage.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{interactionMessage.desc}</p>
                <button onClick={() => setInteractionMessage(null)} className="w-full py-3 bg-emerald-500 rounded-xl text-slate-900 font-medium">
                   Got it
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative pb-10 sm:pb-6"
            >
              <button 
                onClick={() => { setIsAdding(false); setAddingStep('type'); }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
              
              {addingStep === 'type' ? (
                <>
                  <h2 className="text-xl font-bold mb-2">Create New Card</h2>
                  <p className="text-slate-400 text-sm mb-6">Choose how you want to use your SafiPay card.</p>
                  
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-slate-400 mb-2">Cardholder Name (Optional)</label>
                     <input 
                       type="text" 
                       value={cardholderName}
                       onChange={e => setCardholderName(e.target.value)}
                       placeholder="Name on card"
                       className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                     />
                  </div>
    
                  <div className="space-y-4">
                     <button 
                       onClick={() => handleIssueCard('virtual')}
                       disabled={issuing || cards.filter(c => c.type === 'virtual').length >= 3}
                       className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50 text-left disabled:opacity-50"
                     >
                       <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                         <MonitorSmartphone className="w-6 h-6" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-slate-200 flex items-center gap-2">Virtual Card {cards.filter(c => c.type === 'virtual').length >= 3 && <span className="text-[10px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded uppercase">Limit Reached</span>}</h3>
                         <p className="text-xs text-slate-400 mt-1">Available instantly for online purchases. Add to Apple/Google Pay.</p>
                       </div>
                     </button>
    
                     <button 
                       onClick={() => handleIssueCard('physical')}
                       disabled={issuing}
                       className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 transition border border-slate-700/50 text-left disabled:opacity-50"
                     >
                       <div className="w-12 h-12 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center shrink-0">
                         <CardIcon className="w-6 h-6" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-slate-200">Physical Card</h3>
                         <p className="text-xs text-slate-400 mt-1">Receive a physical card in the mail. Takes 5-7 business days.</p>
                       </div>
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full max-h-[80vh]">
                  <div className="flex items-center gap-3 mb-6">
                     <button onClick={() => setAddingStep('type')} className="p-2 rounded-full bg-slate-800 text-slate-300">
                        <ArrowLeft className="w-4 h-4" />
                     </button>
                     <h2 className="text-xl font-bold">Choose Design</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4">
                     {Object.values(CARD_DESIGNS).map((design: any) => (
                        <button 
                           key={design.name}
                           onClick={() => setSelectedDesign(design.name)}
                           className={`w-full relative rounded-[2rem] p-6 text-left border-2 overflow-hidden h-40 transition-all ${selectedDesign === design.name ? 'border-emerald-500 scale-[0.98]' : 'border-transparent hover:scale-[0.99]'} ${design.bgClass}`}
                        >
                           {design.overlay}
                           <div className="relative z-20 h-full flex flex-col justify-between">
                             <div className="flex justify-between items-start">
                               <img src="/logo.png" alt="SafiPay" className="h-8 object-contain drop-shadow-md" />
                               {selectedDesign === design.name && (
                                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900">
                                     <Check className="w-4 h-4" />
                                  </div>
                               )}
                             </div>
                             <div className={`font-medium tracking-wide ${design.textColor}`} style={{ filter: design.filter }}>
                                {design.name}
                             </div>
                           </div>
                        </button>
                     ))}
                  </div>

                  <button 
                     onClick={() => handleIssueCard('virtual')}
                     disabled={issuing}
                     className="w-full py-4 mt-4 bg-emerald-500 text-slate-900 rounded-xl font-bold disabled:opacity-50"
                  >
                     {issuing ? 'Ordering...' : 'Order Virtual Card'}
                  </button>
                </div>
              )}
              
              {issueError && (
                 <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                   {issueError}
                 </div>
              )}

              {issuing && <p className="text-emerald-400 text-sm text-center mt-6 animate-pulse">Provisioning with Stripe Issuing...</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PlusIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
}

function WifiIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>;
}

function ChevronRightIcon(props: any) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-slate-500" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
}
