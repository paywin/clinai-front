// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { service } from "../servicos/api";
import { emptyHealth } from "../dominio/saude";
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Sem backend");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("restaura a sessão e apresenta consultas distintas para paciente e médico", async () => {
  const paciente = await service.login(
    "maria@exemplo.com",
    "exemplo123",
    "patient",
  );
  expect(await service.getSession()).toEqual(paciente);
  expect(
    (await service.getAppointments()).every(
      (a) => a.patientName === paciente.name,
    ),
  ).toBe(true);
  await service.logout();
  expect(await service.getSession()).toBeNull();
  const medico = await service.login(
    "gustavo@exemplo.com",
    "exemplo123",
    "doctor",
  );
  const agenda = await service.getAppointments();
  expect(agenda.length).toBeGreaterThan(0);
  expect(agenda.every((a) => a.doctorId === medico.id)).toBe(true);
  expect(
    agenda.some((a) => Date.parse(`${a.date}T${a.time}-03:00`) > Date.now()),
  ).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});
it("reserva por médico, impede duplicidade e libera horário ao cancelar sem randomUUID", async () => {
  vi.stubGlobal("crypto", {});
  await service.login("maria@exemplo.com", "exemplo123", "patient");
  const input = {
    doctorId: "gustavo",
    patientName: "Maria Santos",
    date: "2099-01-01",
    time: "09:00",
    plan: "Particular",
    health: emptyHealth,
  };
  const consulta = await service.book(input);
  expect(consulta.id).toBeTruthy();
  await expect(service.book(input)).rejects.toThrow("reservado");
  expect(await service.getSlots("gustavo", input.date)).not.toContain("09:00");
  await expect(
    service.book({ ...input, doctorId: "joana" }),
  ).resolves.toBeTruthy();
  await service.updateAppointment(consulta.id, { status: "cancelled" });
  expect(await service.getSlots("gustavo", input.date)).toContain("09:00");
  expect(fetch).not.toHaveBeenCalled();
});
it("salva perfil e disponibilidade no armazenamento local", async () => {
  const medico = await service.login(
    "gustavo@exemplo.com",
    "exemplo123",
    "doctor",
  );
  await service.saveProfile({ ...medico, name: "Dr. Gustavo" });
  expect((await service.getSession())?.name).toBe("Dr. Gustavo");
  await service.saveAvailability({
    date: "2099-02-01",
    start: "08:00",
    end: "09:00",
    duration: 30,
  });
  expect(await service.getSlots(medico.id, "2099-02-01")).toEqual([
    "08:00",
    "08:30",
  ]);
  expect(fetch).not.toHaveBeenCalled();
});
