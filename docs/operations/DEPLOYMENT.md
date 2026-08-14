# Deploy no Railway

## Arquitetura

- serviço web construído pelo `Dockerfile` em modo standalone;
- PostgreSQL 17 gerenciado pelo Railway;
- bucket privado Cloudflare R2 para documentos;
- domínio com TLS terminado pelo Railway;
- ambientes separados de homologação e produção.

Nunca compartilhe banco, bucket, domínio, secret de autenticação ou credenciais R2
entre homologação e produção.

## Variáveis obrigatórias

Configure no serviço web:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
APP_ENV
LOG_LEVEL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
REP_CREDENTIAL_PEPPER
```

Use `APP_ENV=staging` na homologação e `APP_ENV=production` em produção. A URL do
Better Auth deve ser a URL HTTPS exata de cada ambiente. Gere secrets diferentes
com pelo menos 32 caracteres.

## Homologação

1. Crie um projeto Railway e um PostgreSQL 17.
2. Crie o bucket R2 exclusivo de homologação e credenciais limitadas ao bucket.
3. Conecte o repositório ao serviço web.
4. Cadastre as variáveis obrigatórias.
5. Confirme que o Railway detectou `railway.toml` e o `Dockerfile`.
6. Faça o deploy. O `preDeployCommand` executará as migrations antes da troca.
7. Valide `/api/health/live` e `/api/health/ready`.
8. Crie o primeiro administrador pelo processo controlado descrito no runbook.
9. Execute o checklist de homologação com usuários responsáveis.

## Produção

Repita a topologia com recursos e credenciais novos. Antes da primeira publicação:

- configure domínio e aguarde TLS válido;
- defina `BETTER_AUTH_URL` com o domínio definitivo;
- confirme backup automático do PostgreSQL;
- habilite versionamento e regra de retenção no bucket R2;
- faça um backup manual validado;
- registre responsáveis de negócio e suporte;
- promova exatamente o commit aprovado em homologação.

## Rollback

O rollback da aplicação deve apontar para a imagem do commit anterior. Migrations
da aplicação são progressivas e não devem ser revertidas automaticamente. Se uma
mudança de banco impedir o rollback, interrompa a promoção e siga o runbook de
incidente. Nunca execute restauração sobre produção sem aprovação do responsável
e confirmação explícita.
