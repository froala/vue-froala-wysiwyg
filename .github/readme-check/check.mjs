// Checks that the README's code examples work when copied as written.
//
// 1. Syntax: every js/jsx/ts/tsx/vue block must parse. Snippets that are not a
//    whole file (`config={{ ... }}`, a lone `<froala>` tag) are tried inside a
//    few wrappers, so only real syntax errors fail.
// 2. Apps: blocks marked with `<!-- readme-test: <app> <file> -->` on the line
//    before the fence are written into the app shell in apps/<app>, built
//    against the packed package (--package), served, and opened in headless
//    Chrome. The page must show the editor with no errors or framework warnings.
//
// Usage: node check.mjs --readme ../../README.md --package ../../pkg.tgz [--only syntax|apps] [--app name]

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const config = JSON.parse(readFileSync(join(here, 'apps.json'), 'utf8'));

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}
const readmePath = resolve(args.readme || join(here, '..', '..', config.readme));
const readme = readFileSync(readmePath, 'utf8').replace(/\r\n/g, '\n');

let failures = 0;
function fail(where, message) {
  failures++;
  console.log(`FAIL ${where}\n     ${message.split('\n').join('\n     ')}`);
}

// --- Parse the README into fenced blocks ---------------------------------

function readBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let heading = '';
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6} /.test(lines[i])) heading = lines[i].replace(/^#+ /, '');
    const open = lines[i].match(/^```(\S*)/);
    if (!open) continue;
    const start = i;
    const body = [];
    for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) body.push(lines[i]);
    let marker = null;
    for (let j = start - 1; j >= 0 && j >= start - 2; j--) {
      const m = lines[j].match(/^<!--\s*readme-test:\s*(.+?)\s*-->\s*$/);
      if (m) { marker = m[1]; break; }
    }
    blocks.push({ lang: open[1].toLowerCase(), line: start + 1, heading, code: body.join('\n') + '\n', marker });
  }
  return blocks;
}

const blocks = readBlocks(readme);

// --- 1. Syntax ------------------------------------------------------------

const LOADERS = { js: 'jsx', javascript: 'jsx', jsx: 'jsx', ts: 'ts', typescript: 'ts', tsx: 'tsx' };

function wrappersFor(code) {
  return [
    code,
    `<>\n${code}\n</>`,
    `<X\n${code}\n/>`,
    `({\n${code}\n})`,
    `class X {\n${code}\n}`
  ];
}

function checkScript(esbuild, block) {
  const loader = LOADERS[block.lang];
  let firstError = null;
  for (const candidate of wrappersFor(block.code)) {
    try {
      esbuild.transformSync(candidate, { loader });
      return null;
    } catch (e) {
      firstError = firstError || e.errors?.[0]?.text || String(e);
    }
  }
  return firstError;
}

function checkVue(block) {
  const sfc = require('@vue/compiler-sfc');
  const isSfc = /^\s*(<!--[\s\S]*?-->\s*)*<(template|script|style)[\s>]/.test(block.code);
  const source = isSfc ? block.code : `<template>\n${block.code}\n</template>\n`;
  const { descriptor, errors } = sfc.parse(source, { filename: 'Example.vue' });
  if (errors.length) return String(errors[0].message || errors[0]);
  try {
    if (descriptor.script || descriptor.scriptSetup) sfc.compileScript(descriptor, { id: 'x' });
  } catch (e) {
    return e.message;
  }
  if (descriptor.template) {
    const t = sfc.compileTemplate({ source: descriptor.template.content, filename: 'Example.vue', id: 'x' });
    if (t.errors.length) return String(t.errors[0].message || t.errors[0]);
  }
  return null;
}

async function syntaxPass() {
  const esbuild = await import('esbuild');
  let checked = 0;
  for (const block of blocks) {
    if (block.marker === 'skip') continue;
    let error = null;
    if (LOADERS[block.lang]) error = checkScript(esbuild, block);
    else if (block.lang === 'vue') error = checkVue(block);
    else continue;
    checked++;
    if (error) fail(`README line ${block.line} (${block.heading})`, `${block.lang} block does not parse: ${error}`);
  }
  console.log(`syntax: ${checked} blocks checked`);
}

// --- 2. Apps ----------------------------------------------------------------

function run(cmd, cwd, env = {}) {
  console.log(`  $ ${cmd.join(' ')}`);
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd.join(' ')} exited ${r.status}\n${(r.stdout + r.stderr).split('\n').slice(-25).join('\n')}`);
}

async function waitForHttp(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      return res.status;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`no response from ${url} after ${ms / 1000}s`);
}

function fillApp(app, dir) {
  const wanted = blocks.filter(b => b.marker && b.marker.split(/\s+/)[0] === app.name);
  if (!wanted.length) throw new Error(`no README block is marked "readme-test: ${app.name} <file>"`);
  for (const block of wanted) {
    const target = block.marker.split(/\s+/)[1];
    if (target.startsWith('@')) {
      // Insert into a placeholder <!--readme:name--> in one of the shell's files.
      const [file, slot] = target.slice(1).split(':');
      const path = join(dir, file);
      const text = readFileSync(path, 'utf8');
      if (!text.includes(`<!--readme:${slot}-->`)) throw new Error(`${file} has no <!--readme:${slot}--> placeholder`);
      writeFileSync(path, text.replace(`<!--readme:${slot}-->`, block.code));
    } else {
      mkdirSync(dirname(join(dir, target)), { recursive: true });
      writeFileSync(join(dir, target), block.code);
    }
  }
  return wanted.length;
}

async function checkPage(url) {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const problems = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => problems.push(`page error: ${e.message}`));
    page.on('console', m => {
      const text = m.text();
      if (m.type() === 'error' && !/Failed to load resource/.test(text)) problems.push(`console error: ${text.split('\n')[0]}`);
      else if (/\[Vue warn\]|Hydration|hydration|Warning: /.test(text)) problems.push(`console ${m.type()}: ${text.split('\n')[0]}`);
    });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    try {
      await page.waitForSelector('.fr-box .fr-element', { timeout: 30000 });
    } catch {
      const body = await page.evaluate(() => document.body.innerHTML.slice(0, 300));
      problems.unshift(`the editor never appeared; page body starts: ${body}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  } finally {
    await browser.close();
  }
  return problems;
}

async function appPass() {
  if (!args.package) throw new Error('--package <path to the packed .tgz> is required for the app checks');
  const pkg = resolve(args.package);
  const root = join(tmpdir(), `readme-check-${process.pid}`);
  let port = 4310;
  for (const app of config.apps) {
    if (args.app && args.app !== app.name) continue;
    console.log(`app ${app.name}: ${app.description}`);
    const dir = join(root, app.name);
    rmSync(dir, { recursive: true, force: true });
    cpSync(join(here, 'apps', app.name), dir, { recursive: true });
    let server = null;
    try {
      const n = fillApp(app, dir);
      console.log(`  ${n} README block(s) written`);
      run(['npm', 'install', '--no-audit', '--no-fund', pkg], dir);
      run(app.build, dir);
      const p = String(port++);
      const start = app.start.map(s => s.replace('$PORT', p));
      server = spawn(start[0], start.slice(1), { cwd: dir, stdio: 'ignore', shell: process.platform === 'win32', env: { ...process.env, PORT: p } });
      const url = `http://localhost:${p}${app.path || '/'}`;
      const status = await waitForHttp(url, 60000);
      if (status !== 200) throw new Error(`${url} answered ${status}`);
      const problems = await checkPage(url);
      if (problems.length) fail(`app ${app.name}`, problems.join('\n'));
      else console.log(`  ok: editor renders at ${app.path || '/'} with no errors or warnings`);
    } catch (e) {
      fail(`app ${app.name}`, e.message);
    } finally {
      if (server) {
        if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f']);
        else server.kill();
      }
    }
  }
}

if (args.only !== 'apps') await syntaxPass();
if (args.only !== 'syntax') await appPass();

if (failures) {
  console.log(`\n${failures} README example check(s) failed.`);
  process.exit(1);
}
console.log('\nAll README example checks passed.');
