import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SettingsAccountSection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    setErr(null);
    try {
      await logout();
      navigate("/account", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Account
      </h2>
      {user && (
        <p className="text-sm text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{user.username}</span>
        </p>
      )}
      <p className="text-xs text-slate-500">
        Password changes are not available in the app yet. To reset access, remove the user row in the database
        or start from a fresh volume, then sign up again.
      </p>
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <div className="border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={loggingOut}
          className="h-10 w-full rounded-none border border-red-200 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-800 disabled:opacity-50"
          onClick={() => void onLogout()}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </section>
  );
}
