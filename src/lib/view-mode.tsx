import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ViewMode = "teacher" | "student";
const KEY = "bitrahub:view-mode";

type Ctx = { mode: ViewMode; setMode: (m: ViewMode) => void; toggle: () => void };
const ViewModeContext = createContext<Ctx | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("teacher");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === "student" || stored === "teacher") setModeState(stored);
    } catch {}
  }, []);

  const setMode = (m: ViewMode) => {
    setModeState(m);
    try { localStorage.setItem(KEY, m); } catch {}
  };

  return (
    <ViewModeContext.Provider value={{ mode, setMode, toggle: () => setMode(mode === "teacher" ? "student" : "teacher") }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used inside ViewModeProvider");
  return ctx;
}