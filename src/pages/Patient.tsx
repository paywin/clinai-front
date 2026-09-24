import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Eye,
  Stethoscope,
  Bone,
  Baby,
  ScanFace,
  ClipboardList,
  ArrowUpRight,
  ShieldCheck,
  Accessibility,
} from "lucide-react";
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Forward,
  Page,
  useAction,
} from "../components/ui";
import { useApp } from "../state";
import { service } from "../services/api";
import { HealthFields, HealthSummary } from "./Auth";
export const specialties = [
  ["Clínica geral", Stethoscope],
  ["Cardiologia", Heart],
  ["Oftalmologia", Eye],
  ["Ortopedia", Bone],
  ["Dermatologia", ScanFace],
  ["Pediatria", Baby],
] as const;
export function Home() {
  const { profile } = useApp();
  return (
    <Page
      title={`Olá, ${profile!.name.split(" ")[0]}`}
      subtitle="Como podemos ajudar hoje?"
    >
      <div className="home-grid">
        <Card className="triage-card">
          <div className="eyebrow">
            <ClipboardList size={18} /> PRÉ-TRIAGEM
          </div>
          <h2>
            Conte como
            <br />
            você está.
          </h2>
          <p>
            Seu histórico já está salvo. Responda apenas sobre este atendimento.
          </p>
          <Forward to="/triagem">Iniciar pré-triagem</Forward>
          <small>Seu relato ajuda a preparar a consulta.</small>
        </Card>
        <div className="home-side">
          <Card>
            <div className="section-title">
              <ShieldCheck />
              <h2>Seu histórico de saúde</h2>
            </div>
            <p>
              {profile!.health.chronic || "Nenhuma condição informada"}
              <br />
              Alergias: {profile!.health.allergies || "Não informado"}
            </p>
            <Link className="text-link" to="/historico">
              Revisar histórico <ArrowUpRight size={16} />
            </Link>
          </Card>
          <Card>
            <h2>Minhas consultas</h2>
            <p>
              Veja horários, confirme sua presença e acompanhe seus
              agendamentos.
            </p>
            <Link className="text-link" to="/consultas">
              Ver consultas <ArrowUpRight size={16} />
            </Link>
          </Card>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Encontre seu especialista</h2>
          <p>Escolha a especialidade para ver médicos e horários.</p>
        </div>
        <Link className="text-link" to="/medicos">
          Ver todos
        </Link>
      </div>
      <div className="specialties">
        {specialties.map(([name, Icon]) => (
          <Link
            to={"/medicos?especialidade=" + encodeURIComponent(name)}
            className="specialty"
            key={name}
          >
            <span>
              <Icon size={28} />
            </span>
            <strong>{name}</strong>
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </div>
    </Page>
  );
}
export function Profile() {
  const { profile, setProfile, setReport, large, setLarge } = useApp();
  const [data, setData] = useState(profile!);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();
  return (
    <Page title="Meu perfil" subtitle="Seus dados e preferências" narrow>
      <Card>
        <div className="profile-heading">
          <span className="avatar">{profile!.name.charAt(0)}</span>
          <div>
            <h2>{profile!.name}</h2>
            <p>
              {profile!.role === "doctor"
                ? "Profissional de saúde"
                : "Paciente"}
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              setProfile(await service.saveProfile(data));
              setSaved(true);
            });
          }}
        >
          <Field
            label="Nome completo"
            required
            minLength={3}
            value={data.name}
            onChange={(e) => {
              setSaved(false);
              setData({ ...data, name: e.target.value });
            }}
          />
          <Field
            label="E-mail"
            required
            type="email"
            value={data.email}
            onChange={(e) => {
              setSaved(false);
              setData({ ...data, email: e.target.value });
            }}
          />
          <Field
            label="Telefone"
            type="tel"
            value={data.phone}
            onChange={(e) => {
              setSaved(false);
              setData({ ...data, phone: e.target.value });
            }}
          />
          <ErrorMessage message={error} />
          {saved && (
            <p role="status" className="success">
              Dados atualizados.
            </p>
          )}
          <Button disabled={busy} type="submit">
            {busy ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </Card>
      {profile!.role === "patient" && (
        <Card>
          <h2>Histórico de saúde</h2>
          <p>Revise sempre que algo mudar.</p>
          <Forward to="/historico">Atualizar histórico</Forward>
        </Card>
      )}
      <Card>
        <div className="section-title">
          <Accessibility />
          <h2>Acessibilidade</h2>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={large}
            onChange={(e) => setLarge(e.target.checked)}
          />
          Ampliar o texto
        </label>
        <p>
          O site também respeita o zoom do navegador e a navegação pelo teclado.
        </p>
      </Card>
      <Button
        secondary
        onClick={() =>
          void run(async () => {
            await service.logout();
            setProfile(null);
            setReport(undefined);
          })
        }
      >
        Sair da conta
      </Button>
    </Page>
  );
}
export function History() {
  const { profile, setProfile } = useApp();
  const [health, setHealth] = useState(profile!.health);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();
  return (
    <Page
      title="Atualizar histórico"
      subtitle="Informações salvas na sua conta"
      back="/perfil"
      narrow
    >
      <Card>
        {saved ? (
          <>
            <h2 className="success">Histórico atualizado</h2>
            <HealthSummary health={health} />
            <Forward to="/inicio">Voltar ao início</Forward>
            <Forward to="/triagem">Continuar pré-triagem</Forward>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                setProfile(await service.saveProfile({ ...profile!, health }));
                setSaved(true);
              });
            }}
          >
            <p>
              As perguntas são fixas; suas respostas podem ser atualizadas
              quando necessário.
            </p>
            <HealthFields value={health} onChange={setHealth} />
            <ErrorMessage message={error} />
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar histórico"}
            </Button>
          </form>
        )}
      </Card>
    </Page>
  );
}
