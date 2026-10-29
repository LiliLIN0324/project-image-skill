import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9461);
const W = Number(process.env.PAGE_W || 2381);
const H = Number(process.env.PAGE_H || 1339);
const DPR = Number(process.env.DPR || 2);

const FILE = path.resolve(process.argv[2] || 'stage.html');
const OUT = path.resolve(process.argv[3] || 'shots');
const PREFIX = process.argv[4] || '';
const START = Number(process.env.START || 1);
fs.mkdirSync(OUT, { recursive: true });
const PROFILE = path.join(process.env.TEMP || '.', 'cdp-deck-' + Date.now());

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W + 20},${H + 60}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function version() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('Chrome 没起来：检查 CHROME_PATH');
}

let ws, id = 0;
const pend = new Map();
const send = (m, p = {}, s) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s })); });

const v = await version();
ws = new WebSocket(v.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: false }, sessionId);

const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }, sessionId);
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.navigate', { url: 'file:///' + FILE.replace(/\\/g, '/') }, sessionId);
await sleep(1800);
await ev('document.fonts.ready.then(()=>1)');
await ev('Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=r;i.onerror=r})))');
await sleep(1200);

const n = await ev("document.querySelectorAll('.page').length");
if (!n) throw new Error('页面上没有 .page');
console.log('pages', n);

for (let i = 0; i < n; i++) {
  const r = await ev(`(()=>{const p=document.querySelectorAll('.page')[${i}];p.scrollIntoView({block:'start'});const b=p.getBoundingClientRect();return {x:b.x,y:b.y+scrollY,w:b.width,h:b.height,id:p.id}})()`);
  await sleep(500);
  const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: DPR }, captureBeyondViewport: true }, sessionId);
  const name = String(START + i).padStart(2, '0');
  fs.writeFileSync(path.join(OUT, `${PREFIX}${name}.png`), Buffer.from(s.data, 'base64'));
  console.log('shot', name, r.id || '', r.w, 'x', r.h);
}
ws.close(); chrome.kill(); await sleep(500);
try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
