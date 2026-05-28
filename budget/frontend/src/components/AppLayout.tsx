import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { MonthStrip } from "./MonthStrip";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { isOffline } from "../lib/pwa";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  [
    "py-3 text-center text-[10px] uppercase tracking-wider font-semibold border-t-2 transition-colors sm:py-4 sm:text-xs",
    isActive
      ? "border-neutral-900 text-neutral-900 bg-neutral-100/50"
      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
  ].join(" ");

export function AppLayout() {
  const [offline, setOffline] = useState(isOffline());

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-slate-50 md:max-w-2xl md:border-x md:border-slate-200 md:shadow-sm">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md">
        <MonthStrip />
      </header>
      {offline && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-amber-950">You&apos;re offline</p>
          <p className="mt-0.5 text-xs text-amber-900/80">
            Budget needs an internet connection to load and save your data. Reconnect to continue.
          </p>
        </div>
      )}
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
      <PwaInstallBanner />
      <nav className="sticky bottom-0 grid grid-cols-4 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:relative md:border-t-0 md:pb-0">
        <NavLink to="/" end className={linkCls}>
          Home
        </NavLink>
        <NavLink to="/expenses" className={linkCls}>
          Expenses
        </NavLink>
        <NavLink to="/wishlist" className={linkCls}>
          Wishlist
        </NavLink>
        <NavLink to="/settings" className={linkCls}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
}
