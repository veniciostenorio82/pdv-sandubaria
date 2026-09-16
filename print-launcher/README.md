# Print Launcher

Local service that starts and manages the Print Agent process without requiring terminal access.

## Purpose

Provides a simple HTTP API to start the Print Agent from the PDV interface, avoiding the need for end-users to open a terminal and manually run `npm run dev`.

## Architecture

```
PDV (Frontend) → Print Launcher (port 9101) → Print Agent (port 9100) → /dev/usb/lp0
```

## Quick Start

1. Install dependencies in this directory:

```bash
cd print-launcher
npm install
```

2. Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

3. Development:

```bash
npm run dev
```

4. Build and run:

```bash
npm run build
npm start
```

## Endpoints

- `GET /launcher/health` — Check if launcher is running
- `POST /launcher/start` — Start Print Agent (idempotent, checks if already running)
- `POST /launcher/stop` — Stop Print Agent

## Usage from Frontend

```typescript
// Check if launcher is available
const response = await fetch('http://localhost:9101/launcher/health');

// Start Print Agent
const result = await fetch('http://localhost:9101/launcher/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

## Environment Variables

- `LAUNCHER_PORT` — Port to listen on (default: 9101)
- `LAUNCHER_BIND` — Address to bind to (default: 127.0.0.1)
- `PRINT_AGENT_PORT` — Print Agent port for health check (default: 9100)
- `PRINT_AGENT_HOST` — Print Agent host for health check (default: 127.0.0.1)
- `PRINT_AGENT_PATH` — Relative path to print-agent directory (default: ../print-agent)
- `CORS_ORIGIN` — Allowed origin for CORS (default: http://localhost:3000)

## Notes

- The launcher operates in the same process, so you only need to run it once after boot
- It will spawn the Print Agent as a detached child process
- The launcher will check if Print Agent is already running before starting a new instance
- Print Agent process will continue running even if launcher is stopped
