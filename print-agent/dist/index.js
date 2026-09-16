import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { printToDevice } from './printer.js';
dotenv.config();
const PORT = process.env.PORT ? Number(process.env.PORT) : 9100;
const HOST = process.env.HOST || '127.0.0.1';
const PRINTER_DEVICE = process.env.PRINTER_DEVICE || '/dev/usb/lp0';
const extraOrigins = (process.env.PDV_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = [
    ...extraOrigins,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
];
const app = express();
app.use(express.json({ limit: '200kb' }));
// CORS restricted to the PDV origin and localhost during development
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
function isValidPayload(body) {
    if (!body)
        return false;
    if (typeof body.orderNumber !== 'number' && typeof body.orderNumber !== 'string')
        return false;
    if (!Array.isArray(body.items) || body.items.length === 0)
        return false;
    for (const it of body.items) {
        if (typeof it.name !== 'string' || typeof it.quantity !== 'number' || typeof it.unitPrice !== 'number')
            return false;
        if (it.observations != null && typeof it.observations !== 'string')
            return false;
    }
    if (typeof body.total !== 'number')
        return false;
    const hasPaymentMethod = typeof body.paymentMethod === 'string' && body.paymentMethod.length > 0;
    const hasPayments = Array.isArray(body.payments) && body.payments.length > 0;
    if (!hasPaymentMethod && !hasPayments)
        return false;
    if (hasPayments) {
        for (const payment of body.payments) {
            if (typeof payment.method !== 'string' || typeof payment.amount !== 'number')
                return false;
            if (payment.cashReceived != null && typeof payment.cashReceived !== 'number')
                return false;
            if (payment.change != null && typeof payment.change !== 'number')
                return false;
        }
    }
    return true;
}
app.post('/print', async (req, res) => {
    try {
        const body = req.body;
        if (!isValidPayload(body))
            return res.status(400).json({ error: 'Payload inválido' });
        console.log(`Recebido pedido para impressão: ${body.orderNumber}`);
        // Basic check device exists
        if (!fs.existsSync(PRINTER_DEVICE)) {
            console.error('Dispositivo de impressão não encontrado:', PRINTER_DEVICE);
            return res.status(500).json({ error: 'Dispositivo de impressão não disponível' });
        }
        await printToDevice(body, PRINTER_DEVICE);
        console.log('Impressão enviada com sucesso');
        return res.status(200).json({ status: 'printed' });
    }
    catch (err) {
        console.error('Erro ao imprimir:', err instanceof Error ? err.message : err);
        return res.status(500).json({ error: 'Erro ao processar impressão' });
    }
});
app.post('/test-print', async (_req, res) => {
    try {
        console.log('Recebido pedido para teste de impressão');
        // Basic check device exists
        if (!fs.existsSync(PRINTER_DEVICE)) {
            console.error('Dispositivo de impressão não encontrado:', PRINTER_DEVICE);
            return res.status(500).json({ error: 'Dispositivo de impressão não disponível' });
        }
        // Create a simple test receipt
        const testPayload = {
            orderNumber: 'TEST',
            items: [
                {
                    name: 'TESTE DE IMPRESSORA',
                    quantity: 1,
                    unitPrice: 0.0,
                    observations: 'Cupom de teste',
                },
            ],
            total: 0.0,
            paymentMethod: 'TESTE',
            payments: [{ method: 'TESTE', amount: 0.0 }],
        };
        await printToDevice(testPayload, PRINTER_DEVICE);
        console.log('Teste de impressão enviado com sucesso');
        return res.status(200).json({ status: 'printed' });
    }
    catch (err) {
        console.error('Erro ao testar impressão:', err instanceof Error ? err.message : err);
        return res.status(500).json({ error: 'Erro ao processar teste de impressão' });
    }
});
app.listen(PORT, HOST, () => {
    console.log(`Print Agent iniciado em ${HOST}:${PORT}`);
    console.log(`Printer device: ${PRINTER_DEVICE}`);
});
