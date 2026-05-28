import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGet } from "../api/client";

export function AccountPage() {
  const { user, signup, login, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const redirectTo = (loc.state as { from?: string } | null)?.from ?? "/";

  const [signupsEnabled, setSignupsEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<{ signupsEnabled: boolean }>("/api/system-settings")
      .then((data) => {
        setSignupsEnabled(data.signupsEnabled);
        if (data.signupsEnabled) {
          setMode("signup");
        } else {
          setMode("login");
        }
      })
      .catch(() => {
        setSignupsEnabled(false);
        setMode("login");
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      setPassword("");
      navigate(redirectTo, { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading || signupsEnabled === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 bg-slate-50 px-4 py-10">
      <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Budget</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "signup"
            ? "Create an account to start managing your budget."
            : "Sign in to your account to continue."}
        </p>

        {signupsEnabled ? (
          <div className="mt-4 flex gap-2 border-b border-slate-100 pb-px">
            <button
              type="button"
              className={`flex-1 border-b-2 py-2 text-xs font-bold uppercase tracking-wider ${
                mode === "signup"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400"
              }`}
              onClick={() => {
                setMode("signup");
                setErr(null);
              }}
            >
              Sign up
            </button>
            <button
              type="button"
              className={`flex-1 border-b-2 py-2 text-xs font-bold uppercase tracking-wider ${
                mode === "login"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400"
              }`}
              onClick={() => {
                setMode("login");
                setErr(null);
              }}
            >
              Sign in
            </button>
          </div>
        ) : null}

        {err && <p className="mt-4 text-sm font-medium text-red-600">{err}</p>}

        <form className="mt-4 flex flex-col gap-3" onSubmit={(e) => void submit(e)}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Username
            <input
              className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={64}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              className="h-11 rounded-none border border-slate-200 bg-slate-50 px-3 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-11 rounded-none bg-indigo-600 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
