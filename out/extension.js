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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sseClient_1 = require("./sseClient");
const alertProvider_1 = require("./alertProvider");
const statusBar_1 = require("./statusBar");
const dashboardPanel_1 = require("./dashboardPanel");
let sse;
let provider;
let statusBar;
function activate(context) {
    const cfg = () => vscode.workspace.getConfiguration('logwatch');
    // ── Init provider + status bar ──────────────────────────────────
    provider = new alertProvider_1.AlertProvider(cfg().get('maxAlerts', 200));
    statusBar = new statusBar_1.LogwatchStatusBar();
    const treeView = vscode.window.createTreeView('logwatch.alerts', {
        treeDataProvider: provider,
        showCollapseAll: false,
    });
    // ── Connect to running daemon (if any) ──────────────────────────
    startSSE(cfg().get('dashboardPort', 9090));
    // ── Commands ────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('logwatch.start', async () => {
        const execPath = resolveExecutable(cfg().get('executablePath', ''));
        if (!execPath) {
            vscode.window.showErrorMessage('logwatch: binary not found. Set logwatch.executablePath in settings.');
            return;
        }
        const configPath = resolveConfig(cfg().get('configPath', ''));
        if (!configPath) {
            const picked = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                filters: { 'INI config': ['ini'] },
                openLabel: 'Select logwatch config'
            });
            if (!picked?.length) {
                return;
            }
        }
        const port = cfg().get('dashboardPort', 9090);
        const config = configPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath + '/logwatch.ini';
        const terminal = vscode.window.createTerminal({
            name: 'logwatch',
            iconPath: new vscode.ThemeIcon('eye'),
        });
        terminal.sendText(`"${execPath}" start "${config}"`);
        terminal.show(true);
        setTimeout(() => startSSE(port), 2000);
        vscode.window.showInformationMessage('logwatch starting…');
    }), vscode.commands.registerCommand('logwatch.stop', async () => {
        const execPath = resolveExecutable(cfg().get('executablePath', ''));
        if (execPath) {
            const terminal = vscode.window.createTerminal({ name: 'logwatch' });
            terminal.sendText(`"${execPath}" stop`);
        }
        sse?.disconnect();
        statusBar?.setOffline();
        vscode.window.showInformationMessage('logwatch stopped.');
    }), vscode.commands.registerCommand('logwatch.openDashboard', () => {
        dashboardPanel_1.DashboardPanel.show(cfg().get('dashboardPort', 9090), context.extensionUri);
    }), vscode.commands.registerCommand('logwatch.clearAlerts', () => {
        provider?.clear();
        statusBar?.setRunning(0, 0);
    }), vscode.commands.registerCommand('logwatch.copyMessage', async (item) => {
        const text = item?.alert?.message;
        if (text) {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Message copied.');
        }
    }), vscode.commands.registerCommand('logwatch.copyRaw', async (item) => {
        const text = item?.alert?.raw || item?.alert?.message;
        if (text) {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Raw line copied.');
        }
    }), treeView, { dispose: () => { sse?.disconnect(); statusBar?.dispose(); } });
    // ── Auto-start if daemon already running ────────────────────────
    if (cfg().get('autoStart', true)) {
        startSSE(cfg().get('dashboardPort', 9090));
    }
}
function deactivate() {
    sse?.disconnect();
}
// ── Helpers ────────────────────────────────────────────────────────────────
function startSSE(port) {
    sse?.disconnect();
    sse = new sseClient_1.SSEClient(port);
    sse.on('connected', () => {
        statusBar?.setRunning(provider?.count ?? 0, provider?.criticalCount() ?? 0);
        vscode.window.setStatusBarMessage('$(pass) logwatch connected', 3000);
    });
    sse.on('alert', (alert) => {
        provider?.push(alert);
        statusBar?.setRunning(provider?.count ?? 0, provider?.criticalCount() ?? 0);
        // Show notification for CRITICAL alerts
        if (alert.severity === 'CRITICAL') {
            vscode.window.showWarningMessage(`🚨 logwatch [${alert.rule}]: ${alert.message}`, 'Open Dashboard').then(action => {
                if (action === 'Open Dashboard') {
                    vscode.commands.executeCommand('logwatch.openDashboard');
                }
            });
        }
    });
    sse.on('disconnected', () => {
        statusBar?.setOffline();
    });
    sse.connect();
}
function resolveExecutable(configured) {
    if (configured && fs.existsSync(configured)) {
        return configured;
    }
    // Common locations
    const candidates = [
        '/tmp/logwatch',
        '/usr/local/bin/logwatch',
        path.join(process.env.HOME ?? '', '.local/bin/logwatch'),
    ];
    return candidates.find(p => fs.existsSync(p));
}
function resolveConfig(configured) {
    if (configured && fs.existsSync(configured)) {
        return configured;
    }
    // Look in workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
        const candidates = [
            path.join(workspaceRoot, 'logwatch.ini'),
            path.join(workspaceRoot, '.logwatch.ini'),
            path.join(workspaceRoot, 'config', 'logwatch.ini'),
        ];
        return candidates.find(p => fs.existsSync(p));
    }
    return undefined;
}
//# sourceMappingURL=extension.js.map