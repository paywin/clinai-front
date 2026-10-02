import type {
  Appointment,
  Availability,
  ClinAiService,
  Doctor,
  Health,
  Profile,
} from "../domain/types";
export const emptyHealth: Health = {
  chronic: "",
  allergies: "",
  reaction: "",
  medications: "",
  surgeries: "",
  support: "",
};
export const demoProfile: Profile = {
  id: "demo-patient",
  name: "Maria Santos",
  email: "maria@exemplo.com",
  birth: "1964-05-12",
  phone: "(81) 90000-0000",
  role: "patient",
  health: {
    chronic: "Hipertensão",
    allergies: "Penicilina",
    reaction: "Manchas e coceira na pele",
    medications: "Não informado",
    surgeries: "Não",
    support: "Prefiro textos maiores",
  },
};
export const doctors: Doctor[] = [
  {
    id: "gustavo",
    name: "Dr. Gustavo Melo",
    specialty: "Clínica geral",
    clinic: "Clínica JAM",
    rating: 4.9,
    reviews: 128,
    plans: ["Unimed", "Bradesco Saúde", "Particular"],
    price: 180,
    initials: "GM",
  },
  {
    id: "joana",
    name: "Dra. Joana Lima",
    specialty: "Cardiologia",
    clinic: "Clínica Lima",
    rating: 4.9,
    reviews: 96,
    plans: ["Unimed", "SulAmérica", "Particular"],
    price: 250,
    initials: "JL",
  },
  {
    id: "joao",
    name: "Dr. João Bezerra",
    specialty: "Ortopedia",
    clinic: "Clínica Faz Bem",
    rating: 4.8,
    reviews: 74,
    plans: ["Bradesco Saúde", "Particular"],
    price: 220,
    initials: "JB",
  },
  {
    id: "ana",
    name: "Dra. Ana Costa",
    specialty: "Oftalmologia",
    clinic: "Clínica Visão",
    rating: 4.9,
    reviews: 82,
    plans: ["Unimed", "Particular"],
    price: 200,
    initials: "AC",
  },
  {
    id: "beatriz",
    name: "Dra. Beatriz Alves",
    specialty: "Dermatologia",
    clinic: "Clínica Pele",
    rating: 4.7,
    reviews: 65,
    plans: ["SulAmérica", "Particular"],
    price: 230,
    initials: "BA",
  },
  {
    id: "pedro",
    name: "Dr. Pedro Rocha",
    specialty: "Pediatria",
    clinic: "Clínica Cuidar",
    rating: 4.8,
    reviews: 110,
    plans: ["Unimed", "Particular"],
    price: 190,
    initials: "PR",
  },
];
const read = <T>(key: string, fallback: T): T => {
  try {
    return (
      JSON.parse(sessionStorage.getItem("clinai:" + key) || "null") ?? fallback
    );
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) =>
  sessionStorage.setItem("clinai:" + key, JSON.stringify(value));
const delay = () => new Promise((resolve) => setTimeout(resolve, 180));
export function validateAvailability(v: Availability) {
  if (!v.date || v.start >= v.end || v.duration < 10 || v.duration > 120)
    throw new Error("Informe um período válido e duração de 10 a 120 minutos.");
}
export const mockService: ClinAiService = {
  async login(email, password, role) {
    await delay();
    if (!email.includes("@") || password.length < 6)
      throw new Error(
        "Informe um e-mail válido e uma senha com pelo menos 6 caracteres.",
      );
    const profile = read<Profile>("profile", demoProfile);
    return role === "doctor"
      ? {
          ...read<Profile>("doctorProfile", {
            ...demoProfile,
            id: "gustavo",
            name: "Dr. Gustavo Melo",
          }),
          email,
          role,
        }
      : { ...profile, email, role };
  },
  async register(profile, password) {
    await delay();
    if (password.length < 8)
      throw new Error("A senha precisa ter pelo menos 8 caracteres.");
    const value = { ...profile, id: crypto.randomUUID() };
    write("profile", value);
    return value;
  },
  async recover() {
    await delay();
  },
  async getDoctors() {
    await delay();
    return doctors;
  },
  async saveProfile(profile) {
    await delay();
    write(profile.role === "doctor" ? "doctorProfile" : "profile", profile);
    return profile;
  },
  async getAppointments() {
    await delay();
    return read<Appointment[]>("appointments", []);
  },
  async book(input) {
    await delay();
    const all = read<Appointment[]>("appointments", []);
    if (
      all.some(
        (a) =>
          a.status !== "cancelled" &&
          a.date === input.date &&
          a.time === input.time,
      )
    )
      throw new Error("Este horário já está reservado. Escolha outro.");
    const appointment: Appointment = {
      ...input,
      id: crypto.randomUUID(),
      status: "scheduled",
      reviewed: false,
    };
    write("appointments", [...all, appointment]);
    return appointment;
  },
  async updateAppointment(id, patch) {
    await delay();
    const all = read<Appointment[]>("appointments", []);
    const found = all.find((a) => a.id === id);
    if (!found) throw new Error("Consulta não encontrada.");
    if (found.status === "cancelled")
      throw new Error("Esta consulta foi cancelada.");
    Object.assign(found, patch);
    write("appointments", all);
    return found;
  },
  async getAvailability() {
    return read<Availability[]>("availability", []);
  },
  async saveAvailability(value) {
    validateAvailability(value);
    const all = read<Availability[]>("availability", []).filter(
      (v) => v.date !== value.date,
    );
    write("availability", [...all, value]);
  },
  async logout() {
    await delay();
  },
};
