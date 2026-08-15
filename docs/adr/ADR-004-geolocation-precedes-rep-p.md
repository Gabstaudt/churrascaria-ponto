# ADR-004 — Geolocalização precede a marcação REP-P

## Decisão

A geolocalização é uma validação prévia e independente. Ela não cria, altera nem substitui uma marcação REP-P. O servidor vincula coletor, estabelecimento e política, recalcula distância pela fórmula de Haversine e só então permite a geração de NSR.

O navegador envia somente evidência capturada pela API do dispositivo (`latitude`, `longitude`, `accuracy` e `timestamp`). Resultados como `insideGeofence` e identificadores de estabelecimento enviados pelo cliente não são aceitos.

## Privacidade

A posição é solicitada apenas quando o usuário inicia uma marcação. Não existe captura em background ou rastreamento contínuo. A evidência é mantida para rastreabilidade da decisão e contém apenas os sinais necessários.

## Falhas

Permissão negada, GPS indisponível, timeout, baixa precisão, leitura expirada, posição externa e posição suspeita são resultados diferentes. Nenhum deles cria ausência ou marcação falsa.

## Extensibilidade

`LocationEvidence` aceita indicadores de risco e poderá receber evidências complementares, como attestation do dispositivo. Wi-Fi não é usado como prova exclusiva porque browsers não oferecem SSID/BSSID de modo confiável.
