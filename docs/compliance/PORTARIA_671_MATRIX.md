# Matriz de conformidade — Portaria MTP nº 671/2021

Revisão técnica iniciada em 14/08/2026 a partir da versão compilada publicada pelo
Ministério do Trabalho e Emprego e das especificações oficiais do AEJ versão 002.

| Requisito | Fonte | Estado | Evidência/pendência |
|---|---|---|---|
| PTRP gera Espelho e AEJ | arts. 82 e 83 | Parcial | Relatórios internos existem; AEJ possui apenas núcleo serializador |
| Conteúdo mínimo do Espelho | art. 84 | Pendente de validação | Exige dados completos do empregador e revisão dos cálculos noturnos |
| AEJ ISO-8859-1, CRLF e pipe | leiaute AEJ 002 | Implementado no núcleo | Testes automatizados do serializador |
| Registros AEJ 01–08 e 99 | leiaute AEJ 002 | Implementado no núcleo | Validação estrutural; falta mapeamento integral do banco |
| Assinatura AEJ CAdES `.p7s` | FAQ MTE, questão 29 | Bloqueado | Certificado ICP-Brasil e solução de assinatura não fornecidos |
| Responsável pela assinatura | FAQ MTE, questão 34 | Bloqueado | Deve ser o desenvolvedor do PTRP |
| AFD fiscal gerado somente pelo REP | FAQ MTE, questão 38 | Fora do PTRP | Sistema não deve gerar AFD fiscal |
| Pares entrada/saída | FAQ MTE, questão 56 | Requer auditoria | Validar jornadas ímpares e tratamentos existentes |
| Horário contratual diário | FAQ MTE, questão 57 | Requer auditoria | Validar todas as jornadas e vigências |
| Pré-assinalação no AEJ e espelho | FAQ MTE, questão 54 | Requer decisão | Confirmar se a empresa adota pré-assinalação |
| Atestado Técnico e Termo | arts. 88–89 e Anexo VII | Bloqueado | Aceite jurídico/técnico e assinaturas dos responsáveis |

Nenhuma saída é rotulada como oficial até todos os itens aplicáveis estarem
validados, o certificado ser configurado e o especialista responsável aprovar os
arquivos-exemplo.
