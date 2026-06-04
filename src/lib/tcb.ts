import cloudbase from "@cloudbase/js-sdk";

const ENV_ID = import.meta.env.VITE_TCB_ENV_ID as string;
const APP_ENV = import.meta.env.VITE_APP_ENV as string | undefined;

export const LEDGER_ID = import.meta.env.VITE_LEDGER_ID || "sales-ledger-main";

export function isCloudSyncEnabled(): boolean {
  const enabled = import.meta.env.VITE_ENABLE_CLOUD_SYNC as string;
  return enabled === "true";
}

export function isTcbConfigured(): boolean {
  if (!Boolean(ENV_ID)) return false;
  if (!isCloudSyncEnabled()) return false;
  if (APP_ENV === "development") {
    console.warn(
      "[戈瓦记账本] VITE_APP_ENV=development 且开启了云同步！请检查 .env 配置，避免污染正式数据。"
    );
    return false;
  }
  return true;
}

let appInstance: ReturnType<typeof cloudbase.init> | null = null;

export function getTcbApp() {
  if (!isTcbConfigured()) return null;
  if (!appInstance) {
    appInstance = cloudbase.init({
      env: ENV_ID,
    });
  }
  return appInstance;
}

export function getDb() {
  const app = getTcbApp();
  if (!app) return null;
  return app.database();
}

export async function ensureAnonymousLogin(): Promise<void> {
  const app = getTcbApp();
  if (!app) return;
  const auth = app.auth({ persistence: "local" });
  const loginState = await auth.getLoginState();
  if (!loginState) {
    await auth.anonymousAuthProvider().signIn();
  }
}

