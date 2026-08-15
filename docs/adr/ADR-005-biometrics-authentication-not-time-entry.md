# ADR-005 — Biometria autentica, mas não representa uma marcação

## Decisão

A biometria é uma validação curta vinculada a uma tentativa, ao coletor e à localização. Somente o serviço REP-P cria o evento oficial, o NSR e o horário. Uma falha de rosto ou liveness encerra a tentativa sem produzir `timeEntry`.

O provedor é substituível. A primeira implementação é local, usando detecção YuNet, templates SFace e anti-spoofing passivo. Essa alternativa elimina cobrança por batida, mas oferece proteção básica e precisa de homologação contra fotos, telas e vídeos no equipamento definitivo.

O limiar de similaridade e a distância mínima entre primeiro e segundo candidatos são configurações do ambiente. Valores definitivos devem ser calibrados com o modelo e os usuários reais; não existe percentual universal.

## Segurança

- Templates são cifrados com AES-256-GCM e chave externa ao banco e ao Git.
- O serviço Python só é acessível pela aplicação usando token interno.
- Selfies e frames existem apenas em memória durante a requisição.
- A aprovação expira em 30 segundos e é consumida uma única vez.
- O navegador não escolhe funcionário, score, resultado de liveness ou estabelecimento.
- Templates, imagens, embeddings, scores e segredos são removidos de auditoria.

## Limites

Anti-spoofing por câmera RGB não é infalível. Não há promessa de impedir todo deepfake ou ataque de injeção. A Sprint 29 fornecerá contingência e controles antifraude adicionais.
