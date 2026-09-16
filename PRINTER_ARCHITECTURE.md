# Arquitetura de Impressão - PDV Sandubaria

Documentação técnica detalhada sobre como o sistema de impressão funciona.

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                      PDV Frontend (Next.js)                      │
│                    Hospedado: Vercel / Local                     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PrinterStatusWidget                                      │   │
│  │ ├─ Verifica /health a cada 5s                          │   │
│  │ ├─ Botão "Conectar impressora"                         │   │
│  │ ├─ Botão "Testar impressão"                            │   │
│  │ └─ Exibe status 🟢/🔴                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ FinalizeStep → onConfirmPrint()                         │   │
│  │ └─ Prepara OrderToPrint                                │   │
│  │    ├─ orderNumber                                       │   │
│  │    ├─ items[{ name, quantity, unitPrice }]             │   │
│  │    ├─ total                                             │   │
│  │    └─ paymentMethod                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PrintingModal                                            │   │
│  │ ├─ Chama printOrder(orderData)                          │   │
│  │ ├─ Mostra progresso: "📋 Imprimindo..."                │   │
│  │ ├─ Sucesso: "✅ Pedido impresso!"                       │   │
│  │ └─ Erro: "❌ Erro ao imprimir" + Retry                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/services/printer.ts                                 │   │
│  │ ├─ checkPrinterStatus()                                │   │
│  │ │  └─ GET http://localhost:9100/health                 │   │
│  │ ├─ connectPrinter()                                    │   │
│  │ │  └─ POST http://localhost:9101/launcher/start        │   │
│  │ ├─ printOrder(order)                                   │   │
│  │ │  └─ POST http://localhost:9100/print {JSON}         │   │
│  │ └─ testPrinter()                                       │   │
│  │    └─ POST http://localhost:9100/test-print           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           ↓ HTTP CORS
┌──────────────────────────────────────────────────────────────────┐
│              Localhost Network (127.0.0.1)                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Print Launcher (Node.js)                                   │ │
│  │ Port: 9101                                                 │ │
│  │                                                             │ │
│  │ Endpoints:                                                  │ │
│  │ ├─ GET /launcher/health                                  │ │
│  │ ├─ POST /launcher/start                                  │ │
│  │ │  └─ Spawn: npm run start (em print-agent/)             │ │
│  │ │  └─ Detached: true (process vive independentemente)    │ │
│  │ │  └─ Await: health check até 5s                         │ │
│  │ └─ POST /launcher/stop                                   │ │
│  │                                                             │ │
│  │ Responsabilidades:                                          │ │
│  │ ├─ Verificar se Print Agent já está rodando              │ │
│  │ ├─ Iniciar Print Agent como child_process detached       │ │
│  │ ├─ Capturar stdout/stderr do Print Agent                │ │
│  │ └─ Reportar sucesso/falha para frontend                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Print Agent (Node.js + Express)                           │ │
│  │ Port: 9100                                                 │ │
│  │                                                             │ │
│  │ Endpoints:                                                  │ │
│  │ ├─ GET /health                                           │ │
│  │ │  └─ Response: { "status": "ok" }                        │ │
│  │ ├─ POST /print                                           │ │
│  │ │  ├─ Recebe: OrderToPrint (JSON)                        │ │
│  │ │  ├─ Valida: payload (orderNumber, items, total, etc)  │ │
│  │ │  ├─ Verifica: device exists (/dev/usb/lp0)            │ │
│  │ │  ├─ Chama: printToDevice(payload, device)             │ │
│  │ │  └─ Response: { "status": "printed" }                 │ │
│  │ └─ POST /test-print                                      │ │
│  │    └─ Imprime recibo de teste                            │ │
│  │                                                             │ │
│  │ Responsabilidades:                                          │ │
│  │ ├─ Formatar dados do pedido em ESC/POS                   │ │
│  │ ├─ Escrever diretamente no device                        │ │
│  │ ├─ Gerenciar conexão com device                          │ │
│  │ └─ Tratar erros de I/O                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ printer.ts (formatter ESC/POS)                           │ │
│  │                                                             │ │
│  │ printToDevice(payload, devicePath) {                      │ │
│  │   ├─ Buffer[] lines = []                                 │ │
│  │   ├─ Adiciona ESC codes (inicialização)                  │ │
│  │   ├─ Centra e bold "SANDUBARIA"                          │ │
│  │   ├─ Adiciona número do pedido                           │ │
│  │   ├─ Loop items:                                          │ │
│  │   │  └─ Formata: "2x X-Tudo        R$ 46,00"           │ │
│  │   ├─ Adiciona total                                      │ │
│  │   ├─ Adiciona método de pagamento                        │ │
│  │   ├─ Feed (quebras de linha)                             │ │
│  │   └─ fs.write() → /dev/usb/lp0                           │ │
│  │ }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           ↓ I/O
┌──────────────────────────────────────────────────────────────────┐
│                 Hardware (Impressora POS-58)                      │
│                                                                   │
│  /dev/usb/lp0 ← Raw ESC/POS commands                            │
│                                                                   │
│  Thermal paper 58mm                                              │
│  Velocidade: ~50mm/s                                             │
│  Resolution: 203dpi                                              │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Impressão Completo

### 1. Inicialização (App Carregado)

```
Home Component Mounts
  ↓
useEffect(() => {
  1. PrinterStatusWidget renderiza
  2. Começa verificação de health a cada 5s
})
```

### 2. Usuário Faz Pedido

```
CategoryStep 
  → ProductListStep 
  → CartStep 
  → PaymentStep 
  → FinalizeStep

Na FinalizeStep:
  ├─ Exibe resumo do pedido
  └─ Botão "📋 Imprimir Pedido" → onConfirmPrint()
```

### 3. onConfirmPrint() Executado

```typescript
const handleConfirmPrint = useCallback(() => {
  const paymentMethod = payments[0]?.method || 'dinheiro';
  
  const orderData: OrderToPrint = {
    orderNumber,           // ex: "1234"
    items: [
      { name: "X-TUDO", quantity: 2, unitPrice: 23.00 },
      { name: "REFRIGERANTE", quantity: 1, unitPrice: 6.00 }
    ],
    total: 52.00,          // roundedTotal
    paymentMethod: "pix"   // ou dinheiro, cartao-credito, etc
  };
  
  setPrintingOrderData(orderData);
  setPrintingModalOpen(true);
  setPrintingAutoCompleteKey((prev) => prev + 1);
}, [orderNumber, items, roundedTotal, payments]);
```

### 4. PrintingModal Abre (Stage: "printing")

```
Modal abre
  ↓
useEffect dispara:
  ├─ Delay 500ms
  └─ Executa printOrder(orderData)

printOrder() {
  ├─ Faz POST http://localhost:9100/print
  ├─ Payload JSON:
  │  {
  │    "orderNumber": "1234",
  │    "items": [{ "name": "X-TUDO", "quantity": 2, "unitPrice": 23 }],
  │    "total": 52,
  │    "paymentMethod": "pix"
  │  }
  ├─ Timeout: 5s
  └─ Retorna: { success: true/false, error?: PrintError }
}
```

### 5. Print Agent (POST /print)

```
Recebe JSON
  ├─ Valida isValidPayload()
  ├─ Verifica fs.existsSync('/dev/usb/lp0')
  ├─ Chama printToDevice(payload, '/dev/usb/lp0')
  │
  └─ printToDevice():
      ├─ Cria ESC/POS Buffer
      ├─ fs.open('/dev/usb/lp0', 'w')
      ├─ fs.write(fd, buffer)
      ├─ fs.close(fd)
      └─ Resolve Promise
  
  Retorna: { "status": "printed" } (200 OK)
  ou { "error": "..." } (500 Error)
```

### 6. Imperssora Processa ESC/POS

```
Buffer ESC/POS:
  ├─ ESC @ (reset)
  ├─ ESC a 1 (center) + ESC E 1 (bold on)
  ├─ "SANDUBARIA\n"
  ├─ ESC E 0 (bold off) + ESC a 0 (left align)
  ├─ "------------------------------\n"
  ├─ "PEDIDO #1234\n\n"
  ├─ "2x X-TUDO              R$ 46,00\n"
  ├─ "1x REFRIGERANTE         R$ 6,00\n"
  ├─ "------------------------------\n"
  ├─ "TOTAL                  R$ 52,00\n"
  ├─ "PAGAMENTO: PIX\n"
  └─ (3x quebra de linha + feed)

→ Impressora térmica processa
→ Papel sai da máquina
```

### 7. PrintingModal Recebe Resposta

```
Sucesso (success: true):
  ├─ setStage('success')
  ├─ Modal exibe: "✅ Pedido impresso!"
  └─ Botão: "✓ OK — Voltar para a tela inicial"

Erro (success: false):
  ├─ setErrorMessage(error.message)
  ├─ setStage('error')
  ├─ Modal exibe: "❌ Erro ao imprimir"
  ├─ Mostra: erro específico
  ├─ Botão: "🔄 Tentar novamente"
  └─ Botão: "✕ Cancelar e voltar"
```

### 8. Usuário Confirma

```
Botão OK/Cancelar
  ↓
onDone() é chamado:
  ├─ setPrintingModalOpen(false)
  ├─ setPrintingOrderData(undefined)
  ├─ resetAll() → limpa pedido
  ├─ setStep('inicial')
  └─ Volta à tela inicial, pronto para novo pedido
```

## 🔌 Endpoints HTTP

### Frontend → Print Launcher

**Conectar Impressora**
```
POST http://localhost:9101/launcher/start
Response: { status: "success" | "error", message: string }

Endpoint inicia Print Agent como child_process.
Detached = true permite que Print Agent continue rodando
mesmo se Launcher for encerrado.
```

### Frontend ↔ Print Agent

**Verificar Status**
```
GET http://localhost:9100/health
Response: { status: "ok" }
Timeout: 3s
```

**Imprimir Pedido**
```
POST http://localhost:9100/print
Body: {
  orderNumber: string | number,
  items: [{ name: string, quantity: number, unitPrice: number }],
  total: number,
  paymentMethod: string
}
Response: { status: "printed" } | { error: string }
Timeout: 5s
```

**Testar Impressora**
```
POST http://localhost:9100/test-print
Response: { status: "printed" } | { error: string }
Timeout: 5s

Imprime recibo simples de teste para validar functionality
```

## 🔐 CORS Configuration

### Print Agent

```typescript
const allowed = [
  PDV_ORIGIN,                  // http://localhost:3000 (default)
  'http://localhost:3000',     // Dev local
  'http://localhost:5173',     // Vite dev
  'http://localhost:3001'      // Alt port
];

if (origin && allowed.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

### Print Launcher

Mesma configuração CORS que Print Agent.

**Nota**: Em produção, substituir origins por domínio Vercel real.

## 📝 Formato Dados OrderToPrint

```typescript
interface OrderToPrint {
  orderNumber: string | number;        // Ex: "1234" or 1234
  items: Array<{
    name: string;                       // Ex: "X-TUDO"
    quantity: number;                   // Ex: 2
    unitPrice: number;                  // Ex: 23.00
  }>;
  total: number;                        // Ex: 52.00
  paymentMethod: string;                // Ex: "pix", "dinheiro", "cartao-credito"
}
```

Compatibility:
- ✅ Frontend OrderItem[] → OrderToPrint converte automaticamente
- ✅ Print Agent valida cada campo
- ✅ Printer.ts recebe e formata

## 🧪 Fluxo de Teste

### Teste Manual da Impressora

```bash
# 1. Verificar device
ls -l /dev/usb/lp0

# 2. Testar escrita direta
echo "TESTE" | sudo tee /dev/usb/lp0

# 3. Se funcionar, device está ok
```

### Teste Do Print Agent

```bash
# 1. Iniciar Print Agent
cd print-agent
npm run start

# 2. Testar health
curl http://localhost:9100/health

# 3. Testar impressão simulada
curl -X POST http://localhost:9100/test-print \
  -H "Content-Type: application/json"

# 4. Testar impressão real
curl -X POST http://localhost:9100/print \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 1234,
    "items": [{"name": "TESTE", "quantity": 1, "unitPrice": 10}],
    "total": 10,
    "paymentMethod": "dinheiro"
  }'
```

### Teste Do Print Launcher

```bash
# Terminal 1: Iniciar Launcher
cd print-launcher
npm run start

# Terminal 2: Testar health
curl http://localhost:9101/launcher/health

# Terminal 2: Testar start
curl -X POST http://localhost:9101/launcher/start

# Verificar se Print Agent iniciou
curl http://localhost:9100/health
```

### Teste Por UI

1. Abrir PDV em `http://localhost:3000`
2. Observar widget de status no canto inferior direito
3. Clicar "Conectar impressora"
4. Aguardar 2-5 segundos
5. Status deve mudar para 🟢 Conectada
6. Clicar "Testar" para teste de impressão
7. Fazer pedido completo e clicar "Imprimir Pedido"

## 🚨 Error Handling

### Frontend (PrintingModal)

```typescript
type PrintingStage = 'printing' | 'success' | 'error';

if (stage === 'error') {
  // Mostra mensagem de erro específica
  // Botão retry chama handleRetry()
  // Botão cancel volta sem imprimir
}
```

### Backend (Print Agent)

```typescript
try {
  await printToDevice(payload, PRINTER_DEVICE);
  res.status(200).json({ status: 'printed' });
} catch (err) {
  console.error('Erro ao imprimir:', err);
  res.status(500).json({ error: 'Erro ao processar impressão' });
}
```

Erros comuns:
- ENOENT: Device não existe
- EACCES: Permissão negada
- EBUSY: Device ocupado
- ETIMEDOUT: Timeout na escrita

## 🔧 Debugging

### Logs do Print Agent

```bash
# Real-time logs
tail -f /var/log/pdv-print-agent.log

# Ou via journalctl (se systemd)
sudo journalctl -u pdv-print-agent -f

# Via console.log
[Print Agent] Recebido pedido para impressão: 1234
[Print Agent] Impressão enviada com sucesso
```

### Logs do Print Launcher

```bash
sudo journalctl -u pdv-launcher -f

# Ou console output se rodando manualmente
[Launcher] Iniciando Print Agent em: .../print-agent
[Print Agent] Print Agent iniciado na porta 9100
[Launcher] Print Agent iniciado com sucesso
```

### Network Debug

```bash
# Ver requisições HTTP
sudo tcpdump -i lo -A 'tcp port 9100 or tcp port 9101'

# Ver portas em uso
sudo netstat -tuln | grep -E '9100|9101'

# Testar DNS/connectivity
curl -v http://localhost:9100/health
curl -v http://localhost:9101/launcher/health
```

## 📊 Performance

- Verificação de health: ~100-300ms (CORS + network)
- Inicialização Print Agent: ~2-5s (spawn + health check)
- Envio de pedido para impressora: ~500ms-2s (I/O USB)
- Tempo total (usuário pressiona botão até "Pedido impresso!"): ~3-8s

## 🔄 Fluxo de Recuperação de Erros

```
Erro ao imprimir
  ├─ Modal mostra "❌ Erro"
  ├─ Usuário pode:
  │  ├─ "🔄 Tentar novamente" (retry printOrder)
  │  └─ "✕ Cancelar" (volta sem imprimir)
  │
  └─ Se retry falhar:
     ├─ Modal continua em estado error
     ├─ Usuário pode tentar novamente
     └─ Ou voltar sem imprimir (salvar pedido no histórico?)
```

## 🌐 Deployment em Produção

### Vercel (Frontend)

```bash
git push origin main
↓
Vercel Auto-deploy
↓
Frontend disponível em https://seu-dominio.vercel.app

# Configurar env vars em Vercel
NEXT_PUBLIC_PRINT_AGENT_URL=http://localhost:9100 (default)
```

**Nota**: URLs de localhost funcionam porque:
- Frontend Vercel em navegador do cliente
- Navegador rodando na máquina local
- localhost resolve para 127.0.0.1 local

### Linux Local (Print Agent + Launcher)

```bash
# Compilar
npm run build (print-agent/)
npm run build (print-launcher/)

# Instalar systemd services
sudo cp systemd/pdv-launcher.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pdv-launcher
sudo systemctl start pdv-launcher

# Verificar
sudo systemctl status pdv-launcher
curl http://localhost:9101/launcher/health
```

## 📚 Referências

- ESC/POS Reference: https://www.epson.com/cgi-bin/Store/pl/C13S020289.pdf
- USB Device Access Linux: https://www.kernel.org/doc/html/latest/driver-api/usb/urb.html
- Node.js child_process: https://nodejs.org/api/child_process.html
- Express CORS: https://expressjs.com/en/resources/middleware/cors.html

---

**Versão**: 1.0  
**Data**: Setembro 2026  
**Autor**: PDV Sandubaria Dev
