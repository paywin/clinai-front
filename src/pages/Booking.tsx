import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { CalendarDays, MapPin, Star, Search, CheckCircle2 } from "lucide-react";
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
import type { Appointment, Doctor, Availability } from "../domain/types";
import { specialties } from "./Patient";
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
export function nextDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}
export function getTimes(v?: Availability) {
  if (!v) return ["09:00", "10:30", "11:00", "14:00", "15:30", "16:00"];
  const start = Number(v.start.slice(0, 2)) * 60 + Number(v.start.slice(3));
  const end = Number(v.end.slice(0, 2)) * 60 + Number(v.end.slice(3));
  const times = [];
  for (let t = start; t + v.duration <= end; t += v.duration)
    times.push(
      `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    );
  return times;
}
export function DoctorIdentity({ doctor }: { doctor: Doctor }) {
  return (
    <div className="doctor-identity">
      <div>
        <h2>{doctor.name}</h2>
        <p className="specialty-label">{doctor.specialty}</p>
        <p>
          <MapPin size={15} /> {doctor.clinic} · Recife
        </p>
        <span className="rating">
          <Star size={15} fill="currentColor" /> {doctor.rating.toFixed(1)}{" "}
          <small>({doctor.reviews} avaliações)</small>
        </span>
      </div>
      {doctor.image ? (
        <img
          className={"doctor-image " + (doctor.id === "joao" ? "flipped" : "")}
          src={"/assets/" + doctor.image}
          alt=""
        />
      ) : (
        <span className="avatar">{doctor.initials}</span>
      )}
    </div>
  );
}
export function Doctors() {
  const [q, setQ] = useSearchParams();
  const [term, setTerm] = useState("");
  const [plan, setPlan] = useState("Todos");
  const [sort, setSort] = useState("Mais bem avaliados");
  const [list, setList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, run } = useAction();
  const specialty = q.get("especialidade") || "Todas";
  const load = () =>
    run(async () => {
      setLoading(true);
      try {
        setList(await service.getDoctors());
      } finally {
        setLoading(false);
      }
    });
  useEffect(() => {
    void load();
  }, []);
  const results = list
    .filter(
      (d) =>
        (specialty === "Todas" || d.specialty === specialty) &&
        (plan === "Todos" || d.plans.includes(plan)) &&
        `${d.name} ${d.clinic} ${d.specialty}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            term
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
    )
    .sort((a, b) =>
      sort === "Menor valor particular"
        ? a.price - b.price
        : b.rating - a.rating,
    );
  return (
    <Page
      title="Encontrar atendimento"
      subtitle="Clínicas e profissionais • Recife"
    >
      <Card className="filters">
        <div className="search-field">
          <Search size={20} />
          <Field
            label="Procure uma clínica ou médico"
            placeholder="Nome, clínica ou especialidade"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select
          label="Especialidade"
          value={specialty}
          onChange={(v) => setQ(v === "Todas" ? {} : { especialidade: v })}
          options={["Todas", ...specialties.map((s) => s[0])]}
        />
        <Select
          label="Convênio"
          value={plan}
          onChange={setPlan}
          options={[
            "Todos",
            "Unimed",
            "Bradesco Saúde",
            "SulAmérica",
            "Particular",
          ]}
        />
      </Card>
      <div className="results-heading">
        <p>
          {loading
            ? "Buscando profissionais…"
            : `${results.length} profissionais encontrados`}
        </p>
        <Select
          label="Ordenar por"
          value={sort}
          onChange={setSort}
          options={["Mais bem avaliados", "Menor valor particular"]}
        />
      </div>
      <ErrorMessage message={error} />
      {error && <Button onClick={() => void load()}>Tentar novamente</Button>}
      <div className="doctors-grid">
        {results.map((d) => (
          <Card key={d.id}>
            <DoctorIdentity doctor={d} />
            <div className="tags">
              {d.plans.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            <div className="doctor-price">
              <span>Consulta particular</span>
              <strong>R$ {d.price}</strong>
            </div>
            <Forward to={"/medicos/" + d.id}>Ver perfil e horários</Forward>
          </Card>
        ))}
      </div>
      {!loading && !results.length && !error && (
        <Card className="empty">
          <Search size={32} />
          <h2>Nenhum profissional encontrado</h2>
          <p>Tente outra especialidade ou remova os filtros.</p>
          <Button
            secondary
            onClick={() => {
              setQ({});
              setTerm("");
              setPlan("Todos");
            }}
          >
            Limpar filtros
          </Button>
        </Card>
      )}
      <small>Profissionais, avaliações, convênios e valores fictícios.</small>
    </Page>
  );
}
export function Book() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile, report, setReport } = useApp();
  const [doctor, setDoctor] = useState<Doctor>();
  const [loaded, setLoaded] = useState(false);
  const [all, setAll] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [date, setDate] = useState(nextDates()[0]);
  const [time, setTime] = useState("");
  const [plan, setPlan] = useState("Particular");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<Appointment>();
  const { busy, error, run } = useAction();
  useEffect(() => {
    void run(async () => {
      const [doctors, appointments, slots] = await Promise.all([
        service.getDoctors(),
        service.getAppointments(),
        service.getAvailability(),
      ]);
      setDoctor(doctors.find((d) => d.id === id));
      setAll(appointments);
      setAvailability(slots);
      setLoaded(true);
    });
  }, [id]);
  if (!doctor)
    return (
      <Page
        title={
          loaded ? "Profissional não encontrado" : "Carregando profissional…"
        }
        back="/medicos"
      >
        <ErrorMessage message={error} />
        <Forward to="/medicos">Ver profissionais</Forward>
      </Page>
    );
  const reserved = (t: string) =>
    all.some(
      (a) => a.status !== "cancelled" && a.date === date && a.time === t,
    );
  const submit = () =>
    run(async () => {
      const appointment = await service.book({
        doctorId: doctor.id,
        patientName: profile!.name,
        date,
        time,
        plan,
        health: { ...profile!.health },
        report,
      });
      setDone(appointment);
      setReport(undefined);
    });
  return (
    <Page
      title={
        done
          ? "Consulta agendada!"
          : confirm
            ? "Confirmar consulta"
            : doctor.name
      }
      subtitle={
        done
          ? "Tudo pronto para o próximo passo"
          : doctor.specialty + " • " + doctor.clinic
      }
      back="/medicos"
    >
      {done ? (
        <Card className="narrow success-card">
          <CheckCircle2 className="success-icon" />
          <h2>Seu horário está reservado</h2>
          <p>
            {dateLabel(done.date)} às <strong>{done.time}</strong>
          </p>
          <p>
            {doctor.name}
            <br />
            {doctor.clinic} · Recife
          </p>
          <span className="status scheduled">Agendada</span>
          <p>Agendamento de demonstração. Nenhuma clínica foi contatada.</p>
          <Forward to="/consultas">Ver minhas consultas</Forward>
        </Card>
      ) : (
        <div className="booking-grid">
          <Card>
            <DoctorIdentity doctor={doctor} />
            <hr />
            <h3>Sobre o atendimento</h3>
            <p>Consulta presencial em {doctor.clinic}, Recife.</p>
            <p>
              Atendimento em {doctor.specialty.toLowerCase()}, com escuta e
              acompanhamento individual.
            </p>
            <div className="tags">
              {doctor.plans.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            <div className="notice">
              <CalendarDays />
              <p>
                Seu histórico e o relato de pré-triagem acompanharão esta
                consulta.
              </p>
            </div>
            <small>Perfil e disponibilidade ilustrativos.</small>
          </Card>
          <Card>
            {confirm ? (
              <>
                <h2>Confira os dados</h2>
                <dl className="summary">
                  <div>
                    <dt>Profissional</dt>
                    <dd>{doctor.name}</dd>
                  </div>
                  <div>
                    <dt>Data e horário</dt>
                    <dd>
                      {dateLabel(date)} às {time}
                    </dd>
                  </div>
                  <div>
                    <dt>Atendimento</dt>
                    <dd>Presencial · {doctor.clinic}</dd>
                  </div>
                  <div>
                    <dt>Pagamento</dt>
                    <dd>
                      {plan}
                      {plan === "Particular" ? ` · R$ ${doctor.price}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Resumo de saúde</dt>
                    <dd>
                      {report
                        ? "Histórico e relato atual"
                        : "Histórico de saúde"}
                    </dd>
                  </div>
                </dl>
                <ErrorMessage message={error} />
                <Button disabled={busy} onClick={() => void submit()}>
                  {busy ? "Reservando…" : "Confirmar agendamento"}
                </Button>
                <Button
                  secondary
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Alterar data ou horário
                </Button>
              </>
            ) : (
              <>
                <h2>Escolha um horário</h2>
                <p>Selecione o dia e o horário disponíveis.</p>
                <div className="date-grid">
                  {nextDates().map((d) => (
                    <button
                      key={d}
                      aria-pressed={date === d}
                      className={date === d ? "selected" : ""}
                      onClick={() => {
                        setDate(d);
                        setTime("");
                      }}
                    >
                      <small>
                        {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}
                      </small>
                      <strong>{d.slice(-2)}</strong>
                      <small>
                        {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="date-caption">{dateLabel(date)}</p>
                <div className="time-grid">
                  {getTimes(
                    doctor.id === "gustavo"
                      ? availability.find((v) => v.date === date)
                      : undefined,
                  ).map((t) => (
                    <button
                      disabled={reserved(t)}
                      aria-pressed={time === t}
                      className={time === t ? "selected" : ""}
                      key={t}
                      onClick={() => setTime(t)}
                    >
                      {t}
                      {reserved(t) && <small>Reservado</small>}
                    </button>
                  ))}
                </div>
                <Select
                  label="Forma de atendimento"
                  value={plan}
                  onChange={setPlan}
                  options={doctor.plans}
                />
                <ErrorMessage message={error} />
                <Button
                  disabled={!time || reserved(time)}
                  onClick={() => setConfirm(true)}
                >
                  Continuar com o agendamento
                </Button>
              </>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
export function Appointments() {
  const [list, setList] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState("Próximas");
  const [selected, setSelected] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { busy, error, run } = useAction();
  const load = async () => {
    const [a, d] = await Promise.all([
      service.getAppointments(),
      service.getDoctors(),
    ]);
    setList(a);
    setDoctors(d);
    setLoading(false);
  };
  useEffect(() => {
    void run(load);
  }, []);
  const filtered = list
    .filter((a) =>
      filter === "Canceladas"
        ? a.status === "cancelled"
        : a.status !== "cancelled",
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <Page title="Minhas consultas" subtitle="Seus próximos passos de cuidado">
      <div className="tabs">
        {["Próximas", "Canceladas"].map((f) => (
          <button
            aria-pressed={filter === f}
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      {error && (
        <Button secondary onClick={() => void run(load)}>
          Tentar novamente
        </Button>
      )}
      {loading && !error ? (
        <p role="status">Carregando consultas…</p>
      ) : filtered.length === 0 ? (
        <Card className="empty">
          <CalendarDays size={36} />
          <h2>
            {filter === "Canceladas"
              ? "Nenhuma consulta cancelada"
              : "Nenhuma consulta agendada"}
          </h2>
          <p>Encontre um profissional e escolha o melhor horário para você.</p>
          <Forward to="/medicos">Encontrar atendimento</Forward>
        </Card>
      ) : (
        filtered.map((a) => {
          const d = doctors.find((d) => d.id === a.doctorId);
          return (
            <Card key={a.id}>
              <div className="appointment-top">
                <div className="date-tile">
                  <strong>{a.date.slice(-2)}</strong>
                  <small>
                    {new Date(a.date + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                      { month: "short" },
                    )}
                  </small>
                </div>
                <div>
                  <span className={"status " + a.status}>
                    {a.status === "scheduled"
                      ? "Agendada"
                      : a.status === "confirmed"
                        ? "Presença confirmada"
                        : "Cancelada"}
                  </span>
                  <h2>{d?.name}</h2>
                  <p>
                    {d?.specialty} · {d?.clinic}
                    <br />
                    {dateLabel(a.date)} às {a.time}
                  </p>
                </div>
              </div>
              <div className="actions">
                <Button
                  secondary
                  onClick={() => setSelected(selected === a.id ? null : a.id)}
                >
                  {selected === a.id ? "Fechar detalhes" : "Ver detalhes"}
                </Button>
                {a.status === "scheduled" && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await service.updateAppointment(a.id, {
                          status: "confirmed",
                        });
                        await load();
                      })
                    }
                  >
                    Confirmar presença
                  </Button>
                )}
                {a.status !== "cancelled" && (
                  <button
                    className="danger-link"
                    onClick={() => setCancel(a.id)}
                  >
                    Cancelar consulta
                  </button>
                )}
              </div>
              {selected === a.id && (
                <div className="details">
                  <p>
                    <strong>Paciente:</strong> {a.patientName}
                  </p>
                  <p>
                    <strong>Modalidade:</strong> Presencial · Recife
                  </p>
                  <p>
                    <strong>Convênio:</strong> {a.plan}
                  </p>
                  <p>
                    <strong>Informações compartilhadas:</strong> histórico de
                    saúde{a.report ? " e relato de pré-triagem" : ""}.
                  </p>
                </div>
              )}
              {cancel === a.id && (
                <div className="notice warning" role="alert">
                  <div>
                    <h3>Cancelar esta consulta?</h3>
                    <p>
                      O horário será liberado. Para voltar, faça um novo
                      agendamento.
                    </p>
                    <div className="actions">
                      <Button secondary onClick={() => setCancel(null)}>
                        Manter consulta
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await service.updateAppointment(a.id, {
                              status: "cancelled",
                            });
                            setCancel(null);
                            await load();
                          })
                        }
                      >
                        Confirmar cancelamento
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </Page>
  );
}
