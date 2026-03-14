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
exports.AlertProvider = exports.AlertItem = void 0;
const vscode = __importStar(require("vscode"));
// ── Icons ────────────────────────────────────────────────────────────────────
const SEV_ICON = {
    CRITICAL: new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground')),
    WARN: new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground')),
    INFO: new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground')),
};
const FMT_ICON = {
    json: '{ }',
    syslog: 'SYS',
    apache: 'HTT',
    plaintext: 'TXT',
};
// ── Tree item ────────────────────────────────────────────────────────────────
class AlertItem extends vscode.TreeItem {
    constructor(alert) {
        super(alert.message, vscode.TreeItemCollapsibleState.None);
        this.alert = alert;
        this.contextValue = 'alert';
        this.iconPath = SEV_ICON[alert.severity] ?? SEV_ICON['INFO'];
        this.description = `[${alert.rule}]  ${fmtTime(alert.time)}`;
        this.tooltip = buildTooltip(alert);
        // Click → copy raw line to clipboard
        this.command = {
            command: 'logwatch.copyRaw',
            title: 'Copy Raw Line',
            arguments: [this]
        };
    }
}
exports.AlertItem = AlertItem;
// ── Provider ─────────────────────────────────────────────────────────────────
class AlertProvider {
    constructor(maxAlerts = 200) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.alerts = [];
        this.maxAlerts = maxAlerts;
    }
    // Called by SSE client on new alert
    push(alert) {
        this.alerts.unshift(alert);
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.pop();
        }
        this._onDidChangeTreeData.fire();
    }
    clear() {
        this.alerts = [];
        this._onDidChangeTreeData.fire();
    }
    get count() { return this.alerts.length; }
    criticalCount() {
        return this.alerts.filter(a => a.severity === 'CRITICAL').length;
    }
    // TreeDataProvider impl
    getTreeItem(element) { return element; }
    getChildren() {
        if (!this.alerts.length) {
            const empty = new vscode.TreeItem('No alerts yet — watching for logs…');
            empty.iconPath = new vscode.ThemeIcon('eye');
            return [empty];
        }
        return this.alerts.map(a => new AlertItem(a));
    }
}
exports.AlertProvider = AlertProvider;
// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}
function buildTooltip(a) {
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
//# sourceMappingURL=alertProvider.js.map