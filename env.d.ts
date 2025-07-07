declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_RTC_BASE_URL: string;
      NEXT_PUBLIC_DJI_APP_ID: string;
      NEXT_PUBLIC_DJI_APP_KEY: string;
      NEXT_PUBLIC_DJI_LICENSE: string;
      API_HOST: string;
      NODE_ENV: "dev" | "prod" | "test";
    }
  }
}
export { };

