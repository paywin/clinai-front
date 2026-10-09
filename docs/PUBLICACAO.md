# Publicar o backup no GitHub Pages

Esta configuração pertence à branch `backup/historico-2026-10-02`.

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **backup/historico-2026-10-02** e a pasta **/docs**.
4. Salve e aguarde a publicação. Acesse https://paywin.github.io/clinai-front/.

A pasta `docs` já contém o site compilado. Não publique a raiz do código-fonte: o Pages não compila TypeScript/React automaticamente.

Para atualizar o site após editar o backup:

```bash
npm ci
npm run build:pages
git add src scripts vite.config.ts package.json index.html docs
git commit -m "Atualiza o backup no Pages"
git push origin backup/historico-2026-10-02
```

O build `pages` usa os dados locais já existentes no backup, sem depender de um backend. Não use dados pessoais reais nessa cópia. O build normal (`npm run build`) mantém a configuração HTTP de produção. As rotas no Pages usam `#` para permitir recarregar telas como `#/perfil` sem erro 404. Logos, scripts e fontes usam o prefixo `/clinai-front/`.

A tela de perfil usa a mesma largura, espaçamento e cartões das páginas comuns; os formulários de cadastro e pré-triagem continuam com a largura própria dessas etapas.
