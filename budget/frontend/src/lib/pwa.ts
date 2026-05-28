/** True when opened from home screen / installed PWA (no browser URL bar). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notChrome;
}

export function isOffline(): boolean {
  if (typeof window === "undefined") return false;
  return !window.navigator.onLine;
}

/** Firefox never fires `beforeinstallprompt`; install is via the browser menu or address bar. */
export function isFirefox(): boolean {
  if (typeof window === "undefined") return false;
  return /Firefox\//i.test(window.navigator.userAgent);
}

/** Blink-based browsers that typically support install + `beforeinstallprompt` when criteria are met. */
export function isChromiumFamily(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/Firefox/i.test(ua)) return false;
  return /Chrome|Chromium|Edg\/|OPR\/|Brave/i.test(ua);
}

/** Registers a minimal SW (no caching) so the app qualifies as installable where browsers require one. */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", type: "classic", updateViaCache: "none" })
      .then((reg) => {
        void reg.update();
      })
      .catch(() => {
        /* non-secure context (e.g. http://LAN IP) or registration blocked */
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register, { once: true });
  } else {
    register();
  }
}
