# ClinAi — Frontend

Frontend do projeto integrador ClinAi, baseado no [protótipo de baixa fidelidade](https://www.figma.com/design/aOoUkrXIJpt1gNSjmX8lHk/ClinAi-%E2%80%A2-Prot%C3%B3tipo-de-baixa-fidelidade?node-id=0-1). Este repositório contém somente o front. O backend poderá ser desenvolvido em outro repositório.

## Executar

Requisito: Node.js 22 ou superior.

```bash
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Na tela de acesso, selecione Paciente ou Médico e use **Entrar na demonstração**. Não é necessário configurar servidor, banco ou chave de API.

```bash
npm test       # testes de fluxos e regras de agendamento
npm run build # TypeScript + bundle para produção em dist/
npm run preview
```

## Funcionalidades

- Boas-vindas, seleção de perfil, login simulado e recuperação de acesso com confirmação explícita de que nenhum e-mail é enviado.
- Cadastro em etapas, revisão e histórico de saúde com perguntas fixas e respostas atualizáveis.
- Home do paciente com especialidades e atalhos para pré-triagem, histórico e consultas.
- Pré-triagem: confirmação do histórico, sinais de alerta, relato, intensidade, outros sintomas e revisão. O botão SAMU usa `tel:192`. Não há diagnóstico, IA clínica ou classificação automática de risco.
- Busca de profissionais por nome, clínica e especialidade; filtros de convênio; ordenação por avaliação ou preço particular.
- Perfil do médico, calendário de 14 dias, seleção de horário e convênio, revisão e confirmação do agendamento.
- Consultas: detalhes, confirmação de presença, cancelamento com revisão e listagem de canceladas.
- Área do médico: agenda diária, resumo de saúde associado à consulta, marcação de revisão e edição de disponibilidade. No mock, o médico é Gustavo Melo.
- Perfil editável, ampliação do texto, foco visível, navegação por teclado e layout com navegação inferior no celular.
- Estados de carregamento, erro, vazio, sucesso e bloqueio de envio durante operações.

## Organização

```text
src/
  components/ui.tsx   componentes reutilizáveis, layout e estados
  domain/types.ts     contratos de dados e interface ClinAiService
  pages/              telas de acesso, paciente, triagem, consultas e médico
  services/api.ts     cliente HTTP e seleção do adaptador
  services/mock.ts    demonstração sem servidor
  state.tsx          sessão, relato e preferências da interface
  tests/             testes de integração da interface e regras
  styles.css         tokens, componentes e responsividade
public/assets/       logo original fornecida pelo grupo
```

## Conectar o futuro backend

Copie `.env.example` para `.env` e configure:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=https://seu-backend.example.com/api
```

As telas usam `ClinAiService`; não precisam conhecer URLs de endpoints. O cliente HTTP já usa JSON, timeout de 15 segundos, tratamento de erro e cookies via `credentials: include`. Veja [o contrato da API](docs/API.md) para implementar o backend. Alterações no contrato devem ser refletidas em `src/domain/types.ts` e no adaptador, preservando as telas.

As variáveis `VITE_*` são públicas no bundle. Nunca coloque senhas de banco, tokens privados ou chaves de IA nelas.

## Demonstração e persistência

O modo padrão é `mock`. Médicos, notas, convênios e valores são fictícios. O login aceita e-mail válido e senha com pelo menos seis caracteres; o cadastro exige oito. Isso valida a interface, não autentica usuários. Senhas não são persistidas.

Perfil, sessão, histórico, relatos agendados, consultas e disponibilidade ficam em `sessionStorage`, apenas na aba atual. Os dados sobrevivem ao recarregamento e à troca entre os perfis de paciente/médico na mesma aba. Fechar a sessão da aba encerra essa persistência; ela não equivale a banco de dados. O modo HTTP não usa o armazenamento mock. Não use informações pessoais ou de saúde reais nesta versão.

Para demonstrar a agenda médica: entre como paciente, agende com Gustavo Melo, saia e entre como médico na mesma aba. A consulta aparecerá na data escolhida. A disponibilidade cadastrada pelo médico altera os horários do calendário de Gustavo; reservas existentes permanecem registradas.

## Publicação

O build é estático (`dist/`) e não requer backend para o modo demo. O servidor de hospedagem deve redirecionar rotas desconhecidas para `index.html`, pois o projeto usa BrowserRouter. A hospedagem ainda não foi configurada neste repositório.

## Referência visual e limites da validação

Foram mantidas a paleta verde-petróleo (`#073d43`), a cor primária (`#006c67`), Poppins, os fluxos principais e a hierarquia do protótipo. A composição foi adaptada para desktop e os controles foram tornados funcionais. A logo é o arquivo original enviado pelo grupo.

O limite do plano do Figma impediu a leitura detalhada de algumas telas. Os downloads de três imagens ilustrativas de especialidades falharam; os cards usam iniciais como fallback e permitem receber uma imagem pelo campo `Doctor.image`. Esses assets devem ser conferidos quando o acesso estiver disponível.

O build TypeScript e os testes DOM podem ser executados pelos comandos acima. A abertura da prévia local no navegador remoto foi bloqueada pelo ambiente; a conferência visual final em celular e desktop permanece pendente. Não se afirma equivalência pixel a pixel ao Figma.
