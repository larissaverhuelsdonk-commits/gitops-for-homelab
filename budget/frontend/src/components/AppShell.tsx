import { SettingsProvider } from "../context/SettingsContext";
import { MonthProvider } from "../context/MonthContext";
import { AppLayout } from "./AppLayout";

export function AppShell() {
  return (
    <SettingsProvider>
      <MonthProvider>
        <AppLayout />
      </MonthProvider>
    </SettingsProvider>
  );
}
