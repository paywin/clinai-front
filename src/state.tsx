import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Profile, Report } from "./domain/types";
import { isMock } from "./services/api";
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
const Context = createContext<{
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
  const [large, setLarge] = useState(false);
  useEffect(() => {
    if (isMock) {
      sessionStorage.setItem("clinai:session", JSON.stringify(profile));
      sessionStorage.setItem("clinai:report", JSON.stringify(report ?? null));
    }
  }, [profile, report]);
  return (
    <Context.Provider
      value={{ profile, setProfile, report, setReport, large, setLarge }}
    >
      <div className={large ? "app large" : "app"}>{children}</div>
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context)!;
}
