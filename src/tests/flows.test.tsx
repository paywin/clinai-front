// @vitest-environment jsdom
import React from "react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "../state";
import {
  mockService,
  demoProfile,
  validateAvailability,
} from "../services/mock";
import { Book, Appointments, getTimes, nextDates } from "../pages/Booking";
import { Triage } from "../pages/Triage";
import { DoctorAgenda } from "../pages/Doctor";
import { Register } from "../pages/Auth";
import { Home } from "../pages/Patient";
beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = vi.fn();
  sessionStorage.setItem("clinai:session", JSON.stringify(demoProfile));
});
afterEach(cleanup);
function mount(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Provider>
        <Routes>
          <Route path="/medicos/:id" element={<Book />} />
          <Route path="/test" element={element} />
          <Route path="/inicio" element={<Home />} />
          <Route path="/consultas" element={<Appointments />} />
        </Routes>
      </Provider>
    </MemoryRouter>,
  );
}
describe("Fluxos do ClinAi", () => {
  it("agenda, confirma presença e cancela uma consulta pela interface", async () => {
    const user = userEvent.setup();
    mount("/medicos/gustavo", null);
    await screen.findByRole("heading", { name: "Escolha um horário" });
    expect(
      (
        screen.getByRole("button", {
          name: "Continuar com o agendamento",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "09:00" }));
    await user.click(
      screen.getByRole("button", { name: "Continuar com o agendamento" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar agendamento" }),
    );
    await screen.findByRole("heading", { name: "Seu horário está reservado" });
    await user.click(
      screen.getByRole("link", { name: "Ver minhas consultas" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Confirmar presença" }),
    );
    await screen.findByText("Presença confirmada");
    await user.click(screen.getByRole("button", { name: "Cancelar consulta" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar cancelamento" }),
    );
    await screen.findByRole("heading", { name: "Nenhuma consulta agendada" });
    expect((await mockService.getAppointments())[0].status).toBe("cancelled");
  });
  it("encaminha o sinal de alerta para o SAMU e não gera diagnóstico", async () => {
    const user = userEvent.setup();
    mount("/test", <Triage />);
    await user.click(
      screen.getByRole("button", { name: "Confirmar histórico e continuar" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Sim, tenho um desses sinais" }),
    );
    expect(
      screen
        .getByRole("link", { name: "Ligar para o SAMU • 192" })
        .getAttribute("href"),
    ).toBe("tel:192");
    expect(screen.queryByRole("button", { name: "Continuar" })).toBeNull();
  });
  it("registra o relato e mantém respostas ao voltar para editar", async () => {
    const user = userEvent.setup();
    mount("/test", <Triage />);
    await user.click(
      screen.getByRole("button", { name: "Confirmar histórico e continuar" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Não tenho esses sinais" }),
    );
    await user.type(
      screen.getByLabelText("Descreva o principal incômodo"),
      "Dor no joelho",
    );
    await user.type(screen.getByLabelText("Quando começou?"), "Há 3 dias");
    await user.type(
      screen.getByLabelText("Onde sente o incômodo?"),
      "Joelho direito",
    );
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Editar respostas" }));
    expect(
      (
        screen.getByLabelText(
          "Descreva o principal incômodo",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("Dor no joelho");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Salvar relato" }));
    expect(JSON.parse(sessionStorage.getItem("clinai:report")!).complaint).toBe(
      "Dor no joelho",
    );
  });
  it("permite cadastro completo sem persistir a senha", async () => {
    const user = userEvent.setup();
    mount("/test", <Register />);
    await user.type(screen.getByLabelText("Nome completo"), "Paciente Teste");
    await user.type(screen.getByLabelText("Data de nascimento"), "1990-01-01");
    await user.type(screen.getByLabelText("Telefone"), "81999999999");
    await user.type(screen.getByLabelText("E-mail"), "teste@example.com");
    await user.type(screen.getByLabelText("Criar senha"), "SenhaFicticia123");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.type(screen.getByLabelText("Doenças crônicas"), "Não");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await screen.findByRole("heading", { name: "Olá, Paciente" });
    expect(JSON.stringify(sessionStorage)).not.toContain("SenhaFicticia123");
  });
  it("mostra ao médico o histórico vinculado e permite revisar", async () => {
    const a = await mockService.book({
      doctorId: "gustavo",
      patientName: "Maria Santos",
      date: nextDates()[0],
      time: "09:00",
      plan: "Particular",
      health: demoProfile.health,
    });
    sessionStorage.setItem(
      "clinai:session",
      JSON.stringify({
        ...demoProfile,
        id: "gustavo",
        role: "doctor",
        name: "Dr. Gustavo Melo",
      }),
    );
    const user = userEvent.setup();
    mount("/test", <DoctorAgenda />);
    await user.click(
      await screen.findByRole("button", { name: "Abrir resumo do paciente" }),
    );
    expect(screen.getByText("Penicilina")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Marcar resumo como revisado" }),
    );
    await waitFor(async () =>
      expect(
        (await mockService.getAppointments()).find((x) => x.id === a.id)
          ?.reviewed,
      ).toBe(true),
    );
  });
  it("impede conflito de horário e libera uma reserva cancelada", async () => {
    const input = {
      doctorId: "gustavo",
      patientName: "Maria",
      date: nextDates()[0],
      time: "09:00",
      plan: "Particular",
      health: demoProfile.health,
    };
    const a = await mockService.book(input);
    await expect(mockService.book(input)).rejects.toThrow("reservado");
    await mockService.updateAppointment(a.id, { status: "cancelled" });
    await expect(mockService.book(input)).resolves.toHaveProperty(
      "status",
      "scheduled",
    );
  });
  it("valida disponibilidade e não gera consulta além do fim do período", () => {
    expect(() =>
      validateAvailability({
        date: "2026-10-20",
        start: "12:00",
        end: "08:00",
        duration: 30,
      }),
    ).toThrow();
    expect(
      getTimes({
        date: "2026-10-20",
        start: "08:00",
        end: "09:10",
        duration: 30,
      }),
    ).toEqual(["08:00", "08:30"]);
  });
});
