# Configuração jurídica da instalação

Cada instalação atende um único empregador. Os valores sensíveis são fornecidos
por variáveis de ambiente ao comando `npm run legal:configure` e não devem ser
versionados. O comando exige o e-mail de um administrador, registra auditoria sem
CPF e sempre volta a bloquear exportações oficiais após qualquer alteração.

Variáveis obrigatórias:

```text
LEGAL_EMPLOYER_NAME
LEGAL_EMPLOYER_CNPJ
LEGAL_EMPLOYER_STREET
LEGAL_EMPLOYER_DISTRICT
LEGAL_EMPLOYER_POSTAL_CODE
LEGAL_EMPLOYER_CITY
LEGAL_EMPLOYER_STATE
LEGAL_EMPLOYER_REPRESENTATIVE
LEGAL_EMPLOYER_EMAIL
LEGAL_PTRP_NAME
LEGAL_PTRP_VERSION
LEGAL_DEVELOPER_CPF
LEGAL_DEVELOPER_NAME
LEGAL_DEVELOPER_EMAIL
LEGAL_CONFIGURED_BY_EMAIL
```

`LEGAL_EMPLOYER_CAEPF` e `LEGAL_EMPLOYER_CNO` são opcionais e devem ficar vazios
quando não existirem. Não use valores fictícios.

Depois de aplicar as migrations, carregue as variáveis somente no terminal e rode:

```bash
npm run legal:configure
```

O certificado, a chave privada e a senha do e-CPF não pertencem a essa tabela e
jamais devem ser fornecidos nesse comando.
