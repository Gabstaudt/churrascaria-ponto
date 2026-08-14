# Checklist de homologação e entrada em operação

## Infraestrutura

- [ ] homologação e produção estão em projetos separados;
- [ ] PostgreSQL 17 possui backup automático;
- [ ] restauração foi ensaiada em banco isolado;
- [ ] domínio definitivo responde com TLS válido;
- [ ] `/api/health/live` e `/api/health/ready` respondem corretamente;
- [ ] secrets e credenciais são exclusivos por ambiente;
- [ ] bucket R2 é privado, versionado e sem acesso público.

## Segurança e LGPD

- [ ] não existem secrets versionados ou variáveis `NEXT_PUBLIC_` sensíveis;
- [ ] administrador, gestor e funcionário foram testados separadamente;
- [ ] funcionário não acessa outro cadastro por URL ou payload;
- [ ] gestor não acessa equipe fora do escopo nem rotas administrativas;
- [ ] downloads e exportações respeitam autorização e rate limit;
- [ ] cookies seguros, HSTS, CSP e demais headers foram conferidos em produção;
- [ ] política de retenção e descarte possui responsável definido;
- [ ] procedimento de atendimento ao titular e incidentes foi aprovado;
- [ ] dados reais não são utilizados em homologação sem anonimização.

## Acessibilidade

- [ ] jornadas principais funcionam apenas com teclado;
- [ ] foco é visível e segue ordem lógica;
- [ ] formulários possuem labels, mensagens e indicação de obrigatoriedade;
- [ ] contraste foi conferido em estados normal, erro, alerta e sucesso;
- [ ] zoom de 200% não perde ações ou conteúdo;
- [ ] celular de 320 px não apresenta rolagem horizontal indevida;
- [ ] leitor de tela anuncia títulos, navegação e erros relevantes.

## Performance

- [ ] páginas principais foram medidas em celular e desktop;
- [ ] relatórios de grande período respeitam o limite configurado;
- [ ] banco não apresenta conexões esgotadas ou consultas anormais;
- [ ] build e imagem Docker foram validados a partir de checkout limpo;
- [ ] logs não contêm documentos, CPF, senhas, tokens ou URLs assinadas.

## Validação do negócio

- [ ] cadastro, edição, desligamento e consulta de funcionário aprovados;
- [ ] jornada, escala, folga, troca, férias e afastamento aprovados;
- [ ] marcação, tratamento, falta e atestado aprovados;
- [ ] banco de horas e fechamento mensal conferidos por amostra manual;
- [ ] portais de funcionário e gestor aprovados pelos respectivos usuários;
- [ ] relatório da tela coincide com CSV/PDF para a mesma amostra;
- [ ] responsáveis assinaram o aceite de homologação.
