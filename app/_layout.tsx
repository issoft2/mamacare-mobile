/**
 * mobile/app/_layout.tsx
 * Root layout — sets up Clerk auth, React Query, and navigation.
 */

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Slot,
  usePathname,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";
import { configureApiBaseUrl, configureApiClient } from "@mamacare/api";

import { API_BASE_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY } from "@/lib/env";

/** Must run before any fetch from @mamacare/api — see configureApiBaseUrl in packages/api. */
configureApiBaseUrl(API_BASE_URL);

WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Clerk: native must use SecureStore. Web needs persistent storage; Clerk’s default
// is in-memory and reload drops the session. SecureStore is not reliable for auth on all web envs.
const webTokenCache = {
  getToken: async (key: string) => {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  },
  saveToken: async (key: string, token: string) => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, token);
  },
};

const nativeTokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const tokenCache = Platform.OS === "web" ? webTokenCache : nativeTokenCache;

/**
 * `segments[0] === "(auth)"` is not always true (pathname-only on web, etc.); if we get this wrong,
 * guests are pushed to welcome in a loop, or the signed-in user is never left on auth to complete flows.
 */
function isAuthGroupRoute(segments: string[], pathname: string) {
  if (segments[0] === "(auth)" || (segments as string[]).includes("(auth)")) {
    return true;
  }
  const p = pathname || "";
  return (
    p === "/welcome" ||
    p === "/login" ||
    p === "/register" ||
    p.startsWith("/auth/") ||
    p === "/auth/welcome" ||
    p === "/auth/login" ||
    p === "/auth/register"
  );
}

function isRegisterRoute(pathname: string) {
  const p = pathname || "";
  return p === "/register" || p.startsWith("/auth/register");
}

/** OAuth / SSO return path (see SocialSignInButtons + Clerk useSSO redirect). */
function isOAuthCallbackRoute(pathname: string) {
  const p = pathname || "";
  return p === "/sso-callback" || p.includes("/sso-callback");
}

/**
 * `isSignedIn` / `userId` can lag the restored JWT (especially on web + manual URL
 * or hard reload). Await `getToken()` when hooks say “signed out” but a token
 * may still be in `localStorage`.
 */
function AuthGuard() {
  const { isLoaded, isSignedIn, getToken, userId, sessionId } = useAuth();
  const segments = useSegments() as string[];
  const pathname = usePathname();
  const rootNav = useRootNavigationState();
  const router = useRouter();

  // Configure API client with Clerk token getter
  useEffect(() => {
    configureApiClient(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (rootNav == null) {
      return;
    }

    const inAuth = isAuthGroupRoute(segments, pathname);
    const onRegister = isRegisterRoute(pathname);
    const uid = userId as string | null | undefined;
    const sid = sessionId as string | null | undefined;
    const syncSession = Boolean(
      isSignedIn ||
        (uid != null && uid !== "") ||
        (sid != null && sid !== "")
    );

    if (syncSession) {
      if (inAuth && !onRegister) {
        router.replace("/tabs/home");
      }
      return;
    }

    let cancelled = false;
    (async () => {
      let token: string | null = null;
      try {
        token = (await getToken()) ?? null;
      } catch {
        token = null;
      }
      if (cancelled) {
        return;
      }
      const hasToken = token != null && token.length > 0;
      if (hasToken) {
        if (inAuth && !onRegister) {
          router.replace("/tabs/home");
        }
        return;
      }
      if (inAuth || isOAuthCallbackRoute(pathname)) {
        return;
      }
      router.replace("/auth/welcome");
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
    segments,
    pathname,
    rootNav?.key,
    getToken,
    router,
  ]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
