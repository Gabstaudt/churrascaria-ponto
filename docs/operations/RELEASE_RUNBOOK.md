# Runbook de lançamento e estabilização

## Gate obrigatório

Execute `npm run release:check`. O lançamento é bloqueado se qualquer item crítico
não estiver aprovado: migrations, administrador, configuração jurídica, documentos
oficiais, adapter físico, alertas REP, falhas recentes e ensaio de restauração.
`RELEASE_RESTORE_TESTED=true` só deve ser usado quando existir evidência datada do
ensaio; não é uma forma de ignorar o controle.

## Sequência de implantação

1. Congelar alterações e identificar o commit/release candidato.
2. Fazer backup e registrar checksum, local e responsável.
3. Restaurar o backup em ambiente isolado e executar verificações funcionais.
4. Aplicar migrations em homologação; reconciliar contagens antes/depois.
5. Executar lint, tipos, testes, build, smoke e carga.
6. Validar Ponto Sync, conciliação REP e ausência de alertas.
7. Validar AEJ/Espelho com especialista e assinatura CAdES.
8. Executar o gate com todos os itens verdes.
9. Implantar, testar login e fluxos críticos e iniciar observação intensiva.

## Rollback

Interromper o lançamento diante de corrupção, perda/duplicação de marcações,
controle de acesso incorreto ou indisponibilidade persistente. Reverter a release,
preservar logs e filas, restaurar banco apenas com autorização e evidência de que a
migration não pode ser revertida de outra forma. Nunca apagar a fila do Ponto Sync.

## Observação intensiva

Nas primeiras 24 horas, revisar a cada hora: disponibilidade, latência, erros 5xx,
logins recusados, sincronizações, fila local e alertas. Do segundo ao sétimo dia,
revisar no início e fim do expediente. Registrar incidente, impacto, causa, correção
e evidência de recuperação.

## Teste de carga

Com a aplicação de homologação em execução:

```bash
LOAD_TEST_URL=https://homologacao.exemplo.com \
LOAD_TEST_REQUESTS=500 \
LOAD_TEST_CONCURRENCY=20 \
npm run test:load
```

O smoke falha com mais de 1% de erros ou p95 superior a 1 segundo. Isso verifica
prontidão/infraestrutura; cenários de negócio continuam cobertos pelos testes e
pela homologação manual controlada.
