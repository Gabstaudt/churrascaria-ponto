# Sprint 28 — homologação biométrica presencial

Usar somente participantes informados e imagens não versionadas. Registrar resultado, latência e flag — nunca anexar frames, vídeos ou templates ao repositório.

## Cenários obrigatórios

- Três ou mais funcionários distintos: match correto, no match e ambiguidade.
- Foto impressa, foto em celular/tablet, vídeo em celular/tablet.
- Luz normal, pouca luz, contraluz, lateral e intensa.
- Óculos, boné quando aplicável, barba, cabelo e máscara.
- Zero, um e múltiplos rostos.
- Sequência rápida de funcionários para confirmar limpeza da sessão.
- Perfil ativo, revogado, funcionário inativo, timeout e provedor indisponível.

Os thresholds `BIOMETRIC_MIN_SIMILARITY` e `BIOMETRIC_MIN_SCORE_GAP` só devem ser promovidos para produção após essa calibração. Resultados reais permanecem pendentes até execução no tablet e local definitivos.
