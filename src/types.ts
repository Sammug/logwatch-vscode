export interface Alert {
    time:     string;
    severity: 'CRITICAL' | 'WARN' | 'INFO';
    rule:     string;
    level:    string;
    source:   string;
    message:  string;
    format:   string;
    raw:      string;
    fields:   Record<string, string>;
}

export interface DaemonStatus {
    pid:         number;
    uptime:      string;
    config_path: string;
    files:       string[];
    rule_count:  number;
    alert_count: number;
}
