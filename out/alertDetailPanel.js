"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDetailPanel = void 0;
const vscode = __importStar(require("vscode"));
const SEV_COLOR = {
    CRITICAL: '#f85149',
    WARN: '#e3b341',
    INFO: '#58a6ff',
};
const FMT_COLOR = {
    json: '#7ee787',
    syslog: '#d2a8ff',
    apache: '#ffa657',
    plaintext: '#8b949e',
};
/**
 * AlertDetailPanel opens a WebView column showing full alert details.
 * Reuses the same panel instance — replaces content on each new alert.
 */
class AlertDetailPanel {
    static show(alert, extensionUri) {
        if (AlertDetailPanel.current) {
            AlertDetailPanel.current.update(alert);
            AlertDetailPanel.current.panel.reveal(vscode.ViewColumn.Two, true);
            return;
        }
        AlertDetailPanel.current = new AlertDetailPanel(alert, extensionUri);
    }
    constructor(alert, _extensionUri) {
        this.panel = vscode.window.createWebviewPanel('logwatch.alertDetail', 'Alert Detail', { viewColumn: vscode.ViewColumn.Two, preserveFocus: true }, { enableScripts: true, retainContextWhenHidden: true });
        this.panel.onDidDispose(() => {
            AlertDetailPanel.current = undefined;
        });
        this.update(alert);
        // Handle copy messages from WebView
        this.panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'copy') {
                await vscode.env.clipboard.writeText(msg.text);
                vscode.window.setStatusBarMessage('$(check) Copied to clipboard', 2000);
            }
        });
    }
    update(alert) {
        this.panel.title = `🔍 ${alert.rule}`;
        this.panel.webview.html = buildHTML(alert);
    }
}
exports.AlertDetailPanel = AlertDetailPanel;
// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHTML(a) {
    const color = SEV_COLOR[a.severity] ?? '#58a6ff';
    const fmtCol = FMT_COLOR[a.format] ?? '#8b949e';
    const time = new Date(a.time).toLocaleString('en-GB', { hour12: false });
    const fieldsHTML = a.fields && Object.keys(a.fields).length
        ? `<div class="section-title">Parsed Fields</div>
           <div class="chips">${Object.entries(a.fields).map(([k, v]) => `<div class="chip"><span class="chip-k">${esc(k)}</span><span class="chip-v">${esc(v)}</span></div>`).join('')}</div>`
        : '';
    const rawHTML = a.raw
        ? `<div class="section-title">
              Raw Line
              <button class="copy-btn" onclick="copy(${JSON.stringify(a.raw)}, this)">📋 Copy</button>
           </div>
           <pre class="raw">${esc(a.raw)}</pre>`
        : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0d1117;--surface:#161b22;--surface2:#21262d;
    --border:#30363d;--text:#e6edf3;--muted:#7d8590;--dim:#adbac7;
    --radius:8px;--mono:'JetBrains Mono','Fira Code',ui-monospace,monospace;
  }
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;line-height:1.5;font-size:13px;}

  /* ── Header ── */
  .header{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;margin-bottom:16px;border-left:4px solid ${color};}
  .header-top{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
  .sev{padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;background:${color}22;color:${color};border:1px solid ${color}44;}
  .fmt{padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;font-family:var(--mono);background:${fmtCol}15;color:${fmtCol};border:1px solid ${fmtCol}33;}
  .rule{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;background:var(--surface2);color:var(--dim);border:1px solid var(--border);}
  .time{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted);}
  .message{font-family:var(--mono);font-size:13px;color:var(--text);word-break:break-all;}

  /* ── Metadata table ── */
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:14px;}
  .meta-table{width:100%;border-collapse:collapse;}
  .meta-table tr{border-bottom:1px solid var(--border);}
  .meta-table tr:last-child{border-bottom:none;}
  .meta-table tr:hover{background:var(--surface2);}
  .meta-table td{padding:9px 14px;font-size:12px;}
  .meta-table td:first-child{color:var(--muted);font-weight:600;width:100px;font-family:var(--mono);font-size:11px;}
  .meta-table td:last-child{color:var(--dim);font-family:var(--mono);word-break:break-all;}
  .val-critical{color:#f85149;}
  .val-warn{color:#e3b341;}
  .val-info{color:#58a6ff;}
  .val-ok{color:#3fb950;}

  /* ── Fields ── */
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;}
  .chip{display:flex;gap:6px;align-items:baseline;background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:5px 10px;}
  .chip-k{font-family:var(--mono);font-size:10px;color:#58a6ff;font-weight:700;flex-shrink:0;}
  .chip-v{font-family:var(--mono);font-size:11px;color:var(--dim);word-break:break-all;}

  /* ── Raw line ── */
  .raw{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px 14px;font-family:var(--mono);font-size:11px;color:var(--dim);white-space:pre-wrap;word-break:break-all;line-height:1.6;}

  /* ── Copy button ── */
  .copy-btn{padding:2px 9px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface2);color:var(--muted);transition:all .15s;}
  .copy-btn:hover{background:#21262d;color:var(--text);}
  .copy-btn.ok{background:#3fb95022;color:#3fb950;border-color:#3fb95055;}
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="header-top">
    <span class="sev">${esc(a.severity)}</span>
    <span class="fmt">${(a.format || 'text').toUpperCase()}</span>
    <span class="rule">${esc(a.rule)}</span>
    <span class="time">${esc(time)}</span>
  </div>
  <div class="message">${esc(a.message)}</div>
</div>

<!-- Metadata -->
<div class="card">
  <table class="meta-table">
    <tr><td>severity</td><td class="val-${a.severity === 'CRITICAL' ? 'critical' : a.severity === 'WARN' ? 'warn' : 'info'}">${esc(a.severity)}</td></tr>
    <tr><td>level</td><td>${esc(a.level || '—')}</td></tr>
    <tr><td>rule</td><td>${esc(a.rule)}</td></tr>
    <tr><td>format</td><td>${esc(a.format || '—')}</td></tr>
    <tr><td>source</td>
        <td>
          ${esc(a.source || '—')}
          ${a.source ? `<button class="copy-btn" style="margin-left:8px" onclick="copy(${JSON.stringify(a.source)}, this)">📋</button>` : ''}
        </td>
    </tr>
    <tr><td>time</td><td>${esc(a.time)}</td></tr>
  </table>
</div>

<!-- Parsed fields (JSON only) -->
${fieldsHTML}

<!-- Raw line -->
${rawHTML}

<script>
  const vscode = acquireVsCodeApi();

  function copy(text, btn) {
    vscode.postMessage({ command: 'copy', text });
    btn.textContent = '✅';
    btn.classList.add('ok');
    setTimeout(() => {
      btn.textContent = btn.textContent.includes('Copy') ? '📋 Copy' : '📋';
      btn.classList.remove('ok');
    }, 2000);
  }
</script>
</body>
</html>`;
}
function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=alertDetailPanel.js.map