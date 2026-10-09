import type { ClinAiService } from "../domain/types";
import { mockService } from "./mock";
const env = import.meta.env;
export const isMock =
  env.VITE_API_MODE === "mock" ||
  env.MODE === "pages" ||
  (env.DEV && env.VITE_API_MODE !== "http") ||
  env.MODE === "test";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `${(env.VITE_API_BASE_URL || "http://localhost:3000/api").replace(/\/$/, "")}${path}`,
      {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (
        response.status === 401 &&
        !path.startsWith("/auth/") &&
        !(path === "/me" && method === "GET")
      )
        window.dispatchEvent(new Event("clinai:expired"));
      throw new ApiError(
        error?.message ||
          `Não foi possível concluir a solicitação (${response.status}).`,
        response.status,
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("O servidor demorou para responder. Tente novamente.");
    if (error instanceof TypeError)
      throw new Error(
        "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const httpService: ClinAiService = {
  getSession: async () => {
    try {
      return await request<import("../domain/types").Profile>("/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  getSlots: (id, date) =>
    request(
      `/doctors/${encodeURIComponent(id)}/slots?date=${encodeURIComponent(date)}`,
    ),
  login: (email, password, role) =>
    request("/auth/login", "POST", { email, password, role }),
  register: (profile, password) =>
    request("/auth/register", "POST", { ...profile, password }),
  recover: (email) => request("/auth/recover", "POST", { email }),
  getDoctors: () => request("/doctors"),
  saveProfile: (profile) => request("/me", "PUT", profile),
  getAppointments: () => request("/appointments"),
  book: (input) => request("/appointments", "POST", input),
  updateAppointment: (id, patch) =>
    request(`/appointments/${encodeURIComponent(id)}`, "PATCH", patch),
  getAvailability: () => request("/availability"),
  saveAvailability: (value) => request("/availability", "PUT", value),
  logout: () => request("/auth/logout", "POST"),
};
export const service = isMock ? mockService : httpService;
