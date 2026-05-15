import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginUser(email: string, password?: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password || ''
  });
  if (error) return { error: error.message };
  return { id: data.user.id, ...data.user };
}

export async function registerUser(email: string, password?: string, firstName?: string, lastName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });
  if (error) return { error: error.message };
  if (!data?.user?.id) return { error: 'Unknown signup error: user object is null.' };
  
  // Create profile via backend to bypass RLS or ensure it's created. We can just HTTP POST to our backend to ensure profile creation.
  try {
    const res = await fetch(`/api/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName
      })
    });
    
    if (!res.ok) {
       const errBody = await res.json().catch(() => ({}));
       return { error: 'Failed to create profile: ' + (errBody.error || res.statusText) };
    }
  } catch (e: any) {
    return { error: 'Network error creating profile: ' + e.message };
  }

  return { id: data.user.id, ...data.user };
}

const apiCache: Record<string, { data: any, timestamp: number, promise?: Promise<any> }> = {};

export function getCachedData(url: string) {
  if (apiCache[url] && (Date.now() - apiCache[url].timestamp < 300000)) { // 5 mins
    return apiCache[url].data;
  }
  return null;
}

async function fetchWithCache(url: string, ttlMs = 30000) {
  const now = Date.now();
  
  if (apiCache[url]) {
      if (now - apiCache[url].timestamp < ttlMs) {
          return apiCache[url].data;
      }
      if (apiCache[url].promise) {
          return apiCache[url].promise;
      }
  }

  const promise = fetch(url).then(res => res.json()).then(data => {
      apiCache[url] = { data, timestamp: Date.now() };
      return data;
  }).catch(err => {
      // If error, keeping the stale data might be better or throwing
      if (apiCache[url]?.data) return apiCache[url].data;
      throw err;
  });

  apiCache[url] = { ...apiCache[url], promise };
  return promise;
}

export async function getProfile(userId: string) {
  return fetchWithCache(`/api/profile/${userId}`);
}

export async function updateProfile(userId: string, data: any) {
  const res = await fetch(`/api/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const updated = await res.json();
  if (!updated.error) {
     apiCache[`/api/profile/${userId}`] = { data: updated, timestamp: Date.now() };
  }
  return updated;
}

export async function getDashboard(userId: string) {
  return fetchWithCache(`/api/dashboard/${userId}`, 10000); // 10s TTL for dashboard
}

export async function getCards(userId: string) {
  return fetchWithCache(`/api/cards/${userId}`, 10000); // 10s TTL
}

export async function toggleCard(userId: string, cardId: string, status: string) {
  const res = await fetch(`/api/cards/${userId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, status })
  });
  return res.json();
}

export async function issueCard(userId: string, type: 'virtual' | 'physical', cardholderName?: string, design?: string) {
  const res = await fetch(`/api/cards/${userId}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, cardholderName, design })
  });
  return res.json();
}

export async function deleteCard(userId: string, cardId: string) {
  const res = await fetch(`/api/cards/${userId}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId })
  });
  return res.json();
}

export async function getSumsubToken(userId: string) {
  const res = await fetch(`/api/kyc/token?userId=${userId}`);
  return res.json();
}

export async function completeKyc(userId: string) {
  const res = await fetch(`/api/kyc/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  return res.json();
}

// --- NEW APPLET ENDPOINTS ---

export async function registerDevice(userId: string) {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  
  const deviceName = navigator.userAgent;
  
  const res = await fetch(`/api/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, device_id: deviceId, device_name: deviceName })
  });
  
  return res.json();
}

export async function updateBiometricStatus(isEnabled: boolean) {
  const deviceId = localStorage.getItem('deviceId');
  if (!deviceId) return { error: 'No device ID' };
  
  const res = await fetch(`/api/devices/biometric`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, is_enabled: isEnabled })
  });
  
  return res.json();
}

export async function getWallets(userId: string) {
  return fetchWithCache(`/api/wallets/${userId}`, 10000);
}

export async function getNotifications(userId: string) {
  return fetchWithCache(`/api/notifications/${userId}`, 10000);
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  return res.json();
}

export async function getDevices(userId: string) {
  return fetchWithCache(`/api/devices/${userId}`);
}

export async function getSupportTickets(userId: string) {
  return fetchWithCache(`/api/support/${userId}`, 10000);
}

export async function createSupportTicket(data: any) {
  const res = await fetch(`/api/support/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getTicketMessages(ticketId: string) {
  return fetchWithCache(`/api/support/${ticketId}/messages`, 5000);
}

export async function getWithdrawals(userId: string) {
  return fetchWithCache(`/api/withdrawals/${userId}`, 10000);
}

export async function createWithdrawal(data: any) {
  const res = await fetch(`/api/withdrawals/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getGiftCards(userId: string) {
  return fetchWithCache(`/api/gift_cards/${userId}`, 10000);
}

export async function createGiftCard(data: any) {
  const res = await fetch(`/api/gift_cards/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function redeemGiftCard(data: any) {
  const res = await fetch(`/api/gift_cards/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getTopupOrders(userId: string) {
  return fetchWithCache(`/api/topup_orders/${userId}`, 10000);
}

export async function createTopupOrder(data: any) {
  const res = await fetch(`/api/topup_orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function generateOtp(userId: string, type: string) {
  const res = await fetch(`/api/otp/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, type })
  });
  return res.json();
}

export async function verifyOtp(userId: string, code: string, type: string) {
  const res = await fetch(`/api/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, code, type })
  });
  return res.json();
}

