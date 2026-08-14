# Backup e restauração

## Política mínima

- backup automático diário do PostgreSQL, mantido pelo provedor;
- backup lógico semanal com `pg_dump` em local criptografado e separado;
- retenção operacional de 35 dias, sujeita à política LGPD definida pela empresa;
- versionamento do bucket R2 e retenção coerente com documentos trabalhistas;
- teste de restauração trimestral em banco vazio e isolado;
- registro do responsável, data, duração e resultado de cada ensaio.

## Criar backup lógico

É necessário ter as ferramentas cliente do PostgreSQL 17.

```bash
DATABASE_URL="postgresql://..." npm run backup:db -- /caminho/seguro/backups
```

O script cria um arquivo no formato custom e um checksum SHA-256. Não envie esses
arquivos para Git, e-mail ou armazenamento público.

## Ensaio de restauração

Crie um PostgreSQL vazio exclusivamente para o ensaio. A restauração limpa objetos
existentes no banco de destino, portanto o script exige confirmação explícita:

```bash
TARGET_DATABASE_URL="postgresql://banco-isolado..." \
CONFIRM_RESTORE="RESTORE" \
npm run restore:db -- /caminho/backup.dump
```

Depois da restauração:

1. execute `npm run db:migrate:prod` apontando para o banco restaurado;
2. inicie uma instância temporária da aplicação;
3. valide health check, login, funcionários, marcações, fechamentos e auditoria;
4. compare contagens críticas entre origem e restauração;
5. destrua o ambiente de ensaio após registrar o resultado.

## Critério de aceite

O backup só é considerado restaurável quando o checksum é válido, o `pg_restore`
termina sem erro e o checklist funcional passa no ambiente isolado.
