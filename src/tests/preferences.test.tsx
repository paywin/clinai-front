// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "../state";
import { Profile } from "../pages/Patient";
import { Login } from "../pages/Auth";
import { demoProfile } from "../services/mock";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem("clinai:session", JSON.stringify(demoProfile));
  window.scrollTo = vi.fn();
});
afterEach(cleanup);
it("persiste tema e tamanho do texto ao reabrir o perfil", async () => {
  const user = userEvent.setup();
  const mount = () =>
    render(
      <MemoryRouter>
        <Provider>
          <Profile />
        </Provider>
      </MemoryRouter>,
    );
  const view = mount();
  await user.click(screen.getByRole("button", { name: "Escuro" }));
  await user.click(screen.getByLabelText("Ampliar o texto"));
  expect(document.documentElement.dataset.theme).toBe("dark");
  view.unmount();
  mount();
  expect(
    screen.getByRole("button", { name: "Escuro" }).getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    (screen.getByLabelText("Ampliar o texto") as HTMLInputElement).checked,
  ).toBe(true);
});
it("permite revelar a senha sem perder o conteúdo", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Provider>
        <Login />
      </Provider>
    </MemoryRouter>,
  );
  const input = screen.getByLabelText("Senha") as HTMLInputElement;
  await user.type(input, "exemplo123");
  await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(input.type).toBe("text");
  expect(input.value).toBe("exemplo123");
  await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(input.type).toBe("password");
});
