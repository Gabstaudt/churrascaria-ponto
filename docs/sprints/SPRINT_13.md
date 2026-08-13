# Sprint 13 — Atestados e Object Storage

## Objetivo

Receber e consultar atestados médicos com armazenamento privado, acesso mínimo e
integração à situação diária de ponto.

## Entregas

- tabela `medical_certificates` com funcionário, período, descrição mínima,
  vínculo com ausência, `fileKey`, metadados, aprovação e retenção;
- migration `0010_cooing_quentin_quire.sql`;
- integração isolada com Cloudflare R2 através do protocolo S3;
- upload direto do navegador ao bucket por URL PUT válida por cinco minutos;
- confirmação do objeto por `HEAD`, conferindo tamanho e tipo antes da gravação;
- arquivos permitidos: PDF, JPG e PNG, com limite de 8 MB;
- download privado após autorização, usando URL GET válida por dois minutos;
- cadastro administrativo já aprovado, com autoria e data registradas;
- vínculo automático do período às decisões `MEDICAL_CERTIFICATE`, refletindo a
  justificativa na situação diária;
- consulta geral em `/admin/atestados` e envio em `/admin/atestados/novo`;
- acesso a partir da análise de faltas e da aba de documentos do funcionário;
- auditoria sem nome do arquivo, chave do objeto, descrição clínica ou conteúdo;
- layout responsivo isolado, mantendo o padrão administrativo existente.

## Política de acesso e retenção

- o bucket deve permanecer privado;
- credenciais R2 existem somente no ambiente do servidor;
- URLs temporárias devem ser tratadas como credenciais e não podem ser gravadas;
- o sistema registra retenção operacional de cinco anos após o fim do atestado;
- exclusão automática deve ser configurada e revisada com a política legal da
  organização antes da produção;
- administradores visualizam os documentos nesta fase; o envio pelo empregado e
  fluxo de aprovação serão habilitados com o portal do funcionário.

## Configuração necessária

Adicionar ao `.env`:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=churrascaria-ponto-private
```

No R2, criar um bucket privado e um token limitado à leitura e escrita de objetos
nesse bucket. Para upload pelo navegador, configurar CORS permitindo `PUT` a partir
da origem da aplicação e o cabeçalho `Content-Type`.

## Validação

- `npm run db:generate`;
- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`.
