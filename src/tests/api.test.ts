// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { httpService, request } from "../services/api";
afterEach(() => vi.unstubAllGlobals());
describe("Contrato HTTP", () => {
  it("restaura a sessão com cookie e trata 401 como sessão ausente", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    expect(await httpService.getSession()).toBeNull();
    expect(fetcher.mock.calls[0][1].credentials).toBe("include");
  });
  it("não transforma falha de servidor em logout", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"message":"Tente novamente"}', { status: 503 }),
        ),
    );
    await expect(httpService.getSession()).rejects.toThrow("Tente novamente");
  });
  it("consulta horários do médico sem preencher uma resposta vazia", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    expect(await httpService.getSlots("medico/1", "2026-11-02")).toEqual([]);
    expect(fetcher.mock.calls[0][0]).toContain(
      "/doctors/medico%2F1/slots?date=2026-11-02",
    );
  });
  it("expira a sessão ao receber 401 em recurso protegido", async () => {
    const listener = vi.fn();
    window.addEventListener("clinai:expired", listener);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    await expect(httpService.getAppointments()).rejects.toThrow();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("clinai:expired", listener);
  });
  it("preserva conflito de reserva e aceita resposta sem corpo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('{"message":"Horário reservado"}', { status: 409 }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 })),
    );
    await expect(request("/appointments", "POST", {})).rejects.toMatchObject({
      status: 409,
    });
    await expect(httpService.logout()).resolves.toBeUndefined();
  });
});
