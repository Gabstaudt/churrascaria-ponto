# ADR-008 — Leiautes históricos do AFD são imutáveis

Cada geração registra uma versão explícita. A implementação inicial usa `AFD_LAYOUT_004`; futuras versões serão adicionadas, não sobrescritas. Arquivos históricos continuam reproduzíveis com a regra vigente quando foram gerados.

O timestamp de geração pertence ao snapshot da tentativa. Reprocessar a mesma tentativa preserva seus dados; uma nova emissão possui novo ID, timestamp, chave e hash.
