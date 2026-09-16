# Launcher Linux — PDV Sandubaria

Pacote independente para a máquina do estabelecimento.

O clique em **PDV Sandubaria** inicia o Print Agent local, espera `http://127.0.0.1:9100/health` e abre a PWA:

`https://pdv-sandubaria.vercel.app`

A máquina final **não** precisa do repositório Git, de `npm run dev` nem do `node_modules` do PDV. O runtime do Node.js vai dentro do pacote.

## Gerar a distribuição

Na raiz do projeto:

```bash
npm run build:launcher
```

Saída: `release/`

```
release/
├── pdv-sandubaria
├── install.sh
├── pdv.env
├── README.txt
├── lib/
│   ├── node
│   ├── launcher.js
│   └── print-agent.js
└── share/
    ├── applications/pdv-sandubaria.desktop.in
    └── icons/pdv-sandubaria.png
```

## Instalar nesta máquina (teste)

```bash
npm run install:launcher
```

Padrão: `~/.local/opt/pdv-sandubaria`

Atalhos:

- `~/.local/share/applications/pdv-sandubaria.desktop`
- `~/Desktop` ou `~/Área de Trabalho`, se existirem

## Instalar na máquina do estabelecimento

Copie a pasta `release/` (pendrive, scp, etc.) e execute:

```bash
./install.sh
```

Depois, clique em **PDV Sandubaria**.

## Teste completo da distribuição independente

```bash
npm run test:launcher
```

O teste copia `release/` para `/tmp/pdv-pendrive`, instala em `/tmp/pdv-caixa` e valida health, ausência de processo duplicado e impressão de teste.

## Desenvolvimento

`npm run dev` do PDV e `npm run dev` / `npx tsx src/index.ts` do Print Agent continuam iguais. Este launcher é só a camada de distribuição.
