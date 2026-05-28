import { useCallback, useEffect, useRef, useState } from "react";
import {
  isChromiumFamily,
  isFirefox,
  isIosSafari,
  isStandaloneDisplay,
} from "../lib/pwa";

const IOS_TIP_KEY = "budget-pwa-ios-tip-dismissed";
const MANUAL_INSTALL_KEY = "budget-pwa-manual-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function manualDismissed(): boolean {
  try {
    return localStorage.getItem(MANUAL_INSTALL_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  deferredRef.current = deferred;

  const [iosTip, setIosTip] = useState(false);
  const [firefoxTip, setFirefoxTip] = useState(false);
  const [chromiumFallback, setChromiumFallback] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setChromiumFallback(false);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    try {
      const dismissed = localStorage.getItem(IOS_TIP_KEY) === "1";
      if (!dismissed && isIosSafari()) setIosTip(true);
    } catch {
      /* private mode */
    }

    if (!manualDismissed() && isFirefox() && !isIosSafari()) {
      setFirefoxTip(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || isFirefox() || isIosSafari() || manualDismissed()) return;
    if (!isChromiumFamily()) return;

    const id = window.setTimeout(() => {
      if (!deferredRef.current && !manualDismissed()) {
        setChromiumFallback(true);
      }
    }, 4500);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!deferred) return;
    const onInstalled = () => {
      setDeferred(null);
      setChromiumFallback(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [deferred]);

  const dismissManual = useCallback(() => {
    try {
      localStorage.setItem(MANUAL_INSTALL_KEY, "1");
    } catch {
      /* ignore */
    }
    setFirefoxTip(false);
    setChromiumFallback(false);
  }, []);

  const dismissIos = useCallback(() => {
    try {
      localStorage.setItem(IOS_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setIosTip(false);
  }, []);

  const runInstall = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user dismissed or error */
    } finally {
      setDeferred(null);
      setInstalling(false);
    }
  }, [deferred]);

  if (isStandaloneDisplay()) return null;

  if (deferred) {
    return (
      <div className="border-t border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-800">
            Install <span className="font-bold">Budget</span> for a full-screen app experience.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="h-9 rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
              onClick={() => setDeferred(null)}
            >
              Not now
            </button>
            <button
              type="button"
              disabled={installing}
              className="h-9 rounded-none bg-indigo-600 px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
              onClick={() => void runInstall()}
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (iosTip) {
    return (
      <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-800">
            <span className="font-bold">Add Budget to your Home Screen:</span> tap{" "}
            <span className="font-semibold">Share</span>, then{" "}
            <span className="font-semibold">Add to Home Screen</span>. Opens like an app without the
            browser bar.
          </p>
          <button
            type="button"
            className="self-start text-xs font-bold uppercase tracking-wider text-amber-900 underline"
            onClick={dismissIos}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (firefoxTip) {
    return (
      <div className="border-t border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-slate-800">
            <span className="font-bold">Open Budget like an app:</span> use the{" "}
            <span className="font-semibold">menu</span> (☰) and choose{" "}
            <span className="font-semibold">Install</span>, or{" "}
            <span className="font-semibold">Install this site as an app</span>. On some versions you
            will see an install icon in the address bar.
          </p>
          <button
            type="button"
            className="h-9 shrink-0 self-start rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
            onClick={dismissManual}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (chromiumFallback) {
    return (
      <div className="border-t border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-sm text-slate-800">
            <span className="font-bold">Install as an app:</span> open the browser{" "}
            <span className="font-semibold">⋮</span> menu and look for{" "}
            <span className="font-semibold">Install Budget…</span>,{" "}
            <span className="font-semibold">Install page as app</span>, or{" "}
            <span className="font-semibold">Save and share → Install</span> (wording varies by
            version).
          </p>
          <button
            type="button"
            className="h-9 shrink-0 self-start rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700"
            onClick={dismissManual}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
}
