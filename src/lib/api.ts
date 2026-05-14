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

export async function getProfile(userId: string) {
  const res = await fetch(`/api/profile/${userId}`);
  return res.json();
}

export async function updateProfile(userId: string, data: any) {
  const res = await fetch(`/api/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getDashboard(userId: string) {
  const res = await fetch(`/api/dashboard/${userId}`);
  return res.json();
}

export async function getCards(userId: string) {
  const res = await fetch(`/api/cards/${userId}`);
  return res.json();
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

export async function getWallets(userId: string) {
  const res = await fetch(`/api/wallets/${userId}`);
  return res.json();
}

export async function getNotifications(userId: string) {
  const res = await fetch(`/api/notifications/${userId}`);
  return res.json();
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  return res.json();
}

export async function getDevices(userId: string) {
  const res = await fetch(`/api/devices/${userId}`);
  return res.json();
}

export async function getSupportTickets(userId: string) {
  const res = await fetch(`/api/support/${userId}`);
  return res.json();
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
  const res = await fetch(`/api/support/${ticketId}/messages`);
  return res.json();
}

export async function getWithdrawals(userId: string) {
  const res = await fetch(`/api/withdrawals/${userId}`);
  return res.json();
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
  const res = await fetch(`/api/gift_cards/${userId}`);
  return res.json();
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
  const res = await fetch(`/api/topup_orders/${userId}`);
  return res.json();
}

export async function createTopupOrder(data: any) {
  const res = await fetch(`/api/topup_orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

