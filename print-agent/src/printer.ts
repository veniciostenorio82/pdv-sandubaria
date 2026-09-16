import fs from 'fs';
import { PrintPayload } from './types.js';

const ESC = '\x1b';
const WIDTH = 32;

function esc(cmd: string) {
  return Buffer.from(cmd, 'binary');
}

function formatCurrency(value: number) {
  const abs = Math.abs(value);
  const [reais, cents] = abs.toFixed(2).split('.');
  const grouped = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';
  return `${sign}R$ ${grouped},${cents}`;
}

function paymentLabel(method: string) {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    'cartao-credito': 'Cartao Credito',
    'cartao-debito': 'Cartao Debito',
    pix: 'PIX',
  };
  return labels[method] || method;
}

function padLine(left: string, right: string) {
  const padLen = Math.max(1, WIDTH - left.length - right.length);
  return left + ' '.repeat(padLen) + right;
}

function wrapText(text: string, indent = '') {
  const max = Math.max(8, WIDTH - indent.length);
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const flush = () => {
    if (current) {
      lines.push(indent + current);
      current = '';
    }
  };

  for (const word of words) {
    if (word.length > max) {
      flush();
      let rest = word;
      while (rest.length > max) {
        lines.push(indent + rest.slice(0, max));
        rest = rest.slice(max);
      }
      current = rest;
      continue;
    }

    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= max) {
      current += ' ' + word;
    } else {
      lines.push(indent + current);
      current = word;
    }
  }

  flush();
  return lines;
}

export async function printToDevice(payload: PrintPayload, devicePath: string) {
  const lines: Buffer[] = [];

  lines.push(esc(ESC + '@'));

  lines.push(esc(ESC + 'a' + '\x01'));
  lines.push(esc(ESC + 'E' + '\x01'));
  lines.push(Buffer.from('SANDUBARIA\n'));
  lines.push(esc(ESC + 'E' + '\x00'));
  lines.push(esc(ESC + 'a' + '\x00'));
  lines.push(Buffer.from('------------------------------\n'));

  lines.push(Buffer.from(`PEDIDO #${payload.orderNumber}\n\n`));

  for (const item of payload.items) {
    const subtotal = item.quantity * item.unitPrice;
    for (const nameLine of wrapText(`${item.quantity}x ${item.name}`)) {
      lines.push(Buffer.from(nameLine + '\n'));
    }
    lines.push(Buffer.from(`   Un. ${formatCurrency(item.unitPrice)}\n`));
    lines.push(Buffer.from(`   Total ${formatCurrency(subtotal)}\n`));
    if (item.observations && item.observations.trim()) {
      for (const obsLine of wrapText(`Obs: ${item.observations.trim()}`, '   ')) {
        lines.push(Buffer.from(obsLine + '\n'));
      }
    }
    lines.push(Buffer.from('\n'));
  }

  lines.push(Buffer.from('------------------------------\n'));
  lines.push(Buffer.from(padLine('TOTAL', formatCurrency(payload.total)) + '\n'));
  lines.push(Buffer.from('------------------------------\n'));

  const payments = payload.payments && payload.payments.length > 0
    ? payload.payments
    : [{ method: payload.paymentMethod, amount: payload.total }];

  lines.push(Buffer.from('PAGAMENTO\n'));
  for (const payment of payments) {
    lines.push(
      Buffer.from(padLine(paymentLabel(payment.method), formatCurrency(payment.amount)) + '\n')
    );
    if (typeof payment.cashReceived === 'number') {
      lines.push(Buffer.from(`  Rec. ${formatCurrency(payment.cashReceived)}\n`));
    }
    if (typeof payment.change === 'number') {
      lines.push(Buffer.from(`  Troco ${formatCurrency(payment.change)}\n`));
    }
  }

  lines.push(Buffer.from('\n\n\n'));

  const buffer = Buffer.concat(lines);

  return new Promise<void>((resolve, reject) => {
    fs.open(devicePath, 'w', (err, fd) => {
      if (err) return reject(new Error('Falha ao abrir o dispositivo de impressão'));
      fs.write(fd, buffer, 0, buffer.length, null, (wErr) => {
        if (wErr) {
          fs.close(fd, () => {});
          return reject(new Error('Falha ao escrever no dispositivo de impressão'));
        }
        fs.close(fd, () => {});
        resolve();
      });
    });
  });
}
