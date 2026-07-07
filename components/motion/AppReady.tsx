"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AppReadyApi = {
  /** true cuando el preloader terminó de salir: dispara la entrada del hero */
  ready: boolean;
  marcarListo: () => void;
};

const AppReadyContext = createContext<AppReadyApi>({
  ready: false,
  marcarListo: () => {},
});

export function useAppReady(): AppReadyApi {
  return useContext(AppReadyContext);
}

export function AppReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const marcarListo = useCallback(() => setReady(true), []);
  return (
    <AppReadyContext.Provider value={{ ready, marcarListo }}>
      {children}
    </AppReadyContext.Provider>
  );
}
