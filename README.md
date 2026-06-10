# Deepseek-balance-vscode

A VS Code extension that displays your DeepSeek API account balance in the status bar. Polls the DeepSeek balance endpoint at a configurable interval with in-memory caching.

## Features

- **Status bar display** — Shows your current DeepSeek balance right in the VS Code status bar: `$(dashboard) DeepSeek: $2.61`
- **Color-coded** — Green for normal balance, yellow for low balance (threshold configurable, default < $1), red for errors
- **Detailed tooltip** — Hover to see total balance, granted balance, topped-up amount, and last update time
- **Automatic refresh** — Polls every 5 minutes by default (configurable, minimum 30 seconds)
- **Manual refresh** — Run command `DeepSeek Balance: Refresh Now` to force an immediate fetch
- **Cached data** — Shows cached balance immediately on startup while fetching fresh data in the background
- **Graceful degradation** — On network errors, keeps showing the last known balance with a stale-data warning

## Prerequisites

- [VS Code](https://code.visualstudio.com/) ^1.85.0
- A [DeepSeek API key](https://platform.deepseek.com/api_keys)

## Installation

1. Download the `.vsix` file from the [releases page](https://github.com/MrGaang/Deepseek-balance-vscode/releases) (or build from source — see [Development](#development)).
2. In VS Code, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
   ```
   Extensions: Install from VSIX...
   ```
3. Select the `.vsix` file and click **Install**.

## Getting a DeepSeek API Key

1. Go to [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Sign in or create a DeepSeek account
3. Click **Create API key**
4. Copy the key (starts with `sk-...`)
5. Paste it into the extension when prompted (see below)

## Setting Your API Key

There are three ways to set or change your DeepSeek API key:

### Method 1 — Click the status bar (easiest)

1. If no key is configured, the status bar shows `$(key) DeepSeek: Set API Key`
2. **Click** the status bar item
3. An input box appears — paste your `sk-...` key and press Enter

### Method 2 — Command Palette

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **DeepSeek Balance: Set API Key**
3. Paste your API key into the secure input box and press Enter

### Method 3 — VS Code Settings UI

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for `deepseek` (or `DeepSeek Balance`)
3. Find the **DeepSeek Balance** section
4. Click **Edit in settings.json** or use the **DeepSeek Balance: Set API Key** command from Method 2

> **Security note:** The API key is stored securely using VS Code's [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage), which uses the OS-level credential manager (Windows Credential Manager / macOS Keychain / Linux libsecret). It is **not** stored in plain text in `settings.json`.

### Changing Your API Key

Just repeat any of the methods above with your new key. The old key is automatically overwritten and the cache is cleared, triggering an immediate refresh with the new key.

## Usage

Once installed and configured with a valid API key, the extension works automatically:

| Status Bar Shows | What It Means |
|---|---|
| `$(dashboard) DeepSeek: $5.00` | Normal — balance available and above low balance threshold (default $1) |
| `$(dashboard) DeepSeek: $0.42` | Low balance (below threshold) — warning color |
| `$(key) DeepSeek: Set API Key` | No API key configured — click to set |
| `$(error) DeepSeek: Error` | Fetch failed — hover to see error details |

**Hover** over the status bar item to see the full tooltip:

```
DeepSeek API Balance

Total: $2.61
Granted: $0.00
Topped up: $2.61
Available: Yes

Updated: 2 min ago
```

## Commands

| Command ID | Title | How to Access |
|---|---|---|
| `deepseekBalance.refresh` | DeepSeek Balance: Refresh Now | Command Palette, or assign a keybinding |
| `deepseekBalance.configure` | DeepSeek Balance: Set API Key | Command Palette, or click the status bar item when no key is set |

## Settings

| Setting ID | Type | Default | Min | Description |
|---|---|---|---|---|---|
| `deepseekBalance.refreshInterval` | `number` | `300` | `30` | Refresh interval in seconds (5 min default) |
| `deepseekBalance.lowBalanceThreshold` | `number` | `1` | `0` | Balance threshold in USD; status bar turns yellow when balance drops below this value (set to `0` to disable) |

To change the refresh interval:

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for `deepseekBalance.refreshInterval`
3. Set a value between 30 and 3600 seconds

To change the low balance threshold:

1. Open Settings (`Ctrl+,` / `Cmd+,`)
2. Search for `deepseekBalance.lowBalanceThreshold`
3. Set a value in USD (e.g., `5` to warn when balance drops below $5, or `0` to disable the yellow warning)

## Development

```bash
# Clone the repository
git clone <repo-url>
cd deepseek-balance

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Launch extension in debug mode
# Press F5 in VS Code or run the "Extension" launch configuration
```

### Packaging

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Package the extension
vsce package

# Output: deepseek-balance-checker-0.0.3.vsix
```

## Architecture

```
src/
├── extension.ts          # Entry point — activate/deactivate, commands, polling
├── statusBarManager.ts   # Status bar item, formatting, color coding
├── deepseekApi.ts        # HTTP client for GET /user/balance
├── config.ts             # VS Code settings reader
└── cache.ts              # In-memory cache with staleness tracking
```

## License

MIT
