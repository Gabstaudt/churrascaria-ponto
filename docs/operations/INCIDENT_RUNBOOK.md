# Suporte e resposta a incidentes

## Severidade

- **SEV-1:** indisponibilidade total, vazamento ou perda confirmada de dados;
- **SEV-2:** função crítica indisponível ou resultados inconsistentes;
- **SEV-3:** falha localizada com alternativa operacional;
- **SEV-4:** dúvida, melhoria ou defeito visual sem bloqueio.

## Resposta inicial

1. Registre horário, ambiente, usuário afetado e ação executada.
2. Preserve logs e auditoria; não apague registros para “corrigir”.
3. Verifique `/api/health/live` e `/api/health/ready`.
4. Confirme o último deploy, migration e estado do PostgreSQL/R2.
5. Classifique a severidade e comunique o responsável do negócio.
6. Em suspeita de acesso indevido, desative a conta e rotacione as credenciais
   atingidas sem reutilizá-las.
7. Em inconsistência de ponto, suspenda o fechamento da competência.

## Comunicação

Para SEV-1, mantenha atualizações a cada 30 minutos até contenção. Não inclua CPF,
documentos médicos, senhas, tokens ou URLs assinadas em mensagens de suporte.

## Encerramento

Registre causa, impacto, linha do tempo, correção, validação e ação preventiva.
Incidentes envolvendo dados pessoais devem ser encaminhados ao responsável LGPD
para avaliação das obrigações de notificação.
