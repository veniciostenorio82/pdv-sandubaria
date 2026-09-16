#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PENDRIVE="/tmp/pdv-pendrive"
CAIXA="/tmp/pdv-caixa"

echo "==> Gerando distribuição"
node "${ROOT}/desktop-launcher/scripts/build.mjs"

echo "==> Simulando máquina do estabelecimento (cópia fora do projeto)"
rm -rf "${PENDRIVE}" "${CAIXA}"
cp -a "${ROOT}/release" "${PENDRIVE}"

echo "==> Instalando a partir da cópia independente"
PDV_INSTALL_DIR="${CAIXA}" "${PENDRIVE}/install.sh"

if [[ ! -x "${CAIXA}/pdv-sandubaria" ]]; then
  echo "FALHA: executável não foi instalado em ${CAIXA}"
  exit 1
fi

echo "==> Iniciando launcher"
PDV_NO_DIALOG=1 "${CAIXA}/pdv-sandubaria"

echo "==> Verificando /health"
HEALTH="$(curl -fsS --max-time 3 http://127.0.0.1:9100/health)"
echo "Resposta: ${HEALTH}"
echo "${HEALTH}" | grep -q '"status":"ok"'

FIRST_COUNT="$(pgrep -fc "${CAIXA}/lib/print-agent.js" || true)"
echo "Processos do Print Agent após o 1º clique: ${FIRST_COUNT}"
if [[ "${FIRST_COUNT}" -lt 1 ]]; then
  echo "FALHA: Print Agent não ficou em execução"
  exit 1
fi

echo "==> Executando o launcher novamente (não deve duplicar o Agent)"
PDV_NO_DIALOG=1 "${CAIXA}/pdv-sandubaria"
SECOND_COUNT="$(pgrep -fc "${CAIXA}/lib/print-agent.js" || true)"
echo "Processos do Print Agent após o 2º clique: ${SECOND_COUNT}"
if [[ "${SECOND_COUNT}" -gt "${FIRST_COUNT}" ]]; then
  echo "FALHA: um segundo Print Agent foi iniciado"
  exit 1
fi

echo "==> Teste de impressão"
PRINT_STATUS="$(curl -sS -o /tmp/pdv-test-print.json -w '%{http_code}' -X POST http://127.0.0.1:9100/test-print || true)"
echo "HTTP ${PRINT_STATUS}: $(cat /tmp/pdv-test-print.json 2>/dev/null || true)"
if [[ -e /dev/usb/lp0 ]]; then
  if [[ "${PRINT_STATUS}" != "200" ]]; then
    echo "FALHA: impressora presente, mas o teste de impressão não funcionou"
    exit 1
  fi
else
  echo "Aviso: /dev/usb/lp0 não está presente nesta máquina; o Agent respondeu, mas a impressão física não pôde ser validada."
fi

echo
echo "OK: instalação independente, health, ausência de duplicata e fluxo do launcher validados."
echo "Executável de teste: ${CAIXA}/pdv-sandubaria"
