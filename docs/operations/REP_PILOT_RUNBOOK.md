# Runbook do piloto REP-C

## Pré-requisitos

- fabricante, modelo, firmware e documentação oficial registrados;
- adapter real homologado sem presumir o formato AFD;
- relógio e computador do Ponto Sync na rede local;
- dispositivo provisionado com credencial exclusiva;
- responsável administrativo e suporte definidos;
- processo atual mantido em paralelo durante todo o piloto.

## Entrada no piloto

1. Registrar data, relógio, serial, firmware e responsáveis.
2. Fazer backup da configuração e preservar a exportação original da fonte.
3. Rodar `ponto-sync:diagnose` antes de iniciar o serviço.
4. Fazer marcações controladas e conferir matrícula, horário e NSR ponta a ponta.
5. Não substituir o processo vigente antes do aceite formal.

## Monitoramento

Agendar `npm run rep:monitor` a cada cinco minutos. O limite padrão considera a
sincronização parada após 30 minutos e pode ser definido com
`REP_STALLED_MINUTES`. Administradores recebem notificação somente na transição
do estado normal para alerta.

## Conciliação

Obter uma exportação pelo adapter oficial e convertê-la ao contrato normalizado
versionado. Nunca editar o arquivo original. Configure as variáveis descritas no
script e execute `npm run rep:reconcile`. O resultado persiste totais e listas de
NSRs ausentes, alterados ou extras. Lacunas não são inferidas pela numeração:
somente a comparação com a fonte pode comprová-las.

## Incidentes

- `SYNC_STOPPED`: verificar energia, rede, serviço e fila local; não apagar estado.
- `DEVICE_FAILURE`: preservar logs, conferir credencial e resposta da API.
- `NSR_GAP`: suspender o aceite, preservar exportações e reprocessar o lote.
- divergência de conteúdo: não corrigir o registro importado manualmente; escalar
  com evidências ao responsável pelo adapter.

## Recuperação

Reiniciar o serviço somente após copiar o diagnóstico. Em problema de release,
usar o rollback da Sprint 21; a fila fica fora da release. Nunca apagar o arquivo
de estado para “destravar” a sincronização.

## Critério de aceite

O piloto só fecha após o período acordado com zero registros perdidos, alterados
ou duplicados, conciliação persistida e assinatura dos responsáveis operacional,
técnico e administrativo. A implementação de código não substitui o aceite real.
