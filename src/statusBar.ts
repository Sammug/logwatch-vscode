import * as vscode from 'vscode';

export class LogwatchStatusBar {
    private item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = 'logwatch.openDashboard';
        this.setOffline();
        this.item.show();
    }

    setOffline(): void {
        this.item.text        = '$(circle-slash) logwatch';
        this.item.tooltip     = 'logwatch: not running — click to open dashboard';
        this.item.color       = new vscode.ThemeColor('statusBarItem.warningForeground');
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }

    setConnecting(): void {
        this.item.text        = '$(loading~spin) logwatch';
        this.item.tooltip     = 'logwatch: connecting…';
        this.item.color       = undefined;
        this.item.backgroundColor = undefined;
    }

    setRunning(alertCount: number, criticalCount: number): void {
        const icon  = criticalCount > 0 ? '$(error)' : '$(pass)';
        const label = alertCount > 0
            ? `${alertCount} alert${alertCount !== 1 ? 's' : ''}`
            : 'watching';

        this.item.text        = `${icon} logwatch: ${label}`;
        this.item.tooltip     = `logwatch running — ${alertCount} alerts (${criticalCount} critical)\nClick to open dashboard`;
        this.item.color       = criticalCount > 0
            ? new vscode.ThemeColor('errorForeground')
            : undefined;
        this.item.backgroundColor = criticalCount > 0
            ? new vscode.ThemeColor('statusBarItem.errorBackground')
            : undefined;
    }

    dispose(): void {
        this.item.dispose();
    }
}
