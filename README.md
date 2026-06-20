# Shack Menu

Fluxo inicial do produto: autenticação com Google via Supabase e criação do restaurante com logo no Cloudflare R2.

## Configuração

1. Copie as variáveis de `.env.example` para `.env` e preencha os valores.
2. No Supabase, habilite o provedor Google em **Authentication > Providers** usando o Client ID e o Client Secret do Google.
3. No Google Cloud, adicione a callback mostrada pelo Supabase. Normalmente ela é `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:8788` às Redirect URLs de desenvolvimento.
5. Execute `supabase/migrations/202606200001_create_restaurants.sql` no SQL Editor do Supabase.
6. Crie um token de API do R2 com permissão de leitura e escrita no bucket `shackmenu` e configure as variáveis `R2_*`.
7. Em **R2 > shackmenu > Settings > CORS Policy**, configure a política de `r2-cors.example.json`, substituindo o domínio de exemplo pelo domínio real da aplicação.

O `google_id_client` e o `google_oauth_secret` não são consumidos pela aplicação. Eles devem ser cadastrados diretamente no provedor Google do Supabase. A aplicação usa apenas a chave pública `SUPABASE_ANON_KEY`; nenhuma chave secreta é enviada ao navegador.

## Desenvolvimento

```bash
npm install
npm run dev
```

A interface e a API ficam na mesma origem: `http://localhost:8788`.

## Produção

```bash
npm run build
npm start
```

O servidor entrega a aplicação compilada e a API na mesma origem, usando a porta definida em `PORT`.
