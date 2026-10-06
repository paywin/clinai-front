// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createLocalId } from "../services/local-id";
import { demoProfile, mockService } from "../services/mock";
afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); });
it("usa o gerador nativo quando disponível", () => {
  vi.stubGlobal("crypto", { randomUUID: () => "id-nativo" });
  expect(createLocalId()).toBe("id-nativo");
});
it("gera UUID sem randomUUID", () => {
  const original = globalThis.crypto;
  vi.stubGlobal("crypto", { getRandomValues: original.getRandomValues.bind(original) });
  const ids = Array.from({length:100}, createLocalId);
  expect(new Set(ids).size).toBe(100);
  expect(ids[0]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});
it("cadastra, agenda e confirma sem randomUUID", async () => {
  const original = globalThis.crypto;
  vi.stubGlobal("crypto", { getRandomValues: original.getRandomValues.bind(original) });
  const {id, ...profile} = demoProfile;
  const registered = await mockService.register(profile, "exemplo123");
  const appointment = await mockService.book({doctorId:"gustavo",patientName:registered.name,date:"2030-01-10",time:"09:00",plan:"Particular",health:registered.health});
  expect(registered.id).not.toBe(appointment.id);
  expect((await mockService.updateAppointment(appointment.id,{status:"confirmed"})).status).toBe("confirmed");
  expect((await mockService.getAppointments())[0].id).toBe(appointment.id);
});
it("gera IDs locais distintos mesmo sem crypto", () => {
  vi.stubGlobal("crypto", undefined);
  expect(createLocalId()).not.toBe(createLocalId());
});
