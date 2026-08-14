# Sprint 18 — Relatórios Operacionais e Exportações

## Objetivo

Entregar informação gerencial reproduzível antes dos documentos legais, usando
uma única fonte de cálculo para tela, CSV e PDF.

## Entregas

- tela administrativa `/admin/relatorios`;
- filtros por data inicial, data final, funcionário e situação diária;
- período validado com limite máximo de 366 dias;
- resumo de horas previstas, trabalhadas, atrasos, adicionais, banco de horas,
  faltas e pendências;
- detalhamento diário com jornada, marcações efetivas e situação calculada;
- espelho gerencial claramente identificado como documento não oficial;
- exportação CSV compatível com planilhas e codificação UTF-8;
- proteção contra injeção de fórmulas nas células do CSV;
- exportação PDF paginada em formato paisagem;
- nomes de arquivos reproduzíveis com o período consultado;
- respostas privadas sem cache para os arquivos sensíveis;
- auditoria de cada exportação com formato, filtros, quantidade de linhas e
  totais;
- acesso restrito a administrador;
- layout isolado e responsivo, sem alterações nas jornadas existentes.

## Consistência dos resultados

A tela e as duas exportações chamam `generateOperationalReport`. Os filtros são
validados pelo mesmo schema e os totais são calculados uma única vez sobre as
linhas retornadas. Portanto, um CSV ou PDF obtido pelos botões da tela corresponde
ao resultado exibido para o mesmo período e filtros.

As datas são percorridas em UTC apenas como datas civis, enquanto horários de
marcação são formatados explicitamente em `America/Belem`. Isso evita mudança de
dia por timezone.

## Geração

A geração permanece síncrona nesta etapa. O relatório é produzido durante a
requisição e enviado diretamente na resposta, sem arquivo intermediário. O
volume atual e o limite de período não justificam infraestrutura de filas. Essa
decisão deve ser revista caso medições em produção indiquem necessidade.

## Segurança e auditoria

- página e rotas de exportação exigem `ADMIN` ativo;
- parâmetros manipulados são rejeitados pelo schema;
- respostas usam `Cache-Control: private, no-store`;
- cada download gera `EXPORT_OPERATIONAL_REPORT` em `audit_logs`;
- filtros e totais auditados permitem reproduzir o resultado;
- o PDF é identificado como espelho gerencial não oficial;
- nenhuma marcação ou resultado é alterado durante a consulta.

## Banco de dados

Esta sprint não exige migration. O registro das exportações reutiliza a auditoria
imutável existente.

## Validação

- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `git diff --check`;
- `npx next build --webpack`;
- testes de totalização, intervalo civil entre datas, timezone, segurança de CSV
  e estrutura do PDF.
