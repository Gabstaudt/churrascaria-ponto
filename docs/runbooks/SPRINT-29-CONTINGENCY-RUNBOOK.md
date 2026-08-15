# Runbook de contingência do terminal

## Quem pode agir

O funcionário pode repetir o fluxo e abrir uma solicitação quando a interface oferecer. Somente administrador autenticado pode autorizar. Bloqueios, eventos de segurança e operações em revisão exigem análise administrativa.

## Procedimentos

- Câmera indisponível: conferir permissão, fechar outros aplicativos, tentar novamente e, persistindo, abrir solicitação supervisionada.
- Provedor biométrico indisponível: verificar `docker compose ps biometrics` e `/health`; usar supervisão somente durante a indisponibilidade.
- GPS indisponível/baixa precisão: repetir ao ar livre ou conferir permissão. Fora do geofence não permite contingência automática.
- Internet caiu após autenticação: a operação fica no IndexedDB, sem selfie e sem NSR. Ao voltar, o terminal sincroniza em ordem com backoff.
- Terminal bloqueado: não tentar contornar. Investigar clonagem/credencial e gerar nova ativação.
- Liveness/foto/vídeo: não liberar contingência automática. Analisar o evento de segurança.

## Recuperação

Após internet voltar, confirmar pendências zeradas em Terminais e resultados em Contingências. Após reparar câmera/GPS/biometria, validar o fluxo normal antes de encerrar a ocorrência. Eventos `REQUIRES_REVIEW` não devem ser apagados; resolva por tratamento auditável.

O modo offline é limitado a oito horas pelo ticket assinado. Depois disso, o terminal deve encaminhar o funcionário ao responsável.
