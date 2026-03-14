# logwatch for VS Code

Real-time log parsing and alerting inside VS Code — powered by the [logwatch](https://github.com/Sammug/logwatch) engine.

![VS Code extension screenshot](https://raw.githubusercontent.com/Sammug/logwatch-vscode/master/media/screenshot.png)

## Features

- **Live alert sidebar** — alerts stream in real-time via SSE from the logwatch daemon
- **Click any alert** → opens a full detail panel with parsed fields, metadata, and raw log line
- **Status bar** — shows alert count at a glance; turns red on CRITICAL alerts
- **CRITICAL notifications** — popup with "Open Dashboard" action for urgent alerts
- **Dashboard WebView** — view the logwatch web dashboard inside VS Code
- **Right-click context menu** — View Details / Copy Message / Copy Raw Line

## Requirements

You need the **logwatch binary** running as a daemon. Get it from:

```
https://github.com/Sammug/logwatch
```

Build and start:
```bash
git clone https://github.com/Sammug/logwatch
cd logwatch
go build -o /tmp/logwatch ./cmd/logwatch
/tmp/logwatch start config/example.ini
```

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `logwatch.executablePath` | _(auto-detect)_ | Path to the logwatch binary |
| `logwatch.configPath` | _(auto-detect)_ | Path to your `.ini` config file |
| `logwatch.dashboardPort` | `9090` | logwatch dashboard port |
| `logwatch.autoStart` | `true` | Connect automatically on workspace open |
| `logwatch.maxAlerts` | `200` | Max alerts to keep in the panel |

## Usage

1. Start the logwatch daemon (see Requirements above)
2. Open the **👁 logwatch** panel in the Activity Bar
3. Alerts appear live as they are matched by logwatch rules
4. **Click** any alert to see full details
5. Use `logwatch: Open Dashboard` command to view the web dashboard

## Supported Log Formats

logwatch auto-detects:
- **JSON** structured logs (matches on any field)
- **Syslog** (`/var/log/syslog`, journald output)
- **Apache / Nginx** combined access logs
- **Plaintext** — any other log format

## Commands

| Command | Description |
|---|---|
| `logwatch: Start` | Start the logwatch daemon |
| `logwatch: Stop` | Stop the logwatch daemon |
| `logwatch: Open Dashboard` | Open the web dashboard in VS Code |
| `logwatch: Clear Alerts` | Clear all alerts from the panel |

## Pipe Mode (stdin)

Pipe any tool's output directly into logwatch:
```bash
adb logcat        | logwatch pipe android.ini --source adb --dashboard
gradle build 2>&1 | logwatch pipe gradle.ini
```

## License

MIT
