import { useState } from "react";
import { apiPut } from "../api/client";

interface SettingsAdminSectionProps {
  signupsEnabled: boolean;
  onRefresh: () => void;
}

export function SettingsAdminSection({ signupsEnabled, onRefresh }: SettingsAdminSectionProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggleSignups() {
    setErr(null);
    setBusy(true);
    try {
      await apiPut("/api/system-settings", { signupsEnabled: !signupsEnabled });
      onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Admin
      </h2>
      
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 cursor-pointer" onClick={toggleSignups}>
          <span className="text-sm font-medium text-slate-700">Allow New Signups</span>
          <span className="text-xs text-slate-500">Enable or disable registration for new users</span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={toggleSignups}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
            signupsEnabled ? "bg-indigo-600" : "bg-slate-200"
          } ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
          role="switch"
          aria-checked={signupsEnabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              signupsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
