#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ -x "${SCRIPT_DIR}/pdv-sandubaria" ]]; then
  SOURCE_DIR="${SCRIPT_DIR}"
elif [[ -x "${SCRIPT_DIR}/../../release/pdv-sandubaria" ]]; then
  SOURCE_DIR="$(cd "${SCRIPT_DIR}/../../release" && pwd)"
else
  echo "Pacote incompleto: executável pdv-sandubaria não encontrado."
  echo "Gere a distribuição com: npm run build:launcher"
  exit 1
fi

TARGET_DIR="${PDV_INSTALL_DIR:-$HOME/.local/opt/pdv-sandubaria}"
APP_NAME="pdv-sandubaria"
DESKTOP_NAME="PDV Sandubaria"

if [[ ! -x "${SOURCE_DIR}/${APP_NAME}" ]]; then
  echo "Pacote incompleto: ${SOURCE_DIR}/${APP_NAME} não encontrado."
  exit 1
fi

mkdir -p "${TARGET_DIR}"

SOURCE_REAL="$(realpath "${SOURCE_DIR}")"
TARGET_REAL="$(realpath "${TARGET_DIR}")"
KEEP_ENV=""

if [[ "${SOURCE_REAL}" != "${TARGET_REAL}" ]]; then
  if [[ -f "${TARGET_DIR}/pdv.env" ]]; then
    KEEP_ENV="$(mktemp)"
    cp "${TARGET_DIR}/pdv.env" "${KEEP_ENV}"
  fi
  cp -a "${SOURCE_DIR}/." "${TARGET_DIR}/"
  if [[ -n "${KEEP_ENV}" ]]; then
    mv "${KEEP_ENV}" "${TARGET_DIR}/pdv.env"
  fi
fi

chmod +x "${TARGET_DIR}/${APP_NAME}"
chmod +x "${TARGET_DIR}/lib/node" 2>/dev/null || true
chmod +x "${TARGET_DIR}/install.sh" 2>/dev/null || true

EXEC_PATH="${TARGET_DIR}/${APP_NAME}"
ICON_PATH="${TARGET_DIR}/share/icons/${APP_NAME}.png"
APPLICATIONS_DIR="${HOME}/.local/share/applications"
mkdir -p "${APPLICATIONS_DIR}"

DESKTOP_IN="${TARGET_DIR}/share/applications/${APP_NAME}.desktop.in"
if [[ ! -f "${DESKTOP_IN}" ]]; then
  echo "Arquivo .desktop.in não encontrado em ${DESKTOP_IN}"
  exit 1
fi

DESKTOP_FILE="${APPLICATIONS_DIR}/${APP_NAME}.desktop"
sed \
  -e "s|@EXEC@|${EXEC_PATH}|g" \
  -e "s|@ICON@|${ICON_PATH}|g" \
  "${DESKTOP_IN}" > "${DESKTOP_FILE}"

chmod +x "${DESKTOP_FILE}"

if command -v gio >/dev/null 2>&1; then
  gio set "${DESKTOP_FILE}" metadata::trusted true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${APPLICATIONS_DIR}" 2>/dev/null || true
fi

copy_desktop_shortcut() {
  local desktop_dir="$1"
  mkdir -p "${desktop_dir}"
  cp "${DESKTOP_FILE}" "${desktop_dir}/${APP_NAME}.desktop"
  chmod +x "${desktop_dir}/${APP_NAME}.desktop"
  if command -v gio >/dev/null 2>&1; then
    gio set "${desktop_dir}/${APP_NAME}.desktop" metadata::trusted true 2>/dev/null || true
  fi
}

if [[ -d "${HOME}/Desktop" ]]; then
  copy_desktop_shortcut "${HOME}/Desktop"
fi
if [[ -d "${HOME}/Área de Trabalho" ]]; then
  copy_desktop_shortcut "${HOME}/Área de Trabalho"
fi
if [[ -d "${HOME}/Área de trabalho" ]]; then
  copy_desktop_shortcut "${HOME}/Área de trabalho"
fi
if [[ -n "${XDG_DESKTOP_DIR:-}" && -d "${XDG_DESKTOP_DIR}" ]]; then
  copy_desktop_shortcut "${XDG_DESKTOP_DIR}"
fi
if command -v xdg-user-dir >/dev/null 2>&1; then
  DETECTED_DESKTOP="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
  if [[ -n "${DETECTED_DESKTOP}" && -d "${DETECTED_DESKTOP}" ]]; then
    copy_desktop_shortcut "${DETECTED_DESKTOP}"
  fi
fi

echo "Instalado em: ${TARGET_DIR}"
echo "Atalho do menu: ${DESKTOP_FILE}"
echo "Para executar: ${EXEC_PATH}"
echo
echo "O atalho \"${DESKTOP_NAME}\" pode ser usado na área de trabalho."
echo "Edite ${TARGET_DIR}/pdv.env se precisar alterar a URL da PWA."
