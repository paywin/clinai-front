# Revisão de alinhamento — 02/10/2026

Frontend: https://github.com/paywin/clinai-front
Backend: https://github.com/mateusxsv/clinai (main; árvore analisada 6d001afe7838fd7bde1f8df157f701c7cc28ac1f).
Documentação oficial: https://docs.google.com/document/d/1xjya1UpeCYRj53sv1eehHqOFDnyVy2uNoCt346D--OY/edit

A documentação oficial não pôde ser lida pelo ambiente. Sua conformidade permanece pendente; não inferir requisitos a partir deste relatório. Análise estática do código, sem execução do backend ou acesso a banco de dados.

## Resultado

As entidades principais estão alinhadas conceitualmente: pacientes, médicos, pré-triagens e consultas. A integração técnica ainda NÃO é direta. O backend usa JavaScript/CommonJS, Node.js, Express e Mongoose/MongoDB; o frontend usa React/TypeScript. Linguagens diferentes não são um impedimento.

`docs/API.md` descreve uma proposta do frontend, não rotas já implementadas pelo backend.

| Área | Front atual | Backend atual | Ajuste necessário |
|---|---|---|---|
| Base e rotas | /api, /doctors, /appointments | /medicos, /consultas, /pacientes, /pre-triagens; sem /api | Definir contrato e adaptar o cliente; mudar somente a URL base não resolve |
| Autenticação | /auth/login, /auth/register, /auth/recover, /auth/logout e GET /me; cookies | Nenhuma dessas rotas ou middleware de autenticação encontrado | Implementar identidade, sessão, autorização e recuperação antes do uso real |
| Paciente | name, birth, email, phone, health | cpf, nome, idade e sexo obrigatórios; peso/altura opcionais | Definir campos oficiais, incluir os obrigatórios e combinar data de nascimento versus idade; backend ainda não armazena e-mail/telefone/senha de paciente |
| Histórico | crônicas, alergias, reações, medicamentos contínuos, cirurgias e apoio | alergias, doencasFamilia, cirurgias | Unificar histórico sem descartar campos; distinguir histórico familiar de doença crônica |
| Médico | id, name, specialty, clinic, image, rating, reviews, plans, price | _id, nome, especialidade, clinica, foto, crm, email, idade | Traduzir campos/IDs; faltam avaliação, convênios e preço. Nunca preencher avaliações fictícias no modo real |
| Horários | GET /doctors/:id/slots?date=... e /availability | Não existem rotas/modelo de disponibilidade | Implementar agenda, horários livres e proteção contra reservas concorrentes |
| Pré-triagem | Relato estruturado opcional no agendamento; coleta sem IA | paciente, queixa, descricao, especialidade, medicamentos obrigatórios | Definir mapeamento e persistência; front não coleta especialidade nessa etapa e medicamentos podem ficar vazios |
| Consulta | doctorId, patientName, date, time, plan, health, report opcional | paciente, medico e preTriagem são ObjectIds obrigatórios; data, horario, status | Backend exige pré-triagem, mas front permite agendar sem ela. Decidir regra oficial e fluxo de criação; paciente vem da sessão autenticada |
| Status/atualização | scheduled/confirmed/cancelled; PATCH | agendada por padrão; String livre; PUT | Padronizar estados e transições; cancelamento preserva registro, não é DELETE |
| Resumo médico | reviewed e snapshot do histórico | Sem reviewed ou snapshot equivalente | Definir revisão e histórico vinculado ao atendimento |
| Erros | message | mensagem e erro | Adaptar envelope e status; não exibir detalhes internos do banco |
| CORS | credentials: include | cors() sem origem explícita/credentials | Configurar origem autorizada e credenciais se mantida autenticação por cookie |

## Problemas concretos encontrados no backend

1. `src/controller/consultaController.js`, função `listarConsultas`: falta `await` em `Consulta.find().populate(...)`. O código tenta serializar um objeto Query em vez da lista resolvida.
2. `src/controller/preTriagemController.js`, função `buscarPreTriagem`: o ramo de registro ausente usa `error.message` sem existir `error` nesse escopo e não retorna após a resposta 404. Corrigir para `return res.status(404).json({ mensagem: ... })`.
3. Rotas de pacientes, consultas e pré-triagens não têm autenticação/autorização e as listagens são globais. Isso precisa ser resolvido antes de conectar dados reais de saúde.
4. Criação/atualização passam `req.body` diretamente para Mongoose; updates não usam `runValidators: true`. Definir campos aceitos e validar permissões, estados, referências e datas.
5. Reserva não verifica conflitos nem disponibilidade. Garantir conflito atomicamente no backend; bloquear botão no frontend é insuficiente.
6. `package.json` não possui testes implementados. Não foi possível verificar comportamento real via suíte do backend.

## Ordem sugerida para integração

1. Conferir a documentação oficial e decidir campos de cadastro e obrigatoriedade da pré-triagem.
2. Corrigir controllers, definir contrato de erros e validar modelos.
3. Implementar autenticação e escopo de acesso por paciente/médico.
4. Fixar contrato de rotas e criar um adaptador TypeScript entre os DTOs em português do backend e os tipos das telas. Não é necessário renomear o backend inteiro.
5. Implementar disponibilidade e reservas, depois confirmação/cancelamento e resumo médico.
6. Testar os dois projetos juntos: sessão após refresh, cadastro, isolamento de contas, horários, conflito 409 e cancelamento.

Nenhuma alteração foi enviada ao repositório do backend. Este relatório registra o estado consultado, que pode mudar durante o desenvolvimento.
