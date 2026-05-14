import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSumsubToken, completeKyc } from '../lib/api';

import { UserCheck, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import SumsubWebSdk from '@sumsub/websdk-react';

export default function Kyc() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    
    getSumsubToken(userId).then(data => {
      setLoading(false);
      if (data.token) {
        setToken(data.token);
      } else {
        setErrorMsg(data.error || "Failed to load KYC token");
      }
    }).catch(err => {
      setLoading(false);
      setErrorMsg(err.message);
    });
  }, [userId, navigate]);

  const handleKycStatusUpdate = async (status: string, sumsubId?: string) => {
    // We update our database so the profile shows the right status string
    // status could be 'pending', 'approved', 'rejected'
    await fetch('/api/kyc/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, status, sumsubId })
    });
    // refresh profile or navigate
    if (status === 'approved') {
       navigate('/dashboard');
    }
  };

  const snsWebSdkHandler = (message: any, payload: any) => {
     console.log("Sumsub msg:", message, payload);
     
     const applicantId = payload?.applicantId;

     if (message === 'idCheck.onApplicantLoaded') {
        if (applicantId) {
            handleKycStatusUpdate('pending', applicantId);
        }
     }

     if (message === 'idCheck.onApplicantStatusChanged') {
       const status = payload?.reviewStatus;
       const answer = payload?.reviewResult?.reviewAnswer;
       
       if (answer === 'GREEN') {
          handleKycStatusUpdate('approved', applicantId);
       } else if (answer === 'RED') {
          handleKycStatusUpdate('rejected', applicantId);
       } else if (status === 'pending' || status === 'queued') {
          handleKycStatusUpdate('pending', applicantId);
       }
     }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center">
      <div className="w-full max-w-md p-6 mt-6 space-y-8 flex flex-col h-full flex-1">
        
        <div className="flex-1 flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center mb-4 relative"
          >
            <UserCheck className="w-8 h-8 text-emerald-400" />
            {success && (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center"
              >
                <Shield className="w-3 h-3 text-slate-900" />
              </motion.div>
            )}
          </motion.div>
          
          <h1 className="text-xl font-bold mb-2">Identity Verification</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 px-4">
            Required to secure your account and unlock all features.
          </p>

          <div className="w-full min-h-[400px] rounded-2xl overflow-hidden bg-white text-slate-900 shadow-xl border border-slate-700/50">
             {loading ? <p className="text-slate-400 p-4">Loading secure environment...</p> : 
              errorMsg ? <div className="text-red-400 p-4 border border-red-500/20 rounded-xl m-4">{errorMsg}</div> :
              token && (
                <SumsubWebSdk
                   accessToken={token}
                   expirationHandler={() => Promise.resolve(token)}
                   config={{
                      lang: 'en',
                      uiConf: { customCssStr: ":root { --black: #0f172a; --grey: #cbd5e1; --lighter-grey: #f8fafc; --primary-color: #10b981; }" }
                   }}
                   options={{ addViewportTag: false, adaptIframeHeight: true }}
                   onMessage={snsWebSdkHandler}
                   onError={(err) => console.error(err)}
                />
              )
             }
          </div>
        </div>

      </div>
      
    </div>
  );
}
