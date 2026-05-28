import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/account" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}
