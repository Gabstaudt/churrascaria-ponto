# Inventário técnico de dados biométricos

| Dado | Finalidade | Armazenamento | Acesso | Retenção |
|---|---|---|---|---|
| Frame JPEG temporário | Enrollment ou autenticação | Somente memória da requisição | Provedor interno | Descartado após processamento |
| Template facial | Identificação 1:N | PostgreSQL cifrado com AES-256-GCM | Serviço biométrico do backend | Enquanto perfil estiver ativo; versão anterior é revogada |
| Perfil biométrico | Ciclo de vida e versões | PostgreSQL | Administração autorizada, sem template | Conforme política de vínculo e LGPD |
| Validação biométrica | Evidência da decisão | PostgreSQL, sem imagem | Auditoria e operação | Conforme política legal a definir na Sprint 33 |
| Métricas de duração/status | Diagnóstico | PostgreSQL agregado | Administração | Conforme política operacional |

Não são coletados gênero, idade estimada, emoção, etnia ou outros atributos físicos irrelevantes. O reconhecimento só é ativado após o início explícito de uma marcação; não há vigilância contínua. O registro de ciência do aviso não presume, isoladamente, a base legal do tratamento trabalhista.
