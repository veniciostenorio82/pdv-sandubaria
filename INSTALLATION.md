# Guia de Instalação - PDV Sandubaria com Impressora Térmica

Este guia explica como instalar e configurar o sistema PDV com suporte a impressión térmica em uma máquina Linux Debian.

## Instalação recomendada no estabelecimento (launcher independente)

A máquina do caixa **não** precisa do repositório Git, de Node.js nem de `npm run dev`.

1. No computador de desenvolvimento, gere o pacote:

```bash
npm run build:launcher
```

2. Copie a pasta `release/` para o estabelecimento e execute:

```bash
./install.sh
```

3. Clique no atalho **PDV Sandubaria**.

O launcher inicia o Print Agent em `127.0.0.1:9100`, espera `/health` e abre a PWA:

`https://pdv-sandubaria.vercel.app`

Detalhes: `desktop-launcher/README.md`

O restante deste documento descreve o fluxo antigo de desenvolvimento (clonar o projeto e rodar os serviços com Node.js).

## 📋 Visão Geral da Arquitetura

```
Internet/Vercel (PDV Frontend)
           ↓
    localhost:3000 (Next.js)
           ↓
    localhost:9101 (Print Launcher)
           ↓
    localhost:9100 (Print Agent)
           ↓
    /dev/usb/lp0 (Impressora POS-58 USB)
```

### Componentes

- **PDV Frontend**: Next.js/React hospedado na Vercel (acessível via navegador)
- **Print Launcher**: Serviço Node.js que gerencia início/parada do Print Agent
- **Print Agent**: Serviço Node.js que envia dados ESC/POS à impressora

## 🔧 Pré-requisitos

- Sistema operacional: Linux Debian 10+
- Node.js v18+ com npm
- Impressora térmica POS-58 USB conectada
- Usuário com acesso a `/dev/usb/lp0` (geralmente requer sudo ou adição ao grupo dialout)

## 📦 Instalação Passo a Passo

### Passo 1: Preparar a Máquina

```bash
# Atualizar o sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Passo 2: Configurar Permissões da Impressora

A impressora POS-58 conectada via USB geralmente é alocada em `/dev/usb/lp0`.

```bash
# Verificar se a impressora está reconhecida
ls -l /dev/usb/lp0

# Adicionar usuário ao grupo dialout (para acesso ao device sem sudo)
sudo usermod -a -G dialout $USER

# Aplicar novas permissões de grupo
newgrp dialout

# Ou fazer logout e login novamente
```

**Nota**: Se o device não existir, verifique:
- Impressora conectada e ligada
- Porta USB funcional
- Driver do kernel detectou: `dmesg | grep -i usb`

### Passo 3: Clonar/Copiar o Projeto

```bash
# Se não tem o projeto ainda
cd ~/documentos/projects
git clone <url-do-repositorio> pdv
cd pdv

# Ou se já tem o projeto, apenas abra a pasta
cd ~/documentos/projects/pdv
```

### Passo 4: Instalar Dependências

```bash
# Dependências do frontend principal
npm install

# Dependências do Print Agent
cd print-agent
npm install
cd ..

# Dependências do Print Launcher
cd print-launcher
npm install
cd ..
```

### Passo 5: Configurar Variáveis de Ambiente

#### Print Agent (.env)

```bash
cd print-agent
cp .env.example .env
```

Editar o arquivo `.env` se necessário (geralmente os valores padrão funcionam):

```dotenv
PORT=9100
PRINTER_DEVICE=/dev/usb/lp0
PDV_ORIGIN=http://localhost:3000
```

#### Print Launcher (.env)

```bash
cd ../print-launcher
cp .env.example .env
```

Valores padrão geralmente funcionam:

```dotenv
LAUNCHER_PORT=9101
LAUNCHER_BIND=127.0.0.1
PRINT_AGENT_PORT=9100
PRINT_AGENT_HOST=127.0.0.1
PRINT_AGENT_PATH=../print-agent
CORS_ORIGIN=http://localhost:3000
```

### Passo 6: Compilar Projetos

```bash
# Compilar frontend
cd ../
npm run build

# Compilar Print Agent
cd print-agent
npm run build
cd ..

# Compilar Print Launcher
cd print-launcher
npm run build
cd ..
```

**Esperado**: Todos os builds devem completar sem erros.

### Passo 7: Configurar Inicialização Automática

Para que o Print Launcher e Print Agent iniciem automaticamente ao boot, crie scripts systemd:

#### Print Launcher Systemd Service

```bash
sudo nano /etc/systemd/system/pdv-launcher.service
```

Conteúdo:

```ini
[Unit]
Description=PDV Print Launcher
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/home/seu-usuario/documentos/projects/pdv/print-launcher
ExecStart=/usr/bin/node /home/seu-usuario/documentos/projects/pdv/print-launcher/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Ajustes necessários**:
- Substituir `seu-usuario` pelo usuário Linux que executará o serviço
- Substituir `/home/seu-usuario/documentos/projects/pdv` pelo caminho correto

Ativar o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pdv-launcher.service
sudo systemctl start pdv-launcher.service

# Verificar status
sudo systemctl status pdv-launcher.service
```

#### Print Agent será iniciado pelo Print Launcher

Quando o usuário clicar em "Conectar impressora" na interface do PDV, o Print Launcher automaticamente iniciará o Print Agent.

### Passo 8: Acessar o PDV

#### Versão Local (Dev/Testing)

```bash
cd /home/seu-usuario/documentos/projects/pdv

# Terminal 1: Iniciar frontend
npm run dev

# Terminal 2: Iniciar Launcher (opcional, se usar systemd não precisa)
cd print-launcher && npm run dev

# Acessar: http://localhost:3000
```

#### Versão em Produção

- O frontend estará disponível em `https://seu-dominio.vercel.app`
- Print Launcher e Print Agent rodam localmente via systemd
- Navegador acessa o PDV via URL pública
- PDV comunica com localhost:9101 (Print Launcher) por CORS

## 🖨️ Usando a Impressora

### Na Tela do PDV

1. **Abrir o PDV** → Observar widget de status da impressora no canto inferior direito
2. **Status Inicial**:
   - 🔴 **Desconectada** → Botão "Conectar"
   - 🟢 **Conectada** → Botão "Testar"

3. **Conectar Impressora**:
   - Clicar em "Conectar"
   - Sistema iniciará o Print Agent automaticamente
   - Aguardar conexão (2-5 segundos)
   - Status muda para 🟢 **Conectada**

4. **Testar Impressora**:
   - Clicar em "Testar"
   - Um recibo de teste será impresso
   - Confirma se a impressora está funcional

5. **Fazer um Pedido**:
   - Seguir fluxo normal do PDV
   - Ao finalizador, clicar "📋 Imprimir Pedido"
   - Sistema imprime automaticamente se liberdade estiver conectada
   - Se houver erro, opção "🔄 Tentar Novamente" disponível

## 🐛 Solução de Problemas

### Impressora não é detectada

```bash
# Verificar dispositivo
ls -l /dev/usb/lp0

# Se não existir, verificar logs do kernel
dmesg | tail -20

# Reconectar impressora USB e verificar novamente
```

### Erro de permissão ao acessar /dev/usb/lp0

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER

# Fazer logout e login novamente para aplicar
# Ou executar comando em novo shell
newgrp dialout
```

### Print Launcher não inicia

```bash
# Verificar logs systemd
sudo journalctl -u pdv-launcher.service -n 50

# Testar inicialização manual
cd /home/seu-usuario/documentos/projects/pdv/print-launcher
node dist/index.js

# Verificar se porta 9101 está disponível
sudo netstat -tuln | grep 9101
```

### Print Agent não inicia via Launcher

```bash
# Verificar path do project
ls -la print-agent/dist/index.js

# Testar inicialização manual do Print Agent
cd print-agent
npm run start

# Verificar se porta 9100 está disponível
sudo netstat -tuln | grep 9100
```

### Erro de CORS ao chamar Print Agent

Se receber erro como "Access-Control-Allow-Origin denied":

1. Verificar que Print Agent está repondendo:
   ```bash
   curl http://localhost:9100/health
   ```

2. Verificar que origem está na whitelist do Print Agent:
   - Editar `print-agent/.env` → `PDV_ORIGIN=http://localhost:3000`
   - Reiniciar Print Agent

### Print Agent responde mas impressora não funciona

```bash
# Testar acesso direto ao device
echo "TESTE" > /dev/usb/lp0

# Se funcionar, o device está ok
# Se não funcionar, problema na impressora ou driver
```

## 📝 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/app/page.tsx` | App principal do PDV |
| `src/services/printer.ts` | Cliente HTTP para comunicação com Print Agent |
| `src/components/PrinterStatusWidget.tsx` | Widget visual de status da impressora |
| `print-agent/src/index.ts` | Express API do Print Agent |
| `print-agent/src/printer.ts` | Formatter ESC/POS |
| `print-launcher/src/index.ts` | Launcher para iniciar Print Agent |

## 🔐 Considerações de Segurança

- ✅ Print Launcher e Print Agent NOT escutam na rede inteira, apenas localhost
- ✅ CORS é restrito a origem específica do PDV
- ✅ Launcher NOT aceita comandos abitrários, apenas inicia Print Agent pré-configurado
- ✅ Impressora deve estar conectada localmente (USB), não expostas na rede
- ❌ NÃO coloque Print Launcher/Agent na internet publica

## 📞 Suporte

Para problemas não cobertos neste guia:

1. Verificar logs:
   ```bash
   sudo journalctl -u pdv-launcher.service -n 100
   tail -f /var/log/syslog | grep -i pdv
   ```

2. Testar componentes isoladamente:
   ```bash
   # Health check do Launcher
   curl http://localhost:9101/launcher/health
   
   # Health check do Print Agent
   curl http://localhost:9100/health
   
   # Testar impressão (após Print Agent iniciado)
   curl -X POST http://localhost:9100/test-print
   ```

3. Documentação de componentes:
   - `print-agent/README.md` - Detalhes técnicos do Print Agent
   - `print-launcher/README.md` - Detalhes técnicos do Print Launcher

---

**Versão**: 1.0  
**Data**: Setembro 2026  
**Sistema**: PDV Sandubaria com Impressora POS-58
