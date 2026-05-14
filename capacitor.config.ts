import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safipay.app', // نام پکیج شما
  appName: 'SafiPay',
  webDir: 'dist', // یا build
  server: {
    androidScheme: 'https',
    cleartext: true, // اجازه ارتباط با آی‌پی بدون SSL
    allowNavigation: ['193.106.199.13']
  }
};

export default config;