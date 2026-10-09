# Apresentação no GitHub Pages

Backup da versão de 09/10/2026, baseado no commit `884e43ebac049df2f144ec767490d0547d922477` da main. Esta branch usa dados fictícios locais e não acessa o backend. A integração real permanece na main.

## Publicar

Em Settings → Pages, selecione Deploy from a branch, a branch `backup/apresentacao-2026-10-09` e a pasta `/docs`. Salve e aguarde a publicação.

Endereço: https://paywin.github.io/clinai-front/

## Apresentar

Abra Acessar minha conta, escolha Paciente ou Médico e clique em Entrar na apresentação. É possível navegar, agendar e cancelar consultas locais, consultar o resumo do paciente, editar perfil e disponibilidade, alternar tema e acessibilidade. Os exemplos de consulta usam datas relativas à primeira abertura da sessão.

Os dados são fictícios e ficam no sessionStorage da aba. Atualizar a página mantém a sessão. Para reiniciar os exemplos, feche a aba e abra novamente. Não cadastre informações pessoais ou senhas reais. Recuperação de senha não envia e-mail. O VLibras, se habilitado, depende do serviço externo oficial.

## Atualizar o visual

Nesta branch, execute `npm ci` e `npm run build:pages`. Inclua os arquivos gerados em `docs/` no commit. Não publique a raiz do código Vite: o Pages precisa do HTML e JavaScript compilados. As rotas usam hash para funcionar ao atualizar páginas internas.

Não faça merge do adaptador de apresentação na main.
