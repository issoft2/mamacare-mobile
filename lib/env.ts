/**
 * Expo public env for Clerk. See app.config.js for where .env files are loaded from.
 */

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Resolved API origin for @mamacare/api (also pass to configureApiBaseUrl in _layout). */
export const API_BASE_URL =
  API_URL?.trim() && API_URL.trim().length > 0
    ? API_URL.trim().replace(/\/$/, "")
    : "http://localhost:80";

function getClerkPublishableKey(): string {
  const v = CLERK_KEY?.trim() ?? "";
  if (!v) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
        "Set it in .env (see frontend/mobile/.env.example) or in Vercel → Settings → Environment Variables for production builds."
    );
  }
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (isDev) {
    if (!v.startsWith("pk_")) {
      // eslint-disable-next-line no-console
      console.warn(
        "[MamaCare] Clerk publishable keys usually start with pk_ — double-check EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY if sign-in fails."
      );
    }
  }
  return v;
}

export const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();

if (typeof __DEV__ !== "undefined" && __DEV__ && !API_URL?.trim()) {
  // eslint-disable-next-line no-console
  console.warn(
    "[MamaCare] EXPO_PUBLIC_API_URL is not set; API client defaults to http://localhost:80. " +
      "On a physical device, set it to http://<your-lan-ip>:80."
  );
}
