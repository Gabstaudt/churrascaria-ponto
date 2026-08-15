# Imutabilidade das marcações REP-P

`time_entries` contém fatos originais. Não existe operação administrativa para
atualizar ou excluir uma marcação. Correções referenciam o original por meio de
`time_adjustments`, preservando horário, NSR, registrador e coletor. O teste de
arquitetura falha caso serviços, ações ou endpoints introduzam `update` ou `delete`
de `timeEntries`.
