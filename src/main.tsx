import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./styles.css";
import { Provider, useApp } from "./state";
import { Layout, Page, Forward } from "./components/ui";
import { Welcome, Access, Login, Recover, Register } from "./pages/Auth";
import { Home, Profile, History } from "./pages/Patient";
import { Doctors, Book, Appointments } from "./pages/Booking";
import { Triage } from "./pages/Triage";
import { DoctorAgenda, AvailabilityPage } from "./pages/Doctor";
function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "patient" | "doctor";
}) {
  const { profile } = useApp();
  if (!profile) return <Navigate to="/entrar" replace />;
  if (role && profile.role !== role)
    return (
      <Navigate
        to={profile.role === "doctor" ? "/medico" : "/inicio"}
        replace
      />
    );
  return children;
}
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/acesso" element={<Access />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/recuperar" element={<Recover />} />
        <Route path="/cadastro" element={<Register />} />
        <Route
          path="/inicio"
          element={
            <Protected role="patient">
              <Home />
            </Protected>
          }
        />
        <Route
          path="/perfil"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/historico"
          element={
            <Protected role="patient">
              <History />
            </Protected>
          }
        />
        <Route
          path="/triagem"
          element={
            <Protected role="patient">
              <Triage />
            </Protected>
          }
        />
        <Route
          path="/medicos"
          element={
            <Protected role="patient">
              <Doctors />
            </Protected>
          }
        />
        <Route
          path="/medicos/:id"
          element={
            <Protected role="patient">
              <Book />
            </Protected>
          }
        />
        <Route
          path="/consultas"
          element={
            <Protected role="patient">
              <Appointments />
            </Protected>
          }
        />
        <Route
          path="/medico"
          element={
            <Protected role="doctor">
              <DoctorAgenda />
            </Protected>
          }
        />
        <Route
          path="/disponibilidade"
          element={
            <Protected role="doctor">
              <AvailabilityPage />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <Page title="Página não encontrada">
              <Forward to="/">Voltar ao início</Forward>
            </Page>
          }
        />
      </Routes>
    </Layout>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
