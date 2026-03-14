import * as vscode from 'vscode';

/**
 * DashboardPanel opens the logwatch web dashboard inside a VS Code WebView tab.
 * It simply loads the logwatch HTTP server in an iframe — zero duplication.
 */
export class DashboardPanel {
    private static current: DashboardPanel | undefined;
    private readonly panel: vscode.WebviewPanel;

    static show(port: number, extensionUri: vscode.Uri): void {
        if (DashboardPanel.current) {
            DashboardPanel.current.panel.reveal();
            return;
        }
        DashboardPanel.current = new DashboardPanel(port, extensionUri);
    }

    private constructor(port: number, extensionUri: vscode.Uri) {
        this.panel = vscode.window.createWebviewPanel(
            'logwatch.dashboard',
            'logwatch Dashboard',
            vscode.ViewColumn.Two,
            {
                enableScripts:          true,
                retainContextWhenHidden: true,
                localResourceRoots:     [extensionUri]
            }
        );

        this.panel.webview.html = this.getHTML(port);

        this.panel.onDidDispose(() => {
            DashboardPanel.current = undefined;
        });
    }

    private getHTML(port: number): string {
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
