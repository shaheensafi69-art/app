import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safipay.app', // پیشنهاد می‌شود این با نام برند شما یکی باشد
  appName: 'SafiPay',       // نام نمایشی اپلیکیشن
  webDir: 'dist',
  server: {
    // آی‌پی مک شما که در مرحله قبل پیدا کردیم
    url: 'http://192.168.0.112:3000', 
    cleartext: true
  }
};

export default config;