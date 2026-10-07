// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "../estado";
import { Configuracoes } from "../paginas/Configuracoes";
import { Login } from "../paginas/Autenticacao";
import { Doctors } from "../paginas/Agendamento";
import { Field } from "../componentes/interface";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.scrollTo = vi.fn();
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
  document.getElementById("clinai-vlibras")?.remove();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function mount(children = <Configuracoes />) {
  return render(
    <MemoryRouter>
      <Provider>{children}</Provider>
    </MemoryRouter>,
  );
}
it("ativa recursos, persiste escolhas e suspende seus efeitos ao desmarcar", async () => {
  const user = userEvent.setup();
  const view = mount();
  expect(
    (screen.getByLabelText(/Ampliar o texto/) as HTMLInputElement).closest(
      "fieldset",
    )?.disabled,
  ).toBe(true);
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  await user.click(screen.getByLabelText(/Ampliar o texto/));
  await user.click(screen.getByLabelText(/Aumentar o contraste/));
  await user.click(screen.getByRole("button", { name: "Escuro" }));
  expect(document.querySelector(".app.large")).toBeTruthy();
  expect(document.documentElement.dataset.contraste).toBe("true");
  view.unmount();
  mount();
  expect(
    (screen.getByLabelText(/Ampliar o texto/) as HTMLInputElement).checked,
  ).toBe(true);
  expect(document.documentElement.dataset.theme).toBe("dark");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelector(".app.large")).toBeNull();
  expect(document.documentElement.dataset.contraste).toBe("false");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelector(".app.large")).toBeTruthy();
});
it("carrega Libras somente ao optar e não duplica o script", async () => {
  const user = userEvent.setup();
  mount();
  expect(document.getElementById("clinai-vlibras")).toBeNull();
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  await user.click(screen.getByLabelText(/Ativar tradução em Libras/));
  expect(document.querySelectorAll("#clinai-vlibras").length).toBe(1);
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.documentElement.dataset.libras).toBe("false");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelectorAll("#clinai-vlibras").length).toBe(1);
});
it("tolera preferências inválidas e remove a sessão da antiga demonstração", async () => {
  localStorage.setItem("clinai:acessibilidade", '{"ativa":"false"}');
  sessionStorage.setItem("clinai:session", '{"name":"Identidade local"}');
  mount();
  expect(
    (screen.getByLabelText(/Quero usar recursos/) as HTMLInputElement).checked,
  ).toBe(false);
  await waitFor(() =>
    expect(sessionStorage.getItem("clinai:session")).toBeNull(),
  );
});
it("não oferece entrada simulada nem coleta senha sem autenticação real", () => {
  mount(<Login />);
  expect(screen.getByText("Acesso indisponível no momento")).toBeTruthy();
  expect(screen.queryByLabelText("Senha")).toBeNull();
  expect(screen.queryByText(/Entrar na demonstração/)).toBeNull();
});
it("exibe médicos reais sem avaliações e preços fictícios", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          '[{"_id":"abc","nome":"Ana Silva","especialidade":"Cardiologia"}]',
        ),
      ),
  );
  mount(<Doctors />);
  await screen.findByRole("heading", { name: "Ana Silva" });
  expect(screen.queryByText(/avaliações/)).toBeNull();
  expect(screen.queryByText(/R\$/)).toBeNull();
  expect(
    screen.getByText("Agendamento online ainda indisponível."),
  ).toBeTruthy();
});
it("permite revelar e ocultar senha preservando o valor", async () => {
  const user = userEvent.setup();
  render(<Field label="Senha" type="password" defaultValue="exemplo123" />);
  await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect((screen.getByLabelText("Senha") as HTMLInputElement).type).toBe(
    "text",
  );
  await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe(
    "exemplo123",
  );
});
