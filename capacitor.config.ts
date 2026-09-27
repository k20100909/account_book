import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gihyeon.aibudget",
  appName: "기현이 AI 가계부",
  webDir: "capacitor-web",
  server: {
    url: "https://account-book-sepia.vercel.app",
    cleartext: false,
  },
};

export default config;
