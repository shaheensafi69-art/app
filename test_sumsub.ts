import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || "";
  const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY || "";
  
  console.log("X-App-Token length:", SUMSUB_APP_TOKEN.length);
  for (let i=0; i < SUMSUB_APP_TOKEN.length; i++) {
     if (SUMSUB_APP_TOKEN.charCodeAt(i) > 255) {
        console.log("Found invalid char in Token:", SUMSUB_APP_TOKEN.charCodeAt(i));
     }
  }

  const ts = Math.floor(Date.now() / 1000);
  const method = 'POST';
  const userId = 'test_123';
  const uri = `/resources/accessTokens?userId=${userId}&levelName=basic-kyc-level`;
  const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY).update(ts + method + uri).digest('hex');

  console.log("signature length:", signature.length);
  for (let i=0; i < signature.length; i++) {
     if (signature.charCodeAt(i) > 255) {
        console.log("Found invalid char in signature:", signature.charCodeAt(i));
     }
  }
}
run();
