# Revisão final de segurança

- [ ] segredos de produção distintos, rotacionados e fora do repositório;
- [ ] TLS e domínio válidos, cookies seguros e origem da autenticação restrita;
- [ ] administrador nominal, sem contas compartilhadas ou acessos inativos;
- [ ] escopo de gerente validado e funcionário limitado aos próprios dados;
- [ ] ações administrativas críticas presentes na auditoria;
- [ ] documentos privados no object storage e URLs com expiração;
- [ ] credenciais REP individuais, revogáveis e sem sessão de usuário;
- [ ] certificado ICP-Brasil e chave privada fora do banco/aplicação;
- [ ] rate limits e limites de upload ativos;
- [ ] logs sem senha, token, CPF, atestado ou conteúdo de marcação;
- [ ] backup cifrado, retenção definida e restauração ensaiada;
- [ ] contato e procedimento de incidente/LGPD aprovados;
- [ ] dependências e imagem de produção revisadas;
- [ ] gate `release:check` aprovado com evidências anexadas.

O checklist deve ter responsável e evidência. Marcar um item sem validação não
constitui aceite.
