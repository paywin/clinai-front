# Contrato de integração — proposta v1

Base: `VITE_API_BASE_URL`. Respostas de sucesso são JSON direto, sem envelope `data`. Datas são `YYYY-MM-DD`, horários `HH:mm`; por enquanto o front apresenta horários locais de Recife. O backend deve definir explicitamente o fuso `America/Recife` e manter esse contrato ou adaptar o cliente. IDs são strings. Erros: `{ "message": "mensagem legível" }` com status HTTP adequado.

| Método | Rota              | Entrada                                                          | Saída                                |
| ------ | ----------------- | ---------------------------------------------------------------- | ------------------------------------ |
| POST   | /auth/login       | email, password, role (`patient` ou `doctor`)                    | Profile                              |
| POST   | /auth/register    | dados de Profile sem id, mais password                           | Profile                              |
| POST   | /auth/recover     | email                                                            | 204                                  |
| POST   | /auth/logout      | —                                                                | 204                                  |
| GET    | /doctors          | —                                                                | Doctor[]                             |
| PUT    | /me               | Profile                                                          | Profile atualizado                   |
| GET    | /appointments     | —                                                                | Appointment[] visíveis para a sessão |
| POST   | /appointments     | doctorId, patientName, date, time, plan, health, report opcional | Appointment                          |
| PATCH  | /appointments/:id | status ou reviewed                                               | Appointment atualizado               |
| GET    | /availability     | —                                                                | Availability[]                       |
| PUT    | /availability     | date, start, end, duration                                       | 204                                  |

As interfaces completas e os campos obrigatórios estão em `src/domain/types.ts`. Exemplos fictícios estão em `src/services/mock.ts`.

## Responsabilidades do backend

- Autenticação real, hash de senha e sessão por cookie HttpOnly/Secure. O front não protege recursos por si só; os guards de rota apenas organizam a navegação.
- Autorizar cada acesso: paciente vê suas consultas; médico vê somente sua agenda e os resumos autorizados. Obter a identidade da sessão; não confiar em `patientName`, `role`, `id`, `reviewed` ou outros campos enviados pelo cliente como prova de permissão.
- Validar campos, disponibilidade, datas futuras e conflitos de reserva atomicamente. Retornar 409 quando o horário já tiver sido ocupado; validar sobreposição pelo intervalo completo, não apenas pelo horário inicial.
- O adaptador atual de disponibilidade é mínimo e cobre o profissional da sessão; antes de suportar agendas reais de vários médicos, adicionar `doctorId` ao endpoint público de horários e fazer o calendário consultar disponibilidade por profissional.
- Usar CORS com a origem exata do frontend e credenciais habilitadas; aplicar proteção CSRF e política de cookies apropriada à hospedagem escolhida.
- Definir retenção, consentimento, auditoria e proteção dos dados de saúde antes de uso real.
- Implementar recuperação por e-mail e restauração de sessão (`GET /me` pode ser acrescentado ao serviço). Atualmente o modo HTTP exige novo login após recarregar a página.
- Salvar histórico atualizável separadamente do resumo associado ao agendamento. A consulta utiliza um snapshot do histórico confirmado naquele momento.

## Integração incremental

1. Implementar login/cadastro e perfil, retornando os tipos definidos.
2. Implementar catálogo de médicos e horários por profissional.
3. Implementar reservas e transições de status com autorização no servidor.
4. Implementar agenda, revisão e disponibilidade médica.
5. Substituir mensagens de demonstração e condições ilustrativas somente após os serviços reais estarem funcionando.

Nenhum endpoint de IA foi criado. A pré-triagem é coleta estruturada de relato, sem interpretação médica automática.
