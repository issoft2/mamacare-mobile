import type { Href, Router } from "expo-router";

/**
 * Runs after `setActive` so `useAuth()` can commit before we leave the auth group.
 * Without this, AuthGuard can see a stale `!isSignedIn` on `/tabs/*` and send users back
 * to the welcome screen.
 */
export function goHomeAfterClerkSetActive(
  router: Pick<Router, "replace">,
  href: Href = "/tabs/home"
) {
  queueMicrotask(() => {
    setTimeout(() => {
      router.replace(href);
    }, 0);
  });
}
