# Runbook — AFD REP-P

1. Execute `npm run db:migrate`.
2. Configure o R2 privado e os dados jurídicos.
3. Em **Administração → AFD**, informe o número de registro do REP-P no INPI.
4. Execute **Validar AFD** para o período.
5. Corrija erros legais ou de NSR na fonte; nunca edite o arquivo.
6. Execute **Gerar AFD**. O arquivo ficará privado com assinatura pendente.
7. Após a Sprint 32, assine com CAdES destacado e libere o download oficial.

Alertas críticos: `MISSING_NSR`, `DUPLICATE_NSR`, `AFD_RECONCILIATION_FAILED`, falha de geração e divergência de hash. A restauração exige banco e Object Storage; valide sempre o hash após recuperar o arquivo.
