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
  /** true cuando el fondo del hero (canvas o poster) terminó de cargar */
  heroCargado: boolean;
  marcarHeroCargado: () => void;
};

const AppReadyContext = createContext<AppReadyApi>({
  ready: false,
  marcarListo: () => {},
  heroCargado: false,
  marcarHeroCargado: () => {},
});

export function useAppReady(): AppReadyApi {
  return useContext(AppReadyContext);
}

export function AppReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [heroCargado, setHeroCargado] = useState(false);
  const marcarListo = useCallback(() => setReady(true), []);
  const marcarHeroCargado = useCallback(() => setHeroCargado(true), []);
  return (
    <AppReadyContext.Provider
      value={{ ready, marcarListo, heroCargado, marcarHeroCargado }}
    >
      {children}
    </AppReadyContext.Provider>
  );
}
