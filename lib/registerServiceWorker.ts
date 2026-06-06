export function registerServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn("[safeborn] service worker registration failed", error);
      });
  });
}
