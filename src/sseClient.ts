import * as http from 'http';
import { EventEmitter } from 'events';
import { Alert } from './types';

/**
 * SSEClient connects to the logwatch /api/events endpoint and emits
 * 'alert' events for each incoming alert. Reconnects automatically.
 */
export class SSEClient extends EventEmitter {
    private port:      number;
    private destroyed: boolean = false;
    private req:       http.ClientRequest | null = null;

    constructor(port: number) {
        super();
        this.port = port;
    }

    connect(): void {
        if (this.destroyed) { return; }

        const options: http.RequestOptions = {
            hostname: 'localhost',
            port:     this.port,
            path:     '/api/events',
            headers:  { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache' }
        };

        const req = http.get(options, (res) => {
            if (res.statusCode !== 200) {
                this.emit('error', new Error(`SSE status ${res.statusCode}`));
                this.scheduleReconnect();
                return;
            }

            this.emit('connected');
            let buffer = '';

            res.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';   // keep incomplete last line

                let eventType = '';
                let dataLine  = '';

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventType = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        dataLine = line.slice(5).trim();
                    } else if (line === '' && dataLine) {
                        if (eventType === 'alert') {
                            try {
                                const alert: Alert = JSON.parse(dataLine);
                                this.emit('alert', alert);
                            } catch { /* malformed JSON — skip */ }
                        }
                        eventType = '';
                        dataLine  = '';
                    }
                }
            });

            res.on('end', () => {
                if (!this.destroyed) { this.scheduleReconnect(); }
            });

            res.on('error', () => {
                if (!this.destroyed) { this.scheduleReconnect(); }
            });
        });

        req.on('error', () => {
            if (!this.destroyed) { this.scheduleReconnect(); }
        });

        req.end();
        this.req = req;
    }

    disconnect(): void {
        this.destroyed = true;
        this.req?.destroy();
        this.req = null;
    }

    private scheduleReconnect(ms = 3000): void {
        this.emit('disconnected');
        setTimeout(() => {
            if (!this.destroyed) { this.connect(); }
        }, ms);
    }
}
