import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../lib/api';
import { ShieldCheck, Wallet, UserCircle, LogIn, UserPlus, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ONBOARDING_SLIDES = [
  {
    title: "Welcome to SafiPay",
    desc: "Your secure digital wallet for seamless global transfers.",
    icon: <Wallet className="w-16 h-16 text-emerald-400" />
  },
  {
    title: "Instant Transfers",
    desc: "Send and receive money instantly across borders with low fees.",
    icon: <ChevronRight className="w-16 h-16 text-emerald-400" /> // Using a simple icon
  },
  {
    title: "Bank Grade Security",
    desc: "Your funds are protected with industry-leading encryption and security.",
    icon: <ShieldCheck className="w-16 h-16 text-emerald-400" />
  }
];

export default function Welcome() {
  // view can be 'onboarding', 'landing', 'auth'
  const [view, setView] = useState<'onboarding' | 'landing' | 'auth'>('onboarding');
  const [slideIndex, setSlideIndex] = useState(0);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
     // Intentionally omitting localStorage check so it always shows onboarding as requested by user
  }, []);

  const handleNextSlide = () => {
     if (slideIndex < ONBOARDING_SLIDES.length - 1) {
        setSlideIndex(prev => prev + 1);
     } else {
        localStorage.setItem('onboardingCompleted', 'true');
        setView('landing');
     }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await loginUser(email, password);
      } else {
        res = await registerUser(email, password, firstName, lastName);
      }
      
      if (res.error) {
        alert("Authentication failed: " + res.error);
      } else {
        localStorage.setItem('userId', res.id);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      alert("Authentication failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 overflow-hidden relative">
      <AnimatePresence mode="wait">
        
        {view === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md h-[500px] flex flex-col items-center justify-between"
          >
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <AnimatePresence mode="wait">
                   <motion.div
                     key={slideIndex}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.2 }}
                     transition={{ duration: 0.3 }}
                   >
                      <div className="w-32 h-32 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.15)] border border-emerald-500/20">
                         {ONBOARDING_SLIDES[slideIndex].icon}
                      </div>
                      <h2 className="text-3xl font-bold text-slate-100 tracking-tight">{ONBOARDING_SLIDES[slideIndex].title}</h2>
                      <p className="border-t border-slate-700/50 mt-6 pt-6 text-slate-400 font-medium px-4">{ONBOARDING_SLIDES[slideIndex].desc}</p>
                   </motion.div>
                </AnimatePresence>
             </div>
             
             <div className="w-full flex-shrink-0 pt-8 pb-4">
                <div className="flex justify-center space-x-2 mb-8">
                   {ONBOARDING_SLIDES.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === slideIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
                   ))}
                </div>
                <button
                  onClick={handleNextSlide}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold tracking-wide py-4 rounded-[1.5rem] transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                >
                  {slideIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Next"}
                </button>
             </div>
          </motion.div>
        )}

        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md h-[550px] flex flex-col items-center justify-center"
          >
             <div className="flex-1 flex flex-col items-center justify-center relative">
               <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20 blur-[100px]"></div>
               <img src="/logo.png" alt="Safi Pay Logo" className="w-48 h-48 object-contain mb-8 relative z-10 drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
               }} />
               <h1 className="text-4xl font-bold tracking-tight text-white relative z-10">Safi Pay</h1>
             </div>

             <div className="w-full flex-shrink-0 space-y-4 pt-10">
                <button
                  onClick={() => { setIsLogin(false); setView('auth'); }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold tracking-wide py-4 text-lg rounded-[1.5rem] transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center"
                >
                  Sign Up <UserPlus className="w-5 h-5 ml-2" />
                </button>
                <button
                  onClick={() => { setIsLogin(true); setView('auth'); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold tracking-wide py-4 text-lg rounded-[1.5rem] transition-all flex items-center justify-center"
                >
                  Login <LogIn className="w-5 h-5 ml-2" />
                </button>
             </div>
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl"
          >
            <button onClick={() => setView('landing')} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors">
               ← Back
            </button>
            <div className="flex justify-center mb-6 mt-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = 'hidden';
                }} />
              </div>
            </div>
            
            <h1 className="text-3xl font-semibold tracking-tight text-center text-slate-50 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-400 text-center mb-8 text-sm">
              {isLogin ? 'Sign in to access your wallet.' : 'Join Safi Pay to start thriving.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                          placeholder="First Name"
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                          placeholder="Last Name"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                  placeholder="Email address"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                  placeholder="Password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold tracking-wide py-4 text-base rounded-[1.2rem] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-6"
              >
                {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Wallet')}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
               <button 
                 type="button" 
                 onClick={() => setIsLogin(!isLogin)}
                 className="text-slate-400 text-sm hover:text-emerald-400 transition-colors font-medium"
               >
                 {isLogin ? "New user? Create an account" : "Already have an account? Sign in"}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
