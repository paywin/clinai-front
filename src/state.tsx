import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Profile, Report } from "./domain/types";
import { service, isMock } from "./services/api";
function restore<T>(key: string, fallback: T): T {
  if (!isMock) return fallback;
  try {
    return (
      JSON.parse(sessionStorage.getItem("clinai:" + key) || "null") ?? fallback
    );
  } catch {
    return fallback;
  }
}
export type Theme = "system" | "light" | "dark";
function preference<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem("clinai:" + key) || "null") ?? fallback
    );
  } catch {
    return fallback;
  }
}
const Context = createContext<{
  theme: Theme;
  setTheme: (value: Theme) => void;
  ready: boolean;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  report: Report | undefined;
  setReport: (r: Report | undefined) => void;
  large: boolean;
  setLarge: (v: boolean) => void;
} | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() =>
    restore("session", null),
  );
  const [report, setReport] = useState<Report | undefined>(() =>
    restore("report", undefined),
  );
  const [large, setLarge] = useState(() => preference("large", false));
  const [theme, setTheme] = useState<Theme>(() =>
    preference("theme", "system"),
  );
  const [ready, setReady] = useState(isMock);
  const [sessionError, setSessionError] = useState("");
  const restoreSession = async () => {
    setSessionError("");
    try {
      setProfile(await service.getSession());
      setReady(true);
    } catch (e) {
      setSessionError(
        e instanceof Error
          ? e.message
          : "Não foi possível recuperar sua sessão.",
      );
    }
  };
  useEffect(() => {
    if (!isMock) void restoreSession();
    const expire = () => {
      setProfile(null);
      setReport(undefined);
    };
    window.addEventListener("clinai:expired", expire);
    return () => window.removeEventListener("clinai:expired", expire);
  }, []);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media?.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#101e22" : "#f2f4f3");
    };
    apply();
    media?.addEventListener("change", apply);
    try {
      localStorage.setItem("clinai:theme", JSON.stringify(theme));
      localStorage.setItem("clinai:large", JSON.stringify(large));
    } catch {
      /* Storage may be disabled. */
    }
    return () => media?.removeEventListener("change", apply);
  }, [theme, large]);
  useEffect(() => {
    if (isMock) {
      sessionStorage.setItem("clinai:session", JSON.stringify(profile));
      sessionStorage.setItem("clinai:report", JSON.stringify(report ?? null));
    }
  }, [profile, report]);
  return (
    <Context.Provider
      value={{
        profile,
        setProfile,
        report,
        setReport,
        large,
        setLarge,
        theme,
        setTheme,
        ready,
      }}
    >
      <div className={large ? "app large" : "app"}>
        {ready ? (
          children
        ) : (
          <main className="session-screen">
            <img
              className="logo-on-light"
              src="/assets/clinai-mark.png"
              alt="ClinAi"
              width="100"
            />
            <img
              className="logo-on-dark"
              src="/assets/logo.png"
              alt="ClinAi"
              width="100"
            />
            <h1>Seu espaço de cuidado</h1>
            {sessionError ? (
              <>
                <p role="alert">{sessionError}</p>
                <button
                  className="button"
                  onClick={() => void restoreSession()}
                >
                  Tentar novamente
                </button>
              </>
            ) : (
              <p role="status">Recuperando sua sessão…</p>
            )}
          </main>
        )}
      </div>
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context)!;
}
