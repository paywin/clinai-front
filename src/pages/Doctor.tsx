import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Forward,
  Page,
  Select,
  useAction,
} from "../components/ui";
import { service } from "../services/api";
import { useApp } from "../state";
import type { Appointment } from "../domain/types";
import { dateLabel, getTimes, nextDates } from "./Booking";
import { HealthSummary } from "./Auth";
import { ReportSummary } from "./Triage";
export function DoctorAgenda() {
  const { profile } = useApp();
  const [list, setList] = useState<Appointment[]>([]);
  const [date, setDate] = useState(nextDates()[0]);
  const [selected, setSelected] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { busy, error, run } = useAction();
  const load = async () => {
    setList(await service.getAppointments());
    setLoading(false);
  };
  useEffect(() => {
    void run(load);
  }, []);
  const appointments = list
    .filter(
      (a) =>
        a.doctorId === profile!.id &&
        a.date === date &&
        a.status !== "cancelled",
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const detail = appointments.find((a) => a.id === selected);
  return (
    <Page title="Agenda do médico" subtitle={`${profile!.name} • Clínica JAM`}>
      <div className="agenda-toolbar">
        <Field
          label="Data da agenda"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelected(undefined);
          }}
        />
        <Forward to="/disponibilidade">Editar disponibilidade</Forward>
      </div>
      <div className="stats">
        <Card>
          <strong>{appointments.length}</strong>
          <span>Consultas no dia</span>
        </Card>
        <Card>
          <strong>{appointments.filter((a) => a.report).length}</strong>
          <span>Relatos disponíveis</span>
        </Card>
        <Card>
          <strong>{appointments.filter((a) => a.reviewed).length}</strong>
          <span>Resumos revisados</span>
        </Card>
      </div>
      <ErrorMessage message={error} />
      {error && (
        <Button secondary onClick={() => void run(load)}>
          Tentar novamente
        </Button>
      )}
      <div className="booking-grid">
        <div>
          {loading ? (
            <p>Carregando agenda…</p>
          ) : appointments.length ? (
            appointments.map((a) => (
              <Card key={a.id}>
                <div className="appointment-top">
                  <strong className="time-label">{a.time}</strong>
                  <div>
                    <h2>{a.patientName}</h2>
                    <p>Consulta presencial</p>
                    <span className="status scheduled">
                      {a.reviewed
                        ? "Resumo revisado"
                        : a.report
                          ? "Pré-triagem disponível"
                          : "Histórico disponível"}
                    </span>
                  </div>
                </div>
                <Button secondary onClick={() => setSelected(a.id)}>
                  Abrir resumo do paciente
                </Button>
              </Card>
            ))
          ) : (
            <Card className="empty">
              <CalendarDays size={32} />
              <h2>Agenda livre</h2>
              <p>Nenhuma consulta para {dateLabel(date)}.</p>
              <small>
                Na demonstração, agende com Dr. Gustavo Melo pela área do
                paciente para visualizar aqui.
              </small>
            </Card>
          )}
        </div>
        {detail ? (
          <Card>
            <h2>Resumo de {detail.patientName}</h2>
            <p>
              {dateLabel(detail.date)} • {detail.time}
            </p>
            <h3>Histórico autodeclarado</h3>
            <HealthSummary health={detail.health} />
            <h3>Relato atual</h3>
            {detail.report ? (
              <ReportSummary report={detail.report} />
            ) : (
              <p>O paciente não preencheu a pré-triagem.</p>
            )}
            <p className="notice">
              Pendente de avaliação clínica. Revisar não equivale a concluir o
              atendimento.
            </p>
            {detail.reviewed ? (
              <p className="success">
                <CheckCircle2 size={18} /> Resumo revisado
              </p>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await service.updateAppointment(detail.id, {
                      reviewed: true,
                    });
                    await load();
                  })
                }
              >
                Marcar resumo como revisado
              </Button>
            )}
          </Card>
        ) : (
          <Card className="empty">
            <h2>Resumo do paciente</h2>
            <p>
              Selecione uma consulta para ver o histórico e o relato antes do
              atendimento.
            </p>
          </Card>
        )}
      </div>
    </Page>
  );
}
export function AvailabilityPage() {
  const [date, setDate] = useState(nextDates()[0]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("12:00");
  const [duration, setDuration] = useState("30");
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();
  const value = { date, start, end, duration: Number(duration) };
  useEffect(() => {
    void run(async () => {
      const all = await service.getAvailability();
      const v = all.find((v) => v.date === date);
      setStart(v?.start || "08:00");
      setEnd(v?.end || "12:00");
      setDuration(String(v?.duration || 30));
      setSaved(false);
    });
  }, [date]);
  return (
    <Page
      title="Disponibilidade"
      subtitle="Clínica JAM • consulta presencial"
      back="/medico"
      narrow
    >
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await service.saveAvailability(value);
              setSaved(true);
            });
          }}
        >
          <Field
            label="Data"
            required
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="two-fields">
            <Field
              label="Início do período"
              required
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setSaved(false);
              }}
            />
            <Field
              label="Fim do período"
              required
              type="time"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <Select
            label="Duração da consulta (minutos)"
            value={duration}
            onChange={(v) => {
              setDuration(v);
              setSaved(false);
            }}
            options={["15", "20", "30", "45", "60"]}
          />
          <p>Horários já agendados permanecem reservados.</p>
          {start < end && (
            <div className="tags">
              {getTimes(value).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          <ErrorMessage message={error} />
          {saved && (
            <p className="success" role="status">
              Disponibilidade salva e atualizada no calendário de agendamento.
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Salvando…" : "Salvar disponibilidade"}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
