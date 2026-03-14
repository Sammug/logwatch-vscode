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
exports.LogwatchStatusBar = void 0;
const vscode = __importStar(require("vscode"));
class LogwatchStatusBar {
    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = 'logwatch.openDashboard';
        this.setOffline();
        this.item.show();
    }
    setOffline() {
        this.item.text = '$(circle-slash) logwatch';
        this.item.tooltip = 'logwatch: not running — click to open dashboard';
        this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    setConnecting() {
        this.item.text = '$(loading~spin) logwatch';
        this.item.tooltip = 'logwatch: connecting…';
        this.item.color = undefined;
        this.item.backgroundColor = undefined;
    }
    setRunning(alertCount, criticalCount) {
        const icon = criticalCount > 0 ? '$(error)' : '$(pass)';
        const label = alertCount > 0
            ? `${alertCount} alert${alertCount !== 1 ? 's' : ''}`
            : 'watching';
        this.item.text = `${icon} logwatch: ${label}`;
        this.item.tooltip = `logwatch running — ${alertCount} alerts (${criticalCount} critical)\nClick to open dashboard`;
        this.item.color = criticalCount > 0
            ? new vscode.ThemeColor('errorForeground')
            : undefined;
        this.item.backgroundColor = criticalCount > 0
            ? new vscode.ThemeColor('statusBarItem.errorBackground')
            : undefined;
    }
    dispose() {
        this.item.dispose();
    }
}
exports.LogwatchStatusBar = LogwatchStatusBar;
//# sourceMappingURL=statusBar.js.map