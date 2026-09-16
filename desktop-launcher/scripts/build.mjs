#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const launcherDir = join(root, 'desktop-launcher');
const releaseDir = join(root, 'release');
const cacheDir = join(launcherDir, '.cache');
const nodeVersion = '20.19.2';
const nodeDistName = `node-v${nodeVersion}-linux-x64`;
const nodeTarball = `${nodeDistName}.tar.xz`;
const nodeUrl = `https://nodejs.org/dist/v${nodeVersion}/${nodeTarball}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`Falha ao executar: ${command} ${args.join(' ')}`);
  }
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function downloadNode() {
  ensureDir(cacheDir);
  const tarballPath = join(cacheDir, nodeTarball);
  const extractedNode = join(cacheDir, nodeDistName, 'bin', 'node');
  if (existsSync(extractedNode)) return extractedNode;

  if (!existsSync(tarballPath)) {
    console.log(`Baixando Node.js ${nodeVersion} (runtime portátil)...`);
    run('curl', ['-fsSL', nodeUrl, '-o', tarballPath]);
  }

  console.log('Extraindo Node.js portátil...');
  run('tar', ['-xJf', tarballPath, '-C', cacheDir]);
  if (!existsSync(extractedNode)) {
    throw new Error('Falha ao extrair o Node.js portátil');
  }
  return extractedNode;
}

function bundleWithEsbuild(entry, outfile) {
  run('npx', [
    '--yes',
    'esbuild@0.25.9',
    entry,
    '--bundle',
    '--platform=node',
    '--format=cjs',
    `--outfile=${outfile}`,
    '--legal-comments=none',
  ]);
}

function compileWrapper(outfile) {
  run('gcc', [
    '-O2',
    '-s',
    '-o',
    outfile,
    join(launcherDir, 'src', 'wrapper.c'),
  ]);
  chmodSync(outfile, 0o755);
}

function createIcon(outfile) {
  ensureDir(dirname(outfile));
  const result = spawnSync(
    'magick',
    [
      '-size',
      '256x256',
      'xc:none',
      '-fill',
      '#2563eb',
      '-draw',
      'roundrectangle 12,12 244,244 48,48',
      '-fill',
      'white',
      '-font',
      'DejaVu-Sans-Bold',
      '-pointsize',
      '68',
      '-gravity',
      'center',
      '-annotate',
      '+0-26',
      'PDV',
      '-pointsize',
      '24',
      '-annotate',
      '+0+40',
      'Sandubaria',
      outfile,
    ],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) {
    run('convert', [
      '-size',
      '256x256',
      'xc:#2563eb',
      '-fill',
      'white',
      '-gravity',
      'center',
      '-pointsize',
      '64',
      '-annotate',
      '0',
      'PDV',
      outfile,
    ]);
  }
}

function writeReadme(outfile) {
  writeFileSync(
    outfile,
    [
      'PDV Sandubaria — pacote Linux independente',
      '',
      'Este diretório é suficiente para a máquina do estabelecimento.',
      'Não é necessário o repositório Git, npm run dev ou node_modules do PDV.',
      '',
      'URL da PWA: https://pdv-sandubaria.vercel.app',
      'Print Agent: http://127.0.0.1:9100/health',
      '',
      'Instalação:',
      '  ./install.sh',
      '',
      'O atalho "PDV Sandubaria" será criado no menu e na área de trabalho.',
      'Para alterar a URL da PWA, edite pdv.env.',
      '',
    ].join('\n')
  );
}

function main() {
  console.log('Gerando distribuição Linux em release/');
  rmSync(releaseDir, { recursive: true, force: true });
  ensureDir(join(releaseDir, 'lib'));
  ensureDir(join(releaseDir, 'share', 'applications'));
  ensureDir(join(releaseDir, 'share', 'icons'));

  const portableNode = downloadNode();
  copyFileSync(portableNode, join(releaseDir, 'lib', 'node'));
  chmodSync(join(releaseDir, 'lib', 'node'), 0o755);

  console.log('Empacotando Print Agent...');
  bundleWithEsbuild(
    join(root, 'print-agent', 'src', 'index.ts'),
    join(releaseDir, 'lib', 'print-agent.js')
  );

  console.log('Empacotando launcher...');
  bundleWithEsbuild(
    join(launcherDir, 'src', 'launcher.ts'),
    join(releaseDir, 'lib', 'launcher.js')
  );

  console.log('Compilando executável pdv-sandubaria...');
  compileWrapper(join(releaseDir, 'pdv-sandubaria'));

  copyFileSync(join(launcherDir, 'assets', 'pdv.env.example'), join(releaseDir, 'pdv.env'));
  copyFileSync(
    join(launcherDir, 'assets', 'pdv-sandubaria.desktop.in'),
    join(releaseDir, 'share', 'applications', 'pdv-sandubaria.desktop.in')
  );
  copyFileSync(join(launcherDir, 'scripts', 'install.sh'), join(releaseDir, 'install.sh'));
  chmodSync(join(releaseDir, 'install.sh'), 0o755);

  createIcon(join(releaseDir, 'share', 'icons', 'pdv-sandubaria.png'));
  writeReadme(join(releaseDir, 'README.txt'));

  const version = execFileSync(join(releaseDir, 'lib', 'node'), ['-v'], {
    encoding: 'utf8',
  }).trim();
  console.log(`Runtime empacotado: ${version}`);
  console.log(`Distribuição gerada em: ${releaseDir}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
