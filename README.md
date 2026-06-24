# Shack Menu

Fluxo inicial do produto: autenticação com Google via Supabase e criação do restaurante com logo no Cloudflare R2.

Suporte: `support@shackmenu.com`.

O painel administrativo é liberado somente para os UUIDs Supabase definidos em
`ADMIN_USER_IDS`. Reembolsos são integrais sobre a última fatura paga, cancelam a
assinatura imediatamente e são registrados em `admin_refunds`.

## Configuração

1. Copie as variáveis de `.env.example` para `.env` e preencha os valores.
2. No Supabase, habilite o provedor Google em **Authentication > Providers** usando o Client ID e o Client Secret do Google.
3. No Google Cloud, adicione a callback mostrada pelo Supabase. Normalmente ela é `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:8788` às Redirect URLs de desenvolvimento.
   Em produção, defina a Site URL como `https://shackmenu.com` e adicione
   `https://shackmenu.com/` às Redirect URLs.
5. Execute `supabase db push` para aplicar as migrations.
6. Para o servidor Node local, configure as variáveis `R2_*`. No Pages, use apenas o binding `SHACKMENU_BUCKET`.

O navegador não acessa mais o R2 diretamente, portanto o bucket não precisa de uma política CORS para uploads.

## Stripe Billing

O plano Pro usa Stripe Checkout em modo de assinatura e custa R$ 49,90 por mês. Configure no `.env` local:

```env
STRIPE_SECRET=sk_test_...
STRIPE_PRO_PRICE_ID=price_1Tkc1CDFdXiucib2AQXXhqOx
SUPABASE_SERVICE_ROLE_KEY=...
```

O webhook de produção é `https://shackmenu.com/api/billing/webhook` e recebe:

- `checkout.session.completed`
- `checkout.session.async_payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

O `STRIPE_WEBHOOK_SECRET` é obrigatório no Pages e, para testes locais de webhook, pode ser gerado com o Stripe CLI. Nunca envie `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` ou a service role ao frontend.

## Mercado Pago OAuth e pedidos

Pedidos pagos online usam Mercado Pago Checkout Pro com OAuth por lojista. Cada restaurante precisa
conectar a própria conta Mercado Pago na tela **Pedidos** antes do checkout online aparecer no cardápio.
Assim o pagamento cai direto na conta Mercado Pago do lojista.

```env
MP_PUBLIC_PROD=APP_USR-...
MP_TOKEN_PROD=APP_USR-...
MP_CLIENT_ID=123456789
MP_CLIENT_SECRET=...
MP_CHECKOUT_TEST_MODE=false
```

Para validar cartões e webhooks com as credenciais `TEST-*`, defina temporariamente:

```env
MP_CHECKOUT_TEST_MODE=true
```

Nesse modo, o checkout usa `MP_TOKEN` de teste e não representa repasse real ao lojista.

No painel da aplicação Mercado Pago, configure a Redirect URL exatamente como:

```txt
https://shackmenu.com/api/mercadopago/callback
```

O webhook do Mercado Pago é enviado por preferência para:

```txt
https://shackmenu.com/api/orders/mercadopago/webhook
```

O Shack Menu usa o `access_token` OAuth do vendedor para criar a preferência e envia
`marketplace_fee` no plano gratuito.

No plano gratuito, o Shack Menu retém taxa de plataforma sobre pedidos pagos online. Configure:

```env
ORDER_PLATFORM_FEE_PERCENT=15
```

Valores entre `15` e `20` são aceitos. No plano Pro, a taxa Shack Menu é sempre zero.

O `google_id_client` e o `google_oauth_secret` não são consumidos pela aplicação. Eles devem ser cadastrados diretamente no provedor Google do Supabase. A aplicação usa apenas a chave pública `SUPABASE_ANON_KEY`; nenhuma chave secreta é enviada ao navegador.

## Desenvolvimento

```bash
npm install
npm run dev
```

A interface e a API ficam na mesma origem: `http://localhost:8788`.

## Produção

### Cloudflare Pages

Configure o projeto `shackmenu` com:

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

## Domínios próprios

Os domínios do plano Pro usam Cloudflare for SaaS. O cliente cria um CNAME, por exemplo
`menu.cliente.com`, apontando para `proxy-fallback.shackmenu.com`; ele nunca precisa acessar o
projeto Pages do Shack Menu.

O Worker de entrada usa `wrangler.saas.jsonc` e encaminha os custom hostnames ao app no Pages.
As variáveis `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_SAAS_ZONE_ID` e
`CLOUDFLARE_SAAS_CNAME_TARGET` são exclusivas do servidor.
