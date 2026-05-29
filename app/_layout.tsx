/**
 * mobile/app/_layout.tsx
 * Root layout — sets up Clerk auth, React Query, and navigation.
 */

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  Slot,
  usePathname,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text, TouchableOpacity } from "react-native";
import { configureApiBaseUrl, configureApiClient } from "@mumcare/api";

import { API_BASE_URL, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY } from "@/lib/env";
import {
  configurePushNotificationsAsync,
  getNotificationTypeFromNotification,
  getNotificationTypeFromResponse,
  getRouteFromNotification,
  getRouteFromNotificationResponse,
  isExpoGoEnvironment,
  recordPushNotificationEventAsync,
  registerDevicePushTokenForUserAsync,
  shouldShowForegroundBannerForUserAsync,
} from "@/lib/pushNotifications";
import { registerServiceWorker } from "@/lib/registerServiceWorker";
import { checkConsentVersion } from "@/lib/legal";

/** Must run before any fetch from @mumcare/api — see configureApiBaseUrl in packages/api. */
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

function AppReconsentCheck() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const hasSession = Boolean(
      isSignedIn ||
        (userId != null && userId !== "") ||
        (sessionId != null && sessionId !== "")
    );

    if (!hasSession) {
      return;
    }

    if (pathname === "/legal/reconsent") {
      return;
    }

    let cancelled = false;

    async function verifyConsents() {
      const isOutdated = await checkConsentVersion();
      if (!cancelled && isOutdated) {
        router.replace("/legal/reconsent");
      }
    }

    verifyConsents();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, sessionId, pathname, router]);

  return null;
}

function PushTokenSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    if (!isLoaded || !isSignedIn || !userId) {
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await registerDevicePushTokenForUserAsync(userId);
      if (cancelled) {
        return;
      }

      if (result.status === "registered") {
        // eslint-disable-next-line no-console
        console.log("Push token registered for user:", userId);
        return;
      }

      if (result.status === "cached") {
        // eslint-disable-next-line no-console
        console.log("Push token already registered (cached):", userId);
        return;
      }

      if (result.status === "deferred") {
        // eslint-disable-next-line no-console
        console.warn("Push token sync deferred:", result.reason);
        return;
      }

      if (result.status === "denied") {
        // eslint-disable-next-line no-console
        console.warn("Push notifications permission denied:", result.reason);
        return;
      }

      if (result.status === "skipped") {
        // eslint-disable-next-line no-console
        console.log("Push token sync skipped:", result.reason);
        return;
      }

      if (result.status === "failed") {
        // eslint-disable-next-line no-console
        console.warn("Push token sync failed:", result.reason);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  return null;
}

function PushNotificationRuntimeHandlers() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const handledResponseIdRef = useRef<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [banner, setBanner] = useState<{
    title: string;
    body: string;
    route: string;
  } | null>(null);

  function invalidateDataForRoute(route: string) {
    const key = route.toLowerCase();
    if (key.includes("/tracker")) {
      void queryClient.invalidateQueries({ queryKey: ["tracker"] });
      return;
    }
    if (key.includes("/appointments") || key.includes("/profile")) {
      void queryClient.invalidateQueries({ queryKey: ["profile", "appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", "detail"] });
      return;
    }
    if (key.includes("/symptoms")) {
      void queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["content"] });
    void queryClient.invalidateQueries({ queryKey: ["profile", "detail"] });
  }

  function showForegroundBanner(payload: {
    title?: string | null;
    body?: string | null;
    route: string;
  }) {
    const next = {
      title: payload.title?.trim() || "New update from MumCare",
      body: payload.body?.trim() || "Tap to view your latest reminder.",
      route: payload.route,
    };
    setBanner(next);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setBanner(null);
      hideTimerRef.current = null;
    }, 5500);
  }

  function openRoute(route: string) {
    setBanner(null);
    invalidateDataForRoute(route);
    void recordPushNotificationEventAsync({
      event: "routed",
      notificationType: "unknown",
      route,
    });
    router.push(route as any);
  }

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    if (isExpoGoEnvironment()) {
      // eslint-disable-next-line no-console
      console.log("Push runtime listeners skipped in Expo Go (SDK 53+ limitation).");
      return;
    }

    let cancelled = false;
    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;

    (async () => {
      const Notifications = await import("expo-notifications");

      receivedSubscription = Notifications.addNotificationReceivedListener(
        async (notification) => {
          const route = getRouteFromNotification(notification);
          const notificationType = getNotificationTypeFromNotification(notification);
          void recordPushNotificationEventAsync({
            event: "received",
            notificationType,
            route,
          });
          invalidateDataForRoute(route);

          const shouldShow = await shouldShowForegroundBannerForUserAsync({
            userId,
            notificationType,
          });
          if (!shouldShow) {
            return;
          }

          showForegroundBanner({
            route,
            title: notification.request.content.title,
            body: notification.request.content.body,
          });
        }
      );

      responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const requestId = response.notification.request.identifier;
          if (handledResponseIdRef.current === requestId) {
            return;
          }
          handledResponseIdRef.current = requestId;
          const route = getRouteFromNotificationResponse(response);
          const notificationType = getNotificationTypeFromResponse(response);
          void recordPushNotificationEventAsync({
            event: "opened",
            notificationType,
            route,
          });
          openRoute(route);
        }
      );

      const initialResponse = await Notifications.getLastNotificationResponseAsync();
      if (cancelled || !initialResponse) {
        return;
      }

      const requestId = initialResponse.notification.request.identifier;
      if (handledResponseIdRef.current === requestId) {
        return;
      }
      handledResponseIdRef.current = requestId;
      const route = getRouteFromNotificationResponse(initialResponse);
      const notificationType = getNotificationTypeFromResponse(initialResponse);
      void recordPushNotificationEventAsync({
        event: "opened",
        notificationType,
        route,
      });
      openRoute(route);
    })();

    return () => {
      cancelled = true;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [queryClient, router, userId]);

  if (!banner) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.pushBannerRoot}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.pushBannerCard}
        onPress={() => openRoute(banner.route)}
      >
        <Text style={styles.pushBannerTitle}>{banner.title}</Text>
        <Text style={styles.pushBannerBody} numberOfLines={2}>
          {banner.body}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerServiceWorker();
    if (Platform.OS !== "web") {
      void configurePushNotificationsAsync();
    }
  }, []);

  const content =
    Platform.OS === "web" ? (
      <View style={styles.webRoot}>
        <AuthGuard />
      </View>
    ) : (
      <AuthGuard />
    );

  return (
    <ClerkProvider
      publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <PushNotificationRuntimeHandlers />
        <PushTokenSync />
        <AppReconsentCheck />
        {content}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: "100%",
    width: "100%",
    backgroundColor: "#F7F8FC",
  },
  pushBannerRoot: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 40,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  pushBannerCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFF8EF",
    borderWidth: 1,
    borderColor: "rgba(201,123,110,0.24)",
    shadowColor: "#8E5A54",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pushBannerTitle: {
    color: "#4D3B39",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  pushBannerBody: {
    color: "#6D4A45",
    fontSize: 12,
    lineHeight: 17,
  },
});
