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
exports.SSEClient = void 0;
const http = __importStar(require("http"));
const events_1 = require("events");
/**
 * SSEClient connects to the logwatch /api/events endpoint and emits
 * 'alert' events for each incoming alert. Reconnects automatically.
 */
class SSEClient extends events_1.EventEmitter {
    constructor(port) {
        super();
        this.destroyed = false;
        this.req = null;
        this.port = port;
    }
    connect() {
        if (this.destroyed) {
            return;
        }
        const options = {
            hostname: 'localhost',
            port: this.port,
            path: '/api/events',
            headers: { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache' }
        };
        const req = http.get(options, (res) => {
            if (res.statusCode !== 200) {
                this.emit('error', new Error(`SSE status ${res.statusCode}`));
                this.scheduleReconnect();
                return;
            }
            this.emit('connected');
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? ''; // keep incomplete last line
                let eventType = '';
                let dataLine = '';
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventType = line.slice(6).trim();
                    }
                    else if (line.startsWith('data:')) {
                        dataLine = line.slice(5).trim();
                    }
                    else if (line === '' && dataLine) {
                        if (eventType === 'alert') {
                            try {
                                const alert = JSON.parse(dataLine);
                                this.emit('alert', alert);
                            }
                            catch { /* malformed JSON — skip */ }
                        }
                        eventType = '';
                        dataLine = '';
                    }
                }
            });
            res.on('end', () => {
                if (!this.destroyed) {
                    this.scheduleReconnect();
                }
            });
            res.on('error', () => {
                if (!this.destroyed) {
                    this.scheduleReconnect();
                }
            });
        });
        req.on('error', () => {
            if (!this.destroyed) {
                this.scheduleReconnect();
            }
        });
        req.end();
        this.req = req;
    }
    disconnect() {
        this.destroyed = true;
        this.req?.destroy();
        this.req = null;
    }
    scheduleReconnect(ms = 3000) {
        this.emit('disconnected');
        setTimeout(() => {
            if (!this.destroyed) {
                this.connect();
            }
        }, ms);
    }
}
exports.SSEClient = SSEClient;
//# sourceMappingURL=sseClient.js.map