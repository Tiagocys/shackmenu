# Shack Menu

Fluxo inicial do produto: autenticação com Google via Supabase e criação do restaurante com logo no Cloudflare R2.

## Configuração

1. Copie as variáveis de `.env.example` para `.env` e preencha os valores.
2. No Supabase, habilite o provedor Google em **Authentication > Providers** usando o Client ID e o Client Secret do Google.
3. No Google Cloud, adicione a callback mostrada pelo Supabase. Normalmente ela é `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:8788` às Redirect URLs de desenvolvimento.
5. Execute `supabase db push` para aplicar as migrations.
6. Para o servidor Node local, configure as variáveis `R2_*`. No Pages, use apenas o binding `SHACKMENU_BUCKET`.

O navegador não acessa mais o R2 diretamente, portanto o bucket não precisa de uma política CORS para uploads.

O `google_id_client` e o `google_oauth_secret` não são consumidos pela aplicação. Eles devem ser cadastrados diretamente no provedor Google do Supabase. A aplicação usa apenas a chave pública `SUPABASE_ANON_KEY`; nenhuma chave secreta é enviada ao navegador.

## Desenvolvimento

```bash
npm install
npm run dev
```

A interface e a API ficam na mesma origem: `http://localhost:8788`.

## Produção

### Cloudflare Pages

Configure o projeto `shackmenu-axb` com:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22`
- Variáveis: `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- R2 binding: variável `SHACKMENU_BUCKET` apontando para o bucket `shackmenu`

As Pages Functions em `functions/` atendem somente `/api/*`. O arquivo `wrangler.jsonc` contém a mesma configuração para deploy via Wrangler.

Para simular o Pages localmente:

```bash
nvm use
npm run pages:dev
```

### Servidor Node

```bash
npm run build
npm start
```

O servidor entrega a aplicação compilada e a API na mesma origem, usando a porta definida em `PORT`.
