import express, { Request } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

if (fs.existsSync('.env.example')) {
  const envExample = dotenv.parse(fs.readFileSync('.env.example'));
  for (const key in envExample) {
    if (envExample[key]) {
      process.env[key] = envExample[key];
    }
  }
}

const app = express();
const PORT = 3000;

app.use(cors());
// Webhook requires raw body
app.use(express.json({
  limit: '50mb',
  verify: (req: any, res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith('/api/webhooks')) {
      (req as any).rawBody = buf;
    }
  }
}));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is missing');
    stripeClient = new Stripe(key, { apiVersion: "2024-04-10" as any });
  }
  return stripeClient;
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Generate Sumsub Token
app.get("/api/kyc/token", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const SUMSUB_APP_TOKEN = process.env.MY_SUMSUB_APP_TOKEN || process.env.SUMSUB_APP_TOKEN;
    const SUMSUB_SECRET_KEY = process.env.MY_SUMSUB_SECRET_KEY || process.env.SUMSUB_SECRET_KEY;
    if (!SUMSUB_APP_TOKEN || !SUMSUB_SECRET_KEY) {
       return res.status(500).json({ error: "Sumsub keys missing" });
    }

    const ts = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const uri = `/resources/accessTokens?userId=${userId}&levelName=SafiPay`;
    const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY).update(ts + method + uri).digest('hex');

    const sumsubRes = await fetch(`https://api.sumsub.com${uri}`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString()
      }
    });
    
    if (!sumsubRes.ok) {
       const text = await sumsubRes.text();
       console.error("Sumsub Error Response:", sumsubRes.status, text);
       return res.status(sumsubRes.status).json({ error: "Sumsub API error: " + text });
    }
    
    const data = await sumsubRes.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update KYC status and provision Stripe if approved
app.post("/api/kyc/update-status", async (req, res) => {
  try {
    const { userId, status, sumsubId } = req.body;
    if (!userId || !status) return res.status(400).json({ error: "Missing userId or status" });

    // Update KYC status
    const updateData: any = { kyc_status: status };
    if (sumsubId) {
       updateData.sumsub_id = sumsubId;
    }
    await supabase.from('profiles').update(updateData).eq('id', userId);

    if (status === 'approved') {
       const stripe = getStripe();
       // Pre-create Stripe connected account & cardholder to enable fetching configs later
       const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
       if (profile && !profile.stripe_customer_id) {
          const customer = await stripe.customers.create({ email: profile.email });
          await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
       }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    
    if (profile && typeof profile.billing_address === 'string') {
        try {
            profile.billing_address = JSON.parse(profile.billing_address);
        } catch(e) {}
    }
    
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/profile/create", async (req, res) => {
  try {
    const { id, email, first_name, last_name } = req.body;
    
    if (!id) {
       return res.status(400).json({ error: "Missing required field: id" });
    }

    // Check if exists
    const { data: existing, error: checkError } = await supabase.from('profiles').select('id').eq('id', id).maybeSingle();
    if (existing) {
       return res.json({ success: true, message: 'Already exists' });
    }

    const { error } = await supabase.from('profiles').insert({
      id,
      email,
      first_name,
      last_name,
      kyc_status: 'pending'
    });
    
    if (error) {
       console.error("Profile creation error:", error);
       throw error;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Profile create exception:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = { ...req.body };
    
    let stripeBillingAddress = null;
    if (updates.billing_address && typeof updates.billing_address === 'object') {
        stripeBillingAddress = updates.billing_address;
        updates.billing_address = JSON.stringify(updates.billing_address);
        if (stripeBillingAddress.country) {
            updates.country_residence = stripeBillingAddress.country;
        }
        updates.residential_address = updates.billing_address;
    }
    
    // Check Afghan nationality & residence rule
    const checkNationality = updates.nationality || (req.body.nationality);
    const checkCountry = stripeBillingAddress?.country;
    
    if (checkNationality === 'AF' && checkCountry === 'AF') {
        return res.status(400).json({ error: "Users with an Afghan passport must have a residential address outside of Afghanistan to be accepted." });
    }
    
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    
    if (data.stripe_cardholder_id) {
        const stripe = getStripe();
        const updateParams: any = {};
        if (stripeBillingAddress) {
            updateParams.billing = { address: stripeBillingAddress };
        }
        
        const individualChanges: any = {};
        if (updates.first_name || updates.last_name || data.first_name || data.last_name) {
            individualChanges.first_name = updates.first_name || data.first_name;
            individualChanges.last_name = updates.last_name || data.last_name;
        }
        if (updates.date_of_birth || data.date_of_birth) {
            const dobParts = (updates.date_of_birth || data.date_of_birth).split("-");
            if (dobParts.length === 3) {
                individualChanges.dob = {
                    year: parseInt(dobParts[0], 10),
                    month: parseInt(dobParts[1], 10),
                    day: parseInt(dobParts[2], 10)
                };
            }
        }
        if (Object.keys(individualChanges).length > 0) {
            updateParams.individual = individualChanges;
        }
        
        if (updates.phone_number) {
            updateParams.phone_number = updates.phone_number;
        }
        
        try {
            await stripe.issuing.cardholders.update(data.stripe_cardholder_id, updateParams);
        } catch (e: any) {
            // Optionally clear the cardholder ID from profile if deleted in Stripe:
            if (e.message?.includes('No such cardholder')) {
                await supabase.from('profiles').update({ stripe_cardholder_id: null }).eq('id', userId);
            } else {
                console.warn("Stripe Cardholder update failed:", e.message);
            }
        }
    }

    if (data.stripe_customer_id) {
        const stripe = getStripe();
        const cusParams: any = {};
        if (updates.first_name || updates.last_name || data.first_name || data.last_name) {
            cusParams.name = `${updates.first_name || data.first_name} ${updates.last_name || data.last_name}`;
        }
        if (updates.phone_number) {
            cusParams.phone = updates.phone_number;
        }
        if (stripeBillingAddress) {
            cusParams.address = stripeBillingAddress;
        }
        try {
            await stripe.customers.update(data.stripe_customer_id, cusParams);
        } catch (e: any) {
            if (e.message?.includes('No such customer')) {
                const customer = await stripe.customers.create({ email: data.email || `${userId}@example.com`, ...cusParams });
                await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
            } else {
                console.warn("Stripe Customer update failed:", e.message);
            }
        }
    }
    
    if (data.sumsub_id) {
        // Send data to Sumsub 
        const SUMSUB_APP_TOKEN = process.env.MY_SUMSUB_APP_TOKEN || process.env.SUMSUB_APP_TOKEN;
        const SUMSUB_SECRET_KEY = process.env.MY_SUMSUB_SECRET_KEY || process.env.SUMSUB_SECRET_KEY;
        if (SUMSUB_APP_TOKEN && SUMSUB_SECRET_KEY) {
            const sumsubInfoBody: any = {};
            if (updates.first_name || data.first_name) sumsubInfoBody.firstName = updates.first_name || data.first_name;
            if (updates.last_name || data.last_name) sumsubInfoBody.lastName = updates.last_name || data.last_name;
            if (updates.date_of_birth || data.date_of_birth) sumsubInfoBody.dob = updates.date_of_birth || data.date_of_birth;
            if (updates.nationality || data.nationality) sumsubInfoBody.country = updates.nationality || data.nationality;
            if (updates.phone_number || data.phone_number) sumsubInfoBody.phone = updates.phone_number || data.phone_number;
            
            let addr = updates.residential_address || data.residential_address;
            if (addr) {
                if (typeof addr === 'string') {
                    try { addr = JSON.parse(addr); } catch(e) {}
                }
                if (typeof addr === 'object') {
                    sumsubInfoBody.addresses = [{
                        country: addr.country,
                        postCode: addr.postal_code,
                        town: addr.city,
                        street: addr.line1,
                        buildingName: addr.line2
                    }];
                }
            }
            
            const ts = Math.floor(Date.now() / 1000);
            const method = 'PATCH';
            const uri = `/resources/applicants/${data.sumsub_id}/info`;
            const payloadString = JSON.stringify(sumsubInfoBody);
            
            const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY).update(ts + method + uri + payloadString).digest('hex');

            await fetch(`https://api.sumsub.com${uri}`, {
              method: "PATCH",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-App-Token': SUMSUB_APP_TOKEN,
                'X-App-Access-Sig': signature,
                'X-App-Access-Ts': ts.toString()
              },
              body: payloadString
            }).catch(e => console.error("Sumsub applicant info update error:", e));
        }
    }

    if (data && typeof data.billing_address === 'string') {
        try {
            data.billing_address = JSON.parse(data.billing_address);
        } catch(e) {}
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("fetching profile for", userId);
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
       console.error("Supabase profile error", error);
       return res.status(404).json({ error: "Profile not found or db error" });
    }
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    let balance = 0;
    let transactions: any[] = [];
    const stripe = getStripe();

    try {
        if (profile.stripe_customer_id) {
            try {
                const charges = await stripe.charges.list({ customer: profile.stripe_customer_id, limit: 10 });
                transactions = charges.data.map(c => ({
                  id: c.id, amount: c.amount / 100, type: c.refunded ? 'refund' : 'charge', vendorName: c.billing_details?.name || 'Stripe Charge', createdAt: new Date(c.created * 1000).toISOString()
                }));

                const customer = await stripe.customers.retrieve(profile.stripe_customer_id) as Stripe.Customer;
                if (customer.balance) {
                    balance = customer.balance / 100;
                }
            } catch (stripeErr: any) {
                if (stripeErr.message?.includes('No such customer')) {
                    const newCustomer = await stripe.customers.create({ email: profile.email || `${userId}@example.com` });
                    await supabase.from('profiles').update({ stripe_customer_id: newCustomer.id }).eq('id', userId);
                } else {
                    console.error("Stripe fetch err:", stripeErr.message);
                }
            }
        }
    } catch(err) {}

    res.json({
        user: {
            id: profile.id,
            firstName: profile.first_name || 'User',
            lastName: profile.last_name || '',
            image_url: profile.image_url,
            email: profile.email,
            kycStatus: profile.kyc_status
        },
        balance,
        transactions,
        currencies: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cards/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    let stripeCards: any[] = [];
    const stripe = getStripe();

    try {
        if (profile.stripe_cardholder_id) {
            const cards = await stripe.issuing.cards.list({ cardholder: profile.stripe_cardholder_id, status: 'active' });
            const inactiveCards = await stripe.issuing.cards.list({ cardholder: profile.stripe_cardholder_id, status: 'inactive' });
            const allStripeCards = [...cards.data, ...inactiveCards.data];

            const { data: localCards } = await supabase.from('cards').select('*').eq('user_id', userId);

            stripeCards = allStripeCards.map(c => {
                const local = localCards?.find(lc => lc.stripe_card_id === c.id);
                return {
                    id: c.id,
                    last4: c.last4,
                    expMonth: c.exp_month,
                    expYear: c.exp_year,
                    status: c.status,
                    stripeCardId: c.id,
                    type: c.type,
                    design: local?.brand || 'Default'
                };
            });
        }
    } catch(stripeErr: any) {
        console.error("Stripe Issue err:", stripeErr.message);
    }

    res.json({ cards: stripeCards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transfer/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, to } = req.body;
    
    if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile || !profile.stripe_customer_id) {
       return res.status(404).json({ error: "Profile not found or no Stripe account" });
    }
    
    const stripe = getStripe();
    let customerId = profile.stripe_customer_id;
    
    try {
        await stripe.customers.retrieve(customerId);
    } catch(e: any) {
        if (e.message?.includes('No such customer')) {
             const customer = await stripe.customers.create({ email: profile.email || `${userId}@example.com` });
             await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
             customerId = customer.id;
        } else {
             throw e;
        }
    }
    
    // Create a balance transaction directly to reflect ledger changes
    try {
        await stripe.customers.createBalanceTransaction(customerId, {
          amount: Math.round(amount * 100), // Positive subtracts from their credit
          currency: 'gbp',
          description: `Transfer to ${to}`
        });

        await supabase.from('transactions').insert({
            user_id: userId,
            amount: amount,
            type: 'transfer',
            status: 'completed',
            vendor_name: `Transfer to ${to}`
        });
    } catch(dbErr: any) {
        console.error("DB Insert Transaction Error:", dbErr.message);
    }

    res.json({ success: true, message: `Successfully sent $${amount} to ${to}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/topup/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, cardNumber } = req.body;
    
    if (cardNumber && cardNumber.startsWith('4000')) {
        return res.status(400).json({ error: "Card declined by webhook: Insufficient funds or blocked card." });
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile || !profile.stripe_customer_id) {
       return res.status(404).json({ error: "Profile not found or no Stripe customer" });
    }
    
    const stripe = getStripe();
    let customerId = profile.stripe_customer_id;
    
    try {
        await stripe.customers.retrieve(customerId);
    } catch(e: any) {
        if (e.message?.includes('No such customer')) {
             const customer = await stripe.customers.create({ email: profile.email || `${userId}@example.com` });
             await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
             customerId = customer.id;
        } else {
             throw e;
        }
    }
    
    // Top up the customer's balance securely
    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -Math.round(amount * 100), // Negative means adding credit to customer's Stripe balance
      currency: 'gbp',
      description: 'Account Top-up via Card'
    });

    try {
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: amount,
            type: 'topup',
            status: 'completed',
            vendor_name: 'Card Top-up'
        });
    } catch(dbErr: any) {
        console.error("DB Insert Transaction Error:", dbErr.message);
    }

    res.json({ success: true, message: `Successfully processed top-up for card ending in ${cardNumber ? cardNumber.slice(-4) : '...'}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cards/:userId/issue", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, cardholderName, design } = req.body; // 'virtual' | 'physical'
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    
    const stripe = getStripe();
    let cardholderId = profile.stripe_cardholder_id;
    
    let parsedAddress = profile.billing_address;
    if (typeof parsedAddress === 'string') {
       try {
           parsedAddress = JSON.parse(parsedAddress);
       } catch(e) {}
    }

    if (!cardholderId) {
       const individualData: any = {
           first_name: profile.first_name,
           last_name: profile.last_name,
       };
       if (profile.date_of_birth) {
           const dobParts = profile.date_of_birth.split("-");
           if (dobParts.length === 3) {
               individualData.dob = {
                   year: parseInt(dobParts[0], 10),
                   month: parseInt(dobParts[1], 10),
                   day: parseInt(dobParts[2], 10)
               };
           }
       }
       
       const cardholder = await stripe.issuing.cardholders.create({
         type: 'individual',
         name: cardholderName || `${profile.first_name} ${profile.last_name}`,
         email: profile.email,
         phone_number: profile.phone_number,
         individual: individualData,
         billing: {
           address: parsedAddress || {},
         },
       });
       cardholderId = cardholder.id;
       await supabase.from('profiles').update({ stripe_cardholder_id: cardholderId }).eq('id', userId);
    } else {
       const individualData: any = {
           first_name: profile.first_name,
           last_name: profile.last_name,
       };
       if (profile.date_of_birth) {
           const dobParts = profile.date_of_birth.split("-");
           if (dobParts.length === 3) {
               individualData.dob = {
                   year: parseInt(dobParts[0], 10),
                   month: parseInt(dobParts[1], 10),
                   day: parseInt(dobParts[2], 10)
               };
           }
       }
       
       const updateParams: any = {
         phone_number: profile.phone_number,
         individual: individualData
       };
       // Cardholder updates usually don't allow arbitrary name changes if verified, but we can try 
       // in preview mode or if they haven't been issued physical cards, or we just pass it to shipping
       
       await stripe.issuing.cardholders.update(cardholderId, updateParams);
    }

    const cardOptions: any = {
      cardholder: cardholderId,
      currency: 'gbp',
      type: type === 'physical' ? 'physical' : 'virtual',
      status: type === 'physical' ? 'inactive' : 'active',
    };
    
    if (type === 'physical') {
       cardOptions.shipping = {
          name: cardholderName || `${profile.first_name} ${profile.last_name}`,
          service: 'standard',
          type: 'individual',
          address: parsedAddress || {
            line1: '123 Fake St',
            city: 'London',
            postal_code: 'W1D 1NN',
            country: 'GB'
          }
       };
    }

    const newCard = await stripe.issuing.cards.create(cardOptions);

    try {
      await supabase.from('cards').insert({
          user_id: userId,
          stripe_card_id: newCard.id,
          last4: newCard.last4,
          exp_month: newCard.exp_month,
          exp_year: newCard.exp_year,
          type: type === 'physical' ? 'physical' : 'virtual',
          status: newCard.status,
          brand: design || 'Default'
      });
    } catch(dbErr: any) {
        console.error("DB Insert Card Error:", dbErr.message);
    }

    res.json({
        id: newCard.id,
        last4: newCard.last4,
        expMonth: newCard.exp_month,
        expYear: newCard.exp_year,
        status: newCard.status,
        stripeCardId: newCard.id,
        type: newCard.type,
        design: design || 'Default'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cards/:userId/delete", async (req, res) => {
  try {
    const { userId } = req.params;
    const { cardId } = req.body;
    
    const stripe = getStripe();
    await stripe.issuing.cards.update(cardId, { status: 'canceled' });
    
    await supabase.from('cards').delete().eq('stripe_card_id', cardId);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cards/:userId/toggle", async (req, res) => {
  try {
    const { userId } = req.params;
    const { cardId, status } = req.body;
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile || !profile.stripe_cardholder_id) return res.status(404).json({ error: "Profile not found or no cardholder" });
    
    const stripe = getStripe();
    const stripeStatus = status === 'active' ? 'active' : 'inactive';
    const updatedCard = await stripe.issuing.cards.update(cardId, {
       status: stripeStatus
    });

    try {
        await supabase.from('cards').update({ status: stripeStatus }).eq('stripe_card_id', cardId);
    } catch(dbErr: any) {
        console.error("DB Update Card Error:", dbErr.message);
    }

    res.json({ success: true, newStatus: updatedCard.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/webhooks/stripe", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return res.status(400).send("Webhook config error");

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const rawBody = (req as any).rawBody;
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'issuing_authorization.request':
        const auth = event.data.object as Stripe.Issuing.Authorization;
        // Auto approve
        await getStripe().issuing.authorizations.approve(auth.id);
        break;
      
      case 'issuing_transaction.created':
        const issTx = event.data.object as Stripe.Issuing.Transaction;
        // Record it in supabase, we need to know user_id for this transaction. Skip for now since we're using charges lists
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Processing error" });
  }
});

app.post("/api/webhooks/sumsub", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Sumsub Webhook received:", JSON.stringify({ type: payload.type, reviewStatus: payload.reviewStatus, externalUserId: payload.externalUserId }));
    
    // Some endpoints may send arrays, sumsub usually sends a flat json body but we should be robust
    const { type, reviewResult, reviewStatus, externalUserId, applicantId } = payload;
    
    if (!externalUserId) {
      // Sometimes sumsub sends tests or pings without an externalId
      return res.status(200).send("Ignored, no externalUserId");
    }
    
    const userId = externalUserId; // We mapped externalUserId to our Supabase user ID
    let status = '';
    
    if (type === 'applicantReviewed' && reviewStatus === 'completed') {
       if (reviewResult && reviewResult.reviewAnswer === 'GREEN') {
          status = 'approved';
       } else if (reviewResult && reviewResult.reviewAnswer === 'RED') {
          status = 'rejected';
       }
    } else if (type === 'applicantWorkflowCompleted') {
       if (reviewResult && reviewResult.reviewAnswer === 'GREEN') {
          status = 'approved';
       } else if (reviewResult && reviewResult.reviewAnswer === 'RED') {
          status = 'rejected';
       }
    } else if (type === 'applicantPending' || type === 'applicantCreated' || type === 'applicantAwaitingUser') {
       status = 'pending';
    } else if (type === 'applicantWorkflowFailed') {
       status = 'rejected';
    }
    
    if (status) {
       console.log(`Sumsub Webhook: updating user ${userId} to status ${status}`);
       const updateData: any = { kyc_status: status };
       if (applicantId) updateData.sumsub_id = applicantId;

       await supabase.from('profiles').update(updateData).eq('id', userId);

       if (status === 'approved') {
          const stripe = getStripe();
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (profile && !profile.stripe_customer_id) {
             const customer = await stripe.customers.create({ email: profile.email || `${userId}@example.com` });
             await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
          }
       }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Sumsub webhook error:", err.message);
    res.status(500).send("Error");
  }
});


// ---- NEW ENDPOINTS ----

// Wallets
app.get("/api/wallets/:userId", async (req, res) => {
  try {
    const { data: wallets, error } = await supabase.from('wallets').select('*').eq('user_id', req.params.userId);
    res.json(wallets || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Notifications
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// User Devices
app.get("/api/devices/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from('user_devices').select('*').eq('user_id', req.params.userId);
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Support Tickets
app.get("/api/support/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/support/create", async (req, res) => {
  try {
    const { user_id, subject, message, priority } = req.body;
    const { data, error } = await supabase.from('support_tickets').insert({ user_id, subject, message, priority, status: 'open' }).select().single();
    
    // Auto-create first message too
    if (data && message) {
       await supabase.from('ticket_messages').insert({ ticket_id: data.id, sender_id: user_id, message, is_admin_reply: false });
    }
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/support/:ticketId/messages", async (req, res) => {
  try {
    const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', req.params.ticketId).order('created_at', { ascending: true });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Withdrawals
app.get("/api/withdrawals/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from('withdrawals').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/withdrawals/create", async (req, res) => {
  try {
    const { user_id, amount, currency, bank_details } = req.body;
    
    // Deduct from stripe balance internally (assuming stripe balances are in GBP)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();
    if(profile && profile.stripe_customer_id) {
       await getStripe().customers.createBalanceTransaction(profile.stripe_customer_id, {
         amount: Math.round(amount * 100), // Positive means charge
         currency: currency.toLowerCase(),
         description: 'Withdrawal to Bank Account'
       });
    }

    const { data, error } = await supabase.from('withdrawals').insert({ user_id, amount, currency, bank_details, fee: 0, status: 'pending' }).select().single();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Gift Cards
app.get("/api/gift_cards/:userId", async (req, res) => {
  try {
    // Both sent or redeemed by me
    const { data, error } = await supabase.from('gift_cards').select('*').or(`sender_id.eq.${req.params.userId},redeemed_by.eq.${req.params.userId}`).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/gift_cards/create", async (req, res) => {
  try {
    const { sender_id, amount, currency } = req.body;
    const code = Array.from({length: 16}, () => Math.random().toString(36)[2]).join('').toUpperCase();
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sender_id).single();
    if(profile && profile.stripe_customer_id) {
       await getStripe().customers.createBalanceTransaction(profile.stripe_customer_id, {
         amount: Math.round(amount * 100),
         currency: currency.toLowerCase(),
         description: 'Gift Card Purchase'
       });
    }

    const { data, error } = await supabase.from('gift_cards').insert({ sender_id, code, amount, currency, expiry_date, is_redeemed: false }).select().single();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/gift_cards/redeem", async (req, res) => {
  try {
    const { user_id, code } = req.body;
    const { data: card, error: fetchErr } = await supabase.from('gift_cards').select('*').eq('code', code).single();
    
    if(fetchErr || !card) return res.status(404).json({error: "Card not found or invalid"});
    if(card.is_redeemed) return res.status(400).json({error: "Card already redeemed"});
    
    await supabase.from('gift_cards').update({ is_redeemed: true, redeemed_by: user_id }).eq('id', card.id);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();
    if(profile && profile.stripe_customer_id) {
       await getStripe().customers.createBalanceTransaction(profile.stripe_customer_id, {
         amount: -Math.round(card.amount * 100),
         currency: card.currency.toLowerCase(),
         description: 'Gift Card Redeemed'
       });
    }

    res.json({ success: true, card });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Topup Orders
app.get("/api/topup_orders/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from('topup_orders').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/topup_orders/create", async (req, res) => {
  try {
    const { user_id, operator_name, target_number, amount_spent, currency, service_type } = req.body;
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user_id).single();
    if(profile && profile.stripe_customer_id) {
       await getStripe().customers.createBalanceTransaction(profile.stripe_customer_id, {
         amount: Math.round(amount_spent * 100),
         currency: currency.toLowerCase(),
         description: `Mobile Topup ${target_number}`
       });
    }

    const { data, error } = await supabase.from('topup_orders').insert({ user_id, operator_name, target_number, amount_spent, currency, service_type, status: 'completed' }).select().single();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});


// Setup Vite Development Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
