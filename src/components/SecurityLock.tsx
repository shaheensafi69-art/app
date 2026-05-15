import React, { useState, useEffect } from 'react';
import { Fingerprint, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { updateBiometricStatus } from '../lib/api';

export default function SecurityLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'check' | 'setup' | 'confirm' | 'biometric_offer' | 'unlock' | 'unlocked'>('check');
  const [error, setError] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricEnabledLocally, setBiometricEnabledLocally] = useState(false);

  useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setIsBiometricSupported(available);
      });
    }

    const storedHash = localStorage.getItem('safi_pin');
    const hasBiometric = localStorage.getItem('safi_biometric') === 'true';
    if (hasBiometric) setBiometricEnabledLocally(true);
    
    const sessionUnlocked = sessionStorage.getItem('safi_unlocked');

    if (sessionUnlocked === 'true') {
      setIsLocked(false);
      setStep('unlocked');
    } else if (storedHash) {
      setStep('unlock');
      if (hasBiometric) {
         // Auto trigger biometric on return if it's already set up
         setTimeout(() => handleBiometric(true), 500); 
      }
    } else {
      setStep('setup');
    }
  }, []);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length < 4) {
       setError("PIN must be at least 4 digits");
       return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin === confirmPin) {
       localStorage.setItem('safi_pin', setupPin);
       setError('');
       if (isBiometricSupported) {
          setStep('biometric_offer');
       } else {
          sessionStorage.setItem('safi_unlocked', 'true');
          setIsLocked(false);
          setStep('unlocked');
       }
    } else {
       setError("PINs do not match. Try again.");
       setConfirmPin('');
       setSetupPin('');
       setStep('setup');
    }
  };

  const handleEnableBiometric = async () => {
     try {
         const challenge = new Uint8Array(32);
         crypto.getRandomValues(challenge);
         
         const credential = await navigator.credentials.get({
             publicKey: {
                 challenge,
                 rpId: window.location.hostname,
                 userVerification: "required"
             }
         });
         
         if (credential) {
             localStorage.setItem('safi_biometric', 'true');
             await updateBiometricStatus(true);
             sessionStorage.setItem('safi_unlocked', 'true');
             setIsLocked(false);
             setStep('unlocked');
         }
     } catch (err: any) {
         setError("Setup failed. Proceeding without biometrics.");
         setTimeout(() => {
            sessionStorage.setItem('safi_unlocked', 'true');
            setIsLocked(false);
            setStep('unlocked');
         }, 1500);
     }
  };

  const skipBiometric = () => {
      localStorage.setItem('safi_biometric', 'false');
      updateBiometricStatus(false);
      sessionStorage.setItem('safi_unlocked', 'true');
      setIsLocked(false);
      setStep('unlocked');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem('safi_pin');
    if (pin === stored) {
       sessionStorage.setItem('safi_unlocked', 'true');
       setIsLocked(false);
       setStep('unlocked');
    } else {
       setError("Incorrect PIN");
       setPin('');
    }
  };

  const handleBiometric = async (silent = false) => {
     try {
         const challenge = new Uint8Array(32);
         crypto.getRandomValues(challenge);
         
         const credential = await navigator.credentials.get({
             publicKey: {
                 challenge,
                 rpId: window.location.hostname,
                 userVerification: "required"
             }
         });
         
         if (credential) {
             sessionStorage.setItem('safi_unlocked', 'true');
             setIsLocked(false);
             setStep('unlocked');
         }
     } catch (err: any) {
         if (!silent) setError("Biometric authentication failed or was cancelled.");
     }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#070b14] flex flex-col items-center justify-center p-6">
       <div className="w-full max-w-sm glass-card p-8 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shadow-inner border border-emerald-500/30 text-emerald-400">
             <Lock className="w-10 h-10" />
          </div>

          {step === 'setup' && (
             <form onSubmit={handleSetup} className="w-full flex flex-col items-center">
                <h2 className="text-xl font-bold text-white mb-2">Enhance Data Security</h2>
                <p className="text-sm text-slate-400 text-center mb-8">Set up a 4+ digit PIN to protect your banking application.</p>
                <input 
                  type="password" 
                  value={setupPin}
                  onChange={(e) => { setSetupPin(e.target.value); setError(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                <button type="submit" className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl transition-colors">
                   Next
                </button>
             </form>
          )}

          {step === 'confirm' && (
             <form onSubmit={handleConfirm} className="w-full flex flex-col items-center">
                <h2 className="text-xl font-bold text-white mb-2">Confirm PIN</h2>
                <p className="text-sm text-slate-400 text-center mb-8">Re-enter your PIN to confirm.</p>
                <input 
                  type="password" 
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value); setError(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                <button type="submit" className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl transition-colors">
                   Confirm & Secure
                </button>
             </form>
          )}

          {step === 'biometric_offer' && (
             <div className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex flex-col items-center justify-center mb-4 text-emerald-400">
                    <Fingerprint className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Enable Biometrics</h2>
                <p className="text-sm text-slate-400 text-center mb-8">Use your device's fingerprint or Face ID for faster login.</p>
                {error && <p className="text-amber-400 text-xs mb-4">{error}</p>}
                
                <button onClick={handleEnableBiometric} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl transition-colors mb-3">
                   Enable Biometric Login
                </button>
                <button onClick={skipBiometric} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-colors">
                   Skip for now
                </button>
             </div>
          )}

          {step === 'unlock' && (
             <form onSubmit={handleUnlock} className="w-full flex flex-col items-center">
                <h2 className="text-xl font-bold text-white mb-2">App Locked</h2>
                <p className="text-sm text-slate-400 text-center mb-8">Enter PIN {biometricEnabledLocally ? 'or use Biometrics ' : ''}to access your account.</p>
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-emerald-500 transition-colors text-white mb-4"
                  placeholder="••••"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                
                <div className="flex gap-4 w-full">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl transition-colors">
                     Unlock
                  </button>
                  {isBiometricSupported && (
                    <button type="button" onClick={() => handleBiometric(false)} className="w-14 shrink-0 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold rounded-xl transition-colors flex justify-center items-center">
                       <Fingerprint className="w-6 h-6" />
                    </button>
                  )}
                </div>
             </form>
          )}
       </div>
    </div>
  );
}
