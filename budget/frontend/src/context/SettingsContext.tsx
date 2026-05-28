import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiGet, apiPatch } from "../api/client";
import type { AppSettings } from "../api/types";

type Ctx = {
  currencyCode: string;
  timeZone: string;
  refresh: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
};

const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCode] = useState("THB");
  const [timeZone, setTimeZone] = useState(defaultTimeZone);

  const refresh = useCallback(async () => {
    const s = await apiGet<AppSettings>("/api/app-settings");
    setCode(s.currencyCode);
    if (s.timeZone) {
      setTimeZone(s.timeZone);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const s = await apiPatch<AppSettings>("/api/app-settings", partial);
    setCode(s.currencyCode);
    if (s.timeZone) {
      setTimeZone(s.timeZone);
    }
  }, []);

  const value = useMemo(
    () => ({ currencyCode, timeZone, refresh, updateSettings }),
    [currencyCode, timeZone, refresh, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  const c = useContext(SettingsContext);
  if (!c) throw new Error("useSettings requires SettingsProvider");
  return c;
}
