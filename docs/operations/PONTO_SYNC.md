# Ponto Sync

O Ponto Sync é o agente executado na rede local. Ele consulta o REP de forma
incremental, mantém uma fila durável e envia os registros à API sem usar a sessão
de qualquer usuário.

## Estado da integração

O transporte, a recuperação e o contrato `PONTO_SYNC_V1` estão implementados. O
adapter `FIXTURE` existe apenas para homologação. O adapter físico permanece
bloqueado até o recebimento de fabricante, modelo, SDK/protocolo e documentação
oficial. Nenhum formato AFD foi presumido.

## Provisionamento

Cadastre o dispositivo usando `REP_DEVICE_ADAPTER=PONTO_SYNC_V1` e guarde o token
mostrado uma única vez. Copie `.env.ponto-sync.example` para um arquivo fora do
repositório, preencha os valores e aplique permissão `0600`.

## Garantias de recuperação

- o lote é persistido antes do primeiro envio;
- escrita por arquivo temporário e rename evita estado parcialmente gravado;
- request ID permanece igual nas tentativas causadas por falha de transporte;
- respostas parciais preservam o lote e usam novo request ID para permitir o
  reprocessamento após a correção da causa;
- o último NSR só avança após resposta `PROCESSED` sem rejeições;
- falhas usam backoff exponencial com jitter, limitado a cinco minutos;
- ao reiniciar, o lote pendente é enviado antes de nova leitura do REP.

## Diagnóstico

Com as variáveis carregadas no ambiente:

```bash
npm run ponto-sync:diagnose
```

O resultado informa conectividade, tamanho da fila e último NSR, sem exibir token,
matrícula ou marcações.

## Serviço Linux

O template está em `deploy/ponto-sync/ponto-sync.service`. Em uma máquina Linux,
crie previamente o usuário de sistema `ponto-sync`, instale dependências da release
e execute o instalador com o caminho absoluto da release. Depois configure
`/etc/churrascaria-ponto/ponto-sync.env` com permissão `0600` e habilite o serviço.

## Atualização e rollback

Cada instalação cria uma release imutável sob `/opt/churrascaria-ponto/releases` e
troca apenas o link `current`. Para retornar:

```bash
sudo bash scripts/rollback-ponto-sync.sh NOME_DA_RELEASE
```

O estado durável fica fora da release em `/var/lib/churrascaria-ponto`, portanto
não é removido durante atualização ou rollback.
