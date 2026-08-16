# Sprint 31 — desenho técnico do AFD REP-P

## Referência normativa

- Leiaute oficial **Arquivo Fonte de Dados — AFD**, versão `004`, publicado pelo Ministério do Trabalho e Emprego: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/fiscalizacao-do-trabalho/leiaute-do-arquivo-fonte-de-dados-afd.pdf
- Portaria MTP nº 671/2021, compilação consultada em 16/08/2026: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/legislacao/portarias-1/portarias-vigentes-3/PDFPortarian671de8denovembrode2021compilada08.07.2025.pdf
- Perguntas e Respostas oficiais sobre CAdES destacado e NSR por estabelecimento: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/fiscalizacao-do-trabalho/Perguntas%20e%20Respostas%20REP

## Formato implementado

- texto ISO-8859-1 e CRLF explícito;
- cabeçalho tipo 1 com CRC-16/KERMIT;
- marcação REP-P tipo 7 com SHA-256 encadeado;
- trailer tipo 9 com contagens por tipo;
- linha de 100 posições `ASSINATURA_DIGITAL_EM_ARQUIVO_P7S`;
- nome `AFD{registroINPI}{CNPJouCPF}REP_P.txt`;
- CAdES destacado preparado para a Sprint 32.

Somente registros com fonte REP-P e ownership do registrador/estabelecimento entram no arquivo. O sistema não inventa tipos 2, 4, 5 ou 6 sem que exista uma fonte originária com NSR apropriado. A arquitetura aceita novas fontes oficiais quando esses eventos forem persistidos pelo ARP.

## Integridade e operação

Antes do upload são verificados documentos legais, estado do registrador, ordenação, continuidade e unicidade de NSR, estrutura, comprimentos, contagens e cadeia SHA-256. Depois do upload privado, o arquivo é baixado, revalidado e comparado pelo SHA-256.

Gerações são independentes e nunca sobrescritas. Falhas ficam registradas e a retentativa cria uma nova geração. O download oficial permanece bloqueado até `signatureStatus = SIGNED`, que será consolidado na Sprint 32.

## Retenção, backup e restauração

AFDs e `.p7s` não participam de limpeza genérica. O plano de backup deve preservar PostgreSQL e o prefixo privado `afd/` do Object Storage. Em teste de restauração, recupere ambos, baixe uma amostra, recalcule SHA-256 e compare com `afd_generations.file_hash`.
