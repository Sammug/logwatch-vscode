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
exports.DashboardPanel = void 0;
const vscode = __importStar(require("vscode"));
/**
 * DashboardPanel opens the logwatch web dashboard inside a VS Code WebView tab.
 * It simply loads the logwatch HTTP server in an iframe — zero duplication.
 */
class DashboardPanel {
    static show(port, extensionUri) {
        if (DashboardPanel.current) {
            DashboardPanel.current.panel.reveal();
            return;
        }
        DashboardPanel.current = new DashboardPanel(port, extensionUri);
    }
    constructor(port, extensionUri) {
        this.panel = vscode.window.createWebviewPanel('logwatch.dashboard', 'logwatch Dashboard', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [extensionUri]
        });
        this.panel.webview.html = this.getHTML(port);
        this.panel.onDidDispose(() => {
            DashboardPanel.current = undefined;
        });
    }
    getHTML(port) {
        // VS Code WebView can't load external http:// directly —
        // we use a relay page that fetches via message passing.
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>logwatch Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d1117; color: #e6edf3; font-family: -apple-system, sans-serif; height: 100vh; display: flex; flex-direction: column; }
    .bar { padding: 10px 16px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; align-items: center; justify-content: space-between; }
    .title { font-size: 13px; font-weight: 600; color: #58a6ff; }
    .open-btn { padding: 4px 12px; border-radius: 5px; background: #238636; color: #fff; border: none; font-size: 12px; cursor: pointer; text-decoration: none; }
    .open-btn:hover { background: #2ea043; }
    iframe { flex: 1; width: 100%; border: none; }
    .offline { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #7d8590; }
    .offline h2 { color: #e6edf3; font-size: 16px; }
    .retry { padding: 6px 16px; border-radius: 6px; background: #21262d; color: #e6edf3; border: 1px solid #30363d; cursor: pointer; font-size: 13px; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="title">⚡ logwatch dashboard</span>
    <a class="open-btn" href="http://localhost:${port}" target="_blank">Open in Browser ↗</a>
  </div>
  <div id="content" style="display:flex;flex:1;flex-direction:column">
    <div class="offline" id="offline">
      <div style="font-size:32px">👁</div>
      <h2>Dashboard not reachable</h2>
      <p>Start logwatch to see the dashboard</p>
      <button class="retry" onclick="tryLoad()">Try again</button>
    </div>
    <iframe id="frame" src="" style="display:none;flex:1"></iframe>
  </div>
  <script>
    const PORT = ${port};
    function tryLoad() {
      const frame = document.getElementById('frame');
      const offline = document.getElementById('offline');
      fetch('http://localhost:' + PORT + '/api/status')
        .then(r => r.json())
        .then(() => {
          frame.src = 'http://localhost:' + PORT;
          frame.style.display = 'flex';
          offline.style.display = 'none';
        })
        .catch(() => {
          frame.style.display = 'none';
          offline.style.display = 'flex';
        });
    }
    tryLoad();
    setInterval(tryLoad, 5000);
  </script>
</body>
</html>`;
    }
}
exports.DashboardPanel = DashboardPanel;
//# sourceMappingURL=dashboardPanel.js.map