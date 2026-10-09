import { cp, mkdir, rm, writeFile } from "node:fs/promises";
// Preserva os documentos Markdown. Substitui apenas os arquivos publicados.
await mkdir("docs", { recursive: true });
await rm("docs/assets", { recursive: true, force: true });
await cp("dist/assets", "docs/assets", { recursive: true });
await cp("dist/index.html", "docs/index.html");
await writeFile("docs/.nojekyll", "");
console.log("Backup compilado em docs/. Publique a branch de backup pela pasta /docs.");
