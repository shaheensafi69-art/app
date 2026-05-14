import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safipay.app', 
  appName: 'SafiPay',      
  webDir: 'dist',
  server: {
    // آدرس سرور جدید (بدون پورت ریموت دسکتاپ، فقط آی‌پی و پورت بک‌اِند)
    url: 'http://193.106.199.13:3000', 
    cleartext: true
  }
};

export default config;