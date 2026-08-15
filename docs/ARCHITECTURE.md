# Arquitetura do UpTime

O UpTime é instalado individualmente para um empregador. A aplicação Next.js
concentra autenticação, jornadas administrativas, portal e API; PostgreSQL mantém
dados transacionais, auditoria e idempotência. Documentos privados usam object
storage. O REP-C permanece na rede local e o Ponto Sync transporta lotes duráveis
para `/api/rep/sync` usando credencial própria por dispositivo.

Marcações originais são imutáveis. Tratamentos, justificativas, banco de horas e
fechamentos são registros separados e auditáveis. A camada de conformidade gera o
AEJ a partir dos dados tratados, mas a emissão oficial permanece bloqueada sem
configuração jurídica revisada e assinatura CAdES. O AFD fiscal é responsabilidade
do REP, não do PTRP.

O deploy web e o agente local possuem ciclos independentes. Backups do banco,
arquivos originais do REP, fila do Ponto Sync e chaves de assinatura têm políticas
separadas para que uma atualização não elimine evidências ou marcações pendentes.
