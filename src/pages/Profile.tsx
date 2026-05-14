import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../lib/api';

import { User, MapPin, Shield, Check, AlertCircle, Save, ChevronRight, ChevronDown, ArrowLeft, LogOut, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COUNTRIES = [
  {"code":"AF","name":"Afghanistan"},{"code":"AL","name":"Albania"},{"code":"DZ","name":"Algeria"},{"code":"AS","name":"American Samoa"},{"code":"AD","name":"Andorra"},{"code":"AO","name":"Angola"},{"code":"AR","name":"Argentina"},{"code":"AU","name":"Australia"},{"code":"AT","name":"Austria"},{"code":"BH","name":"Bahrain"},{"code":"BD","name":"Bangladesh"},{"code":"BE","name":"Belgium"},{"code":"BR","name":"Brazil"},{"code":"CA","name":"Canada"},{"code":"CN","name":"China"},{"code":"CO","name":"Colombia"},{"code":"HR","name":"Croatia"},{"code":"CY","name":"Cyprus"},{"code":"CZ","name":"Czechia"},{"code":"DK","name":"Denmark"},{"code":"EG","name":"Egypt"},{"code":"EE","name":"Estonia"},{"code":"FI","name":"Finland"},{"code":"FR","name":"France"},{"code":"DE","name":"Germany"},{"code":"GR","name":"Greece"},{"code":"HK","name":"Hong Kong"},{"code":"HU","name":"Hungary"},{"code":"IS","name":"Iceland"},{"code":"IN","name":"India"},{"code":"ID","name":"Indonesia"},{"code":"IE","name":"Ireland"},{"code":"IL","name":"Israel"},{"code":"IT","name":"Italy"},{"code":"JP","name":"Japan"},{"code":"JO","name":"Jordan"},{"code":"KE","name":"Kenya"},{"code":"KW","name":"Kuwait"},{"code":"LB","name":"Lebanon"},{"code":"MY","name":"Malaysia"},{"code":"MX","name":"Mexico"},{"code":"MA","name":"Morocco"},{"code":"NL","name":"Netherlands"},{"code":"NZ","name":"New Zealand"},{"code":"NG","name":"Nigeria"},{"code":"NO","name":"Norway"},{"code":"OM","name":"Oman"},{"code":"PK","name":"Pakistan"},{"code":"PH","name":"Philippines"},{"code":"PL","name":"Poland"},{"code":"PT","name":"Portugal"},{"code":"QA","name":"Qatar"},{"code":"RO","name":"Romania"},{"code":"SA","name":"Saudi Arabia"},{"code":"SG","name":"Singapore"},{"code":"ZA","name":"South Africa"},{"code":"ES","name":"Spain"},{"code":"SE","name":"Sweden"},{"code":"CH","name":"Switzerland"},{"code":"TW","name":"Taiwan"},{"code":"TH","name":"Thailand"},{"code":"TR","name":"Turkey"},{"code":"AE","name":"United Arab Emirates"},{"code":"GB","name":"United Kingdom"},{"code":"US","name":"United States"}
];

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'personal' | 'billing' | 'security'>('menu');
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    image_url: '',
    date_of_birth: '',
    nationality: '',
    billing_address: {
      line1: '',
      city: '',
      postal_code: '',
      country: ''
    }
  });

  useEffect(() => {
    if (userId) {
      getProfile(userId).then(res => {
        if (!res.error && !res.message) {
           setProfile(res);
           setFormData({
             first_name: res.first_name || '',
             last_name: res.last_name || '',
             phone_number: res.phone_number || '',
             image_url: res.image_url || '',
             date_of_birth: res.date_of_birth || '',
             nationality: res.nationality || '',
             billing_address: res.billing_address || {
               line1: '',
               city: '',
               postal_code: '',
               country: ''
             }
           });
        }
      }).catch(err => {
         console.error(err);
      }).finally(() => {
         setLoading(false);
      });
    } else {
       setLoading(false);
    }
  }, [userId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaveStatus('idle');
    setSaveError(null);
    try {
      const updated = await updateProfile(userId, formData);
      if (updated.error) {
        setSaveStatus('error');
        setSaveError(updated.error);
      } else {
        setProfile(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err.message || 'Error updating profile.');
    }
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Avatar = reader.result as string;
        setFormData(prev => ({ ...prev, image_url: base64Avatar }));
        setProfile((prev: any) => ({ ...prev, image_url: base64Avatar }));
        
        try {
          await updateProfile(userId!, { image_url: base64Avatar });
        } catch (err) {
          console.error("Failed to update avatar");
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billing_address: {
        ...prev.billing_address,
        [field]: value
      }
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/');
  };

  const renderKycStatus = () => {
    const status = profile?.kyc_status;
    if (status === 'approved') {
      return <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500 font-medium">Verified</span></>;
    } else if (status === 'pending') {
      return <><Loader2 className="w-4 h-4 text-amber-500 animate-spin" /><span className="text-amber-500 font-medium">Pending</span></>;
    } else if (status === 'rejected') {
      return <><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-red-500 font-medium">Rejected</span></>;
    } else {
      return <><Info className="w-4 h-4 text-slate-400" /><span className="text-slate-400 font-medium">Required</span></>;
    }
  };

  return (
    <div className="min-h-[100dvh] pb-24 flex flex-col items-center">
      <div className="w-full max-w-md p-6 space-y-8">
        
        <header className="pt-2 flex items-center gap-4">
          {currentView !== 'menu' && (
             <button onClick={() => setCurrentView('menu')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
               <ArrowLeft className="w-5 h-5" />
             </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {currentView === 'menu' ? 'Profile' : 
               currentView === 'personal' ? 'Personal Info' : 
               currentView === 'billing' ? 'Residential Address' : 'Security'}
            </h1>
            {currentView === 'menu' && <p className="text-slate-400 mt-1">Manage your details & settings</p>}
          </div>
        </header>

        {loading ? (
           <div className="animate-pulse space-y-4">
             <div className="h-20 bg-slate-800 rounded-2xl w-full"></div>
             <div className="h-64 bg-slate-800 rounded-2xl w-full"></div>
           </div>
        ) : currentView === 'menu' ? (
           <div className="space-y-4">
              
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative group cursor-pointer mb-3">
                  <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <label htmlFor="avatarUpload" className="w-24 h-24 rounded-full border-2 border-emerald-500/50 bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer relative group">
                     {profile?.image_url ? (
                       <img src={profile.image_url} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-3xl font-bold text-slate-400 capitalize">{profile?.first_name?.[0] || profile?.email?.[0] || 'U'}</span>
                     )}
                     <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex transition-all">
                       <span className="text-white text-xs font-semibold">Change</span>
                     </div>
                  </label>
                </div>
                <h2 className="text-xl font-bold text-slate-100">{profile?.first_name} {profile?.last_name}</h2>
                <p className="text-sm text-slate-400">{profile?.email}</p>
              </div>

              <button onClick={() => setCurrentView('personal')} className="w-full glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                     <User className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-slate-200">Personal Info</h3>
                     <p className="text-xs text-slate-400">Name, Email, Identity</p>
                   </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>

              <button onClick={() => setCurrentView('billing')} className="w-full glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                     <MapPin className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-slate-200">Residential Address</h3>
                     <p className="text-xs text-slate-400">Your current physical residence</p>
                   </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>

              <button onClick={() => navigate('/kyc')} className="w-full glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                     <Shield className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-slate-200">KYC Verification</h3>
                     <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                       Status: {renderKycStatus()}
                     </div>
                   </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
              
              <button onClick={() => setCurrentView('security')} className="w-full glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                     <Shield className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-slate-200">Security</h3>
                     <p className="text-xs text-slate-400">Password & 2FA</p>
                   </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>

              <div className="pt-4">
                 <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-all flex justify-center items-center gap-2">
                   <LogOut className="w-5 h-5" /> Logout
                 </button>
              </div>
           </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {currentView === 'personal' && (
              <div className="glass-card rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">First Name</label>
                    <input 
                      type="text" 
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Last Name</label>
                    <input 
                      type="text" 
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Date of Birth</label>
                    <input 
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Nationality</label>
                    <div className="relative">
                      <select
                        value={formData.nationality}
                        onChange={e => setFormData({...formData, nationality: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition appearance-none" 
                      >
                        <option value="">Select</option>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+447700900000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none transition" 
                  />
                </div>
                
                <div className="space-y-1 opacity-60">
                   <label className="text-xs text-slate-400">Email (Read Only)</label>
                   <input type="text" value={profile?.email || ''} readOnly className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              </div>
            )}

            {currentView === 'billing' && (
              <div className="glass-card rounded-2xl p-4 space-y-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] pointer-events-none">
                    <MapPin className="w-24 h-24 text-slate-100" />
                 </div>
                 <div className="space-y-1 relative z-10">
                    <label className="text-xs text-slate-400 font-medium">Address Line 1</label>
                    <input 
                      type="text" 
                      required
                      placeholder="123 Example St"
                      value={formData.billing_address.line1}
                      onChange={e => handleAddressChange('line1', e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-slate-900 outline-none transition shadow-inner" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">City</label>
                      <input 
                        type="text" 
                        required
                        placeholder="London"
                        value={formData.billing_address.city}
                        onChange={e => handleAddressChange('city', e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-slate-900 outline-none transition shadow-inner" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Postal Code</label>
                      <input 
                        type="text" 
                        required
                        placeholder="NW1 6XE"
                        value={formData.billing_address.postal_code}
                        onChange={e => handleAddressChange('postal_code', e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-slate-900 outline-none transition shadow-inner" 
                      />
                   </div>
                 </div>
                 <div className="space-y-1 relative z-10">
                    <label className="text-xs text-slate-400 font-medium">Country (Residence)</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.billing_address.country}
                        onChange={e => handleAddressChange('country', e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-slate-900 outline-none transition appearance-none shadow-inner" 
                      >
                        <option value="">Select a country</option>
                        {COUNTRIES.filter(c => c.code !== 'AF').map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
              </div>
            )}

            {currentView === 'security' && (
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between opacity-80">
                <div>
                   <h4 className="font-medium text-slate-200">2-Factor Auth</h4>
                   <p className="text-xs text-slate-400">Secure your account</p>
                </div>
                <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">Coming Soon</div>
              </div>
            )}

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {saveStatus === 'saved' && (
              <p className="text-center text-emerald-400 text-sm animate-pulse">Profile updated successfully!</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-center text-red-500 text-sm">{saveError || 'Error updating profile. Please try again.'}</p>
            )}

          </form>
        )}

      </div>
      
    </div>
  );
}
