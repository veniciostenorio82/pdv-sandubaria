import fs from 'fs';
const ESC = '\x1b';
const GS = '\x1d';
function esc(cmd) {
    return Buffer.from(cmd, 'binary');
}
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export async function printToDevice(payload, devicePath) {
    // Build ESC/POS content
    const lines = [];
    // Initialize
    lines.push(esc(ESC + '@'));
    // Centered bold header
    lines.push(esc(ESC + 'a' + '\x01')); // center
    lines.push(esc(ESC + 'E' + '\x01')); // bold on
    lines.push(Buffer.from('SANDUBARIA\n'));
    lines.push(esc(ESC + 'E' + '\x00')); // bold off
    lines.push(esc(ESC + 'a' + '\x00')); // left
    lines.push(Buffer.from('------------------------------\n'));
    lines.push(Buffer.from(`PEDIDO #${payload.orderNumber}\n\n`));
    for (const item of payload.items) {
        const qty = item.quantity;
        const name = item.name;
        const subtotal = item.quantity * item.unitPrice;
        const left = `${qty}x ${name}`;
        const right = formatCurrency(subtotal);
        // try to align: assume 32 chars width
        const width = 32;
        const padLen = Math.max(1, width - left.length - right.length);
        const line = left + ' '.repeat(padLen) + right + '\n';
        lines.push(Buffer.from(line));
    }
    lines.push(Buffer.from('\n------------------------------\n'));
    const totalLine = 'TOTAL';
    const totalRight = formatCurrency(payload.total);
    const padLen = Math.max(1, 32 - totalLine.length - totalRight.length);
    lines.push(Buffer.from(totalLine + ' '.repeat(padLen) + totalRight + '\n\n'));
    lines.push(Buffer.from(`PAGAMENTO: ${payload.paymentMethod}\n\n`));
    // Feed and some blank lines
    lines.push(Buffer.from('\n\n\n'));
    const buffer = Buffer.concat(lines);
    // Write directly to device
    return new Promise((resolve, reject) => {
        fs.open(devicePath, 'w', (err, fd) => {
            if (err)
                return reject(new Error('Falha ao abrir o dispositivo de impressão'));
            fs.write(fd, buffer, 0, buffer.length, null, (wErr) => {
                if (wErr) {
                    fs.close(fd, () => { });
                    return reject(new Error('Falha ao escrever no dispositivo de impressão'));
                }
                fs.close(fd, () => { });
                resolve();
            });
        });
    });
}
