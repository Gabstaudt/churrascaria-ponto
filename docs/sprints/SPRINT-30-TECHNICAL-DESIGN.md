# Sprint 30 — Comprovante Eletrônico de Registro

## Resultado

Cada marcação válida originada no REP-P possui um comprovante eletrônico próprio, versionado e imutavelmente vinculado à marcação por uma restrição única de banco. A geração ocorre somente depois do commit da marcação: indisponibilidade do PDF, assinatura ou storage nunca invalida o ponto.

## Arquitetura

- `point_receipts` mantém vínculo, NSR, snapshots históricos, estado operacional, hash SHA-256, chave privada e metadados de assinatura.
- `REP_P_RECEIPT_V1` identifica explicitamente a versão do formato.
- O renderer produz uma representação estruturada e o serviço PDF gera o documento no backend de forma determinística.
- O arquivo é salvo no bucket privado existente. Downloads usam URL assinada curta e somente são emitidos após conferir o hash do objeto.
- CPF aparece mascarado. Evidências biométricas, fotos, coordenadas e dados técnicos sensíveis não integram o documento.
- A assinatura PAdES possui contrato e campos próprios, mas permanece honestamente como `NOT_REQUIRED` até a consolidação prevista na Sprint 32.

## Canais

- Terminal: confirmação imediata, NSR e acesso ao PDF por token de dois minutos, vinculado ao coletor.
- Portal do funcionário: lista e download limitados ao `employeeId` da sessão.
- Administração: filtros, status, download íntegro e reprocessamento de falhas.
- Consulta pública: token opaco e apresentação mínima, sem identificação do funcionário.

## Estados e recuperação

`PENDING`, `FAILED`, `REQUIRES_ATTENTION` e `AVAILABLE` tornam a falha visível. O retry usa espera crescente e interrompe tentativas automáticas após cinco falhas. A conciliação encontra marcações REP-P sem comprovante e pode repará-las idempotentemente.

## Segurança

As rotas de funcionário repetem a autorização no servidor, impedindo IDOR. O terminal exige sessão do coletor, token assinado, vínculo com o coletor e expiração. O bucket não é público e o endpoint público não entrega o PDF nem dados pessoais.
