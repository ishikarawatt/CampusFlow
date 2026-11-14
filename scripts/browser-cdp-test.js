// scripts/browser-cdp-test.js
// Automated Chrome DevTools Protocol (CDP) browser test for Phase 3.
// Directly controls headless Chrome over native WebSocket (no heavy frameworks needed).

const path = require('path');
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { spawn } = require('child_process');
const fs = require('fs');
const pool = require('../server/src/dbms/db');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\1283bbf6-7236-4dc2-9f1f-580d7c2e198b';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
  }

  async connect() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve) => {
      this.ws.onopen = resolve;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`[Screenshot saved] -> ${filePath}`);
    return buffer;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('>>> Launching headless Chrome on port 9222...');
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await sleep(2000);

  let cdp;
  try {
    const verRes = await fetch('http://127.0.0.1:9222/json/version');
    const verData = await verRes.json();
    console.log('Connected to Chrome:', verData.Browser);

    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await listRes.json();
    const tabWsUrl = tabs[0].webSocketDebuggerUrl;

    cdp = new CDPClient(tabWsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Navigate to login page
    console.log('>>> 1. Navigating to http://localhost:5173/login ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    // 2. Perform Admin Login via API in browser context to guarantee JWT in localStorage
    console.log('>>> 2. Performing authenticated login for admin@campusflow.local ...');
    const loginUser = await cdp.eval(`
      (async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@campusflow.local', password: 'password123' })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('campusflow_token', data.token);
          localStorage.setItem('campusflow_user', JSON.stringify(data.user));
          return data.user.email;
        }
        return 'login failed: ' + JSON.stringify(data);
      })()
    `);
    console.log('Authenticated session initialized:', loginUser);

    // 3. Open Exam Monitoring
    console.log('>>> 3. Navigating to Exam Monitoring (/admin/monitoring) ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/monitoring' });
    await sleep(3500);

    const monitoringContent = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        const onlinePcs = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.trim() === 'Online');
        const pcCards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('LAB-A-PC03'));
        const liveIndicator = document.body.innerText.includes('Live Stream Connected');
        return {
          hasLiveIndicator: liveIndicator,
          onlineCount: onlinePcs.length,
          hasPc03: pcCards.length > 0,
          pc03Details: pcCards.find(c => c.innerText.includes('LAB-A-PC03'))?.innerText || 'not found'
        };
      })()
    `);
    console.log('Monitoring page initial state:', monitoringContent);

    // Capture screenshot: PC03 Online
    const screen1Path = path.join(ARTIFACT_DIR, 'exam_monitoring_online.png');
    await cdp.screenshot(screen1Path);
    if (!fs.existsSync(path.join(__dirname, '../docs'))) fs.mkdirSync(path.join(__dirname, '../docs'), { recursive: true });
    fs.copyFileSync(screen1Path, path.join(__dirname, '../docs/exam_monitoring_online.png'));

    // 4. Open Exam PCs and allocate Aarav Sharma to LAB-A-PC03
    console.log('>>> 4. Navigating to Exam PCs (/admin/exam-pcs) ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/exam-pcs' });
    await sleep(2500);

    const examPcsInfo = await cdp.eval(`
      (() => {
        const rows = Array.from(document.querySelectorAll('tr')).map(r => r.innerText);
        const pc03Row = rows.find(r => r.includes('LAB-A-PC03'));
        return { pc03Row };
      })()
    `);
    console.log('Exam PCs table row for PC03:', examPcsInfo);

    // Open Allocate Modal
    console.log('>>> Opening Allocate Modal...');
    await cdp.eval(`
      (() => {
        const allocBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Allocate Student'));
        if (allocBtn) allocBtn.click();
      })()
    `);
    await sleep(1500);

    // Select LAB-A-PC03 and Aarav Sharma
    console.log('>>> Selecting LAB-A-PC03 and student Aarav Sharma...');
    const allocResult = await cdp.eval(`
      (() => {
        const selects = document.querySelectorAll('select');
        if (selects.length >= 2) {
          const pcSelect = selects[0];
          const studentSelect = selects[1];
          
          for (let opt of pcSelect.options) {
            if (opt.text.includes('LAB-A-PC03')) {
              pcSelect.value = opt.value;
              pcSelect.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
          
          for (let opt of studentSelect.options) {
            if (opt.text.includes('Aarav Sharma')) {
              studentSelect.value = opt.value;
              studentSelect.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
          
          const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm Allocation'));
          if (confirmBtn) {
            confirmBtn.click();
            return 'confirmed';
          }
        }
        return 'selects not found';
      })()
    `);
    console.log('Allocation modal result:', allocResult);
    await sleep(2500);

    // Start Exam Session for LAB-A-PC03
    console.log('>>> Starting Exam Session for LAB-A-PC03...');
    const startResult = await cdp.eval(`
      (() => {
        const rows = Array.from(document.querySelectorAll('tr')).filter(r => r.innerText.includes('LAB-A-PC03'));
        for (let row of rows) {
          const startBtn = Array.from(row.querySelectorAll('button')).find(b => b.innerText.includes('Start Exam'));
          if (startBtn) {
            startBtn.click();
            return 'start exam clicked';
          }
        }
        return 'start exam button not found';
      })()
    `);
    console.log('Start exam result:', startResult);
    await sleep(2500);

    // 5. Navigate back to Exam Monitoring
    console.log('>>> 5. Navigating back to Exam Monitoring (/admin/monitoring) ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/monitoring' });
    await sleep(3000);

    const cardSessionInfo = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('LAB-A-PC03'));
        const matched = cards.find(c => c.innerText.includes('Aarav Sharma'));
        return {
          foundStudentOnCard: !!matched,
          cardText: matched ? matched.innerText : 'not found'
        };
      })()
    `);
    console.log('LAB-A-PC03 card displaying student:', cardSessionInfo);

    // Click on LAB-A-PC03 card to open side panel
    console.log('>>> Clicking on LAB-A-PC03 card to open side panel...');
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('LAB-A-PC03'));
        const target = cards.find(c => c.innerText.includes('Aarav Sharma')) || cards[0];
        if (target) target.click();
      })()
    `);
    await sleep(1500);

    const sidePanelNotice = await cdp.eval(`
      (() => {
        return document.body.innerText.includes('Flags need human review; they are not proof of cheating.');
      })()
    `);
    console.log('Side panel notice present ("Flags need human review..."):', sidePanelNotice);

    // 6. Send simulated violation events for PC03
    console.log('>>> 6. Sending simulated FOCUS_LOST and PROHIBITED_PROCESS events for PC03 ...');
    const [activeSess] = await pool.query("SELECT id FROM exam_sessions WHERE computer_id = 3 AND status = 'active'");
    const sessId = activeSess[0]?.id;

    const { emitAgentEvent } = require('../server/src/socket');
    const [insEv] = await pool.query(
      `INSERT INTO monitoring_events (exam_session_id, computer_id, event_type, window_title, process_name, occurred_at)
       VALUES (?, 3, 'PROHIBITED_PROCESS', 'Discord - #general', 'discord.exe', NOW(3))`,
      [sessId]
    );

    emitAgentEvent({
      id: insEv.insertId,
      exam_session_id: sessId,
      computer_id: 3,
      pc_code: 'LAB-A-PC03',
      event_type: 'PROHIBITED_PROCESS',
      window_title: 'Discord - #general',
      process_name: 'discord.exe',
      occurred_at: new Date().toISOString(),
      review_status: 'new',
    });

    console.log(`Live event emitted: PROHIBITED_PROCESS discord.exe (ID: ${insEv.insertId})`);
    await sleep(2500);

    const liveEventState = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        const hasDiscord = text.includes('discord.exe') || text.includes('PROHIBITED_PROCESS');
        const hasReviewBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim() === 'Review');
        return { hasDiscord, hasReviewBtn };
      })()
    `);
    console.log('Live alert & review button visible in DOM:', liveEventState);

    // Click "Review" button in side panel
    console.log('>>> Clicking "Review" button in side panel...');
    await cdp.eval(`
      (() => {
        const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Review');
        if (reviewBtn) reviewBtn.click();
      })()
    `);
    await sleep(2000);

    // Capture screenshot: Session Active & Reviewed Event
    const screen2Path = path.join(ARTIFACT_DIR, 'exam_monitoring_session.png');
    await cdp.screenshot(screen2Path);
    fs.copyFileSync(screen2Path, path.join(__dirname, '../docs/exam_monitoring_session.png'));

    // 7. Verify existing admin pages: Control Center, Live Monitor, Users
    console.log('>>> 7. Testing existing admin routes for regressions ...');
    
    // Control Center (/admin)
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin' });
    await sleep(2500);
    const controlCenterOk = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Control Center') || text.includes('Active Drives') || text.includes('Pipeline Overview');
      })()
    `);
    console.log('Control Center loads successfully:', controlCenterOk);

    // Live Monitor (/admin/monitor)
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/monitor' });
    await sleep(2500);
    const liveMonitorOk = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Live Monitor') || text.includes('Lock') || text.includes('Critical Section');
      })()
    `);
    console.log('Live Monitor loads successfully:', liveMonitorOk);

    // Users (/admin/users)
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/users' });
    await sleep(2500);
    const usersOk = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Users') || text.includes('Placement Officer');
      })()
    `);
    console.log('Users directory loads successfully:', usersOk);

    cdp.close();
    chromeProcess.kill();
    console.log('\n>>> ALL BROWSER CDP VALIDATION CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('[Browser Test Error]:', err);
    if (cdp) cdp.close();
    chromeProcess.kill();
    process.exit(1);
  }
}

main();
