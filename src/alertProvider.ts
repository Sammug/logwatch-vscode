import * as vscode from 'vscode';
import { Alert } from './types';

// ── Icons ────────────────────────────────────────────────────────────────────
const SEV_ICON: Record<string, vscode.ThemeIcon> = {
    CRITICAL: new vscode.ThemeIcon('error',   new vscode.ThemeColor('errorForeground')),
    WARN:     new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground')),
    INFO:     new vscode.ThemeIcon('info',    new vscode.ThemeColor('editorInfo.foreground')),
};

const FMT_ICON: Record<string, string> = {
    json:      '{ }',
    syslog:    'SYS',
    apache:    'HTT',
    plaintext: 'TXT',
};

// ── Tree item ────────────────────────────────────────────────────────────────
export class AlertItem extends vscode.TreeItem {
    constructor(public readonly alert: Alert) {
        super(alert.message, vscode.TreeItemCollapsibleState.None);

        this.contextValue  = 'alert';
        this.iconPath      = SEV_ICON[alert.severity] ?? SEV_ICON['INFO'];
        this.description   = `[${alert.rule}]  ${fmtTime(alert.time)}`;
        this.tooltip       = buildTooltip(alert);

        // Click → open detail panel
        this.command = {
            command:   'logwatch.showDetail',
            title:     'Show Alert Detail',
            arguments: [this]
        };
    }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export class AlertProvider implements vscode.TreeDataProvider<AlertItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<AlertItem | undefined | void>();
    readonly onDidChangeTreeData  = this._onDidChangeTreeData.event;

    private alerts: Alert[] = [];
    private maxAlerts: number;

    constructor(maxAlerts = 200) {
        this.maxAlerts = maxAlerts;
    }

    // Called by SSE client on new alert
    push(alert: Alert): void {
        this.alerts.unshift(alert);
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.pop();
        }
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        this.alerts = [];
        this._onDidChangeTreeData.fire();
    }

    get count(): number { return this.alerts.length; }

    criticalCount(): number {
        return this.alerts.filter(a => a.severity === 'CRITICAL').length;
    }

    // TreeDataProvider impl
    getTreeItem(element: AlertItem): vscode.TreeItem { return element; }

    getChildren(): AlertItem[] {
        if (!this.alerts.length) {
            const empty = new vscode.TreeItem('No alerts yet — watching for logs…');
            empty.iconPath = new vscode.ThemeIcon('eye');
            return [empty as AlertItem];
        }
        return this.alerts.map(a => new AlertItem(a));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}

function buildTooltip(a: Alert): vscode.MarkdownString {
    const md = new vscode.MarkdownString('', true);
    md.isTrusted = true;

    md.appendMarkdown(`**${a.severity}** · \`${a.rule}\`\n\n`);
    md.appendMarkdown(`| | |\n|---|---|\n`);
    md.appendMarkdown(`| **time** | ${a.time} |\n`);
    md.appendMarkdown(`| **level** | ${a.level} |\n`);
    md.appendMarkdown(`| **format** | ${FMT_ICON[a.format] ?? a.format} |\n`);
    md.appendMarkdown(`| **source** | \`${a.source}\` |\n`);

    // Extra fields from JSON logs
    if (a.fields && Object.keys(a.fields).length) {
        md.appendMarkdown(`\n**Parsed fields:**\n`);
        for (const [k, v] of Object.entries(a.fields)) {
            md.appendMarkdown(`- \`${k}\`: ${v}\n`);
        }
    }

    md.appendMarkdown(`\n---\n\`\`\`\n${a.raw || a.message}\n\`\`\``);
    return md;
}
