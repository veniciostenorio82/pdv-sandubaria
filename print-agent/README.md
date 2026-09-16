# Print Agent

Small local Print Agent for the PDV application. Runs on the same PC as the PWA
and sends ESC/POS data directly to a local POS-58 thermal printer device.

Purpose: allow the React PWA to POST structured orders to `http://localhost:9100/print`.

Quick start

1. Install dependencies:

```bash
cd print-agent
npm install
```

2. Copy `.env.example` to `.env` and adjust `PRINTER_DEVICE` and `PDV_ORIGIN` if needed.

3. Development:

```bash
npx tsx src/index.ts
```

4. Build and run:

```bash
npm run build
npm start
```

Endpoints

- `GET /health` — returns `{ "status": "ok" }`.
- `POST /print` — accepts JSON order payload and prints it.
- The agent binds to `127.0.0.1` by default (`HOST`). Do not expose it on the LAN.

Example payload:

```json
{
  "orderNumber": 42,
  "items": [
    { "name": "X-Tudo", "quantity": 2, "unitPrice": 18, "observations": "Sem cebola" },
    { "name": "Coca-Cola", "quantity": 1, "unitPrice": 6 }
  ],
  "total": 42,
  "paymentMethod": "PIX + Dinheiro",
  "payments": [
    { "method": "PIX", "amount": 20 },
    { "method": "Dinheiro", "amount": 22, "cashReceived": 30, "change": 8 }
  ]
}
```

Notes

- The agent writes directly to the device path configured in `PRINTER_DEVICE` (default `/dev/usb/lp0`).
- The agent intentionally does not alter CUPS configuration.
- Do not expose this agent to public networks; it should run only locally.
