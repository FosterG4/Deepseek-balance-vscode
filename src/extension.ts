/**
 * DeepSeek Balance — VS Code Extension
 *
 * Shows your DeepSeek API account balance in the status bar with
 * in-memory caching, configurable polling, and automatic refresh.
 */

import * as vscode from 'vscode';
import { BalanceCache } from './cache';
import { getApiKey, setApiKey, hasApiKey, getRefreshIntervalMs } from './config';
import { fetchBalance } from './deepseekApi';
import { StatusBarManager } from './statusBarManager';

// ── Module-level state ───────────────────────────────────────────────────

let cache: BalanceCache;
let statusBar: StatusBarManager;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let isDisposed = false;
let extensionContext: vscode.ExtensionContext;

// ── Core Refresh Logic ───────────────────────────────────────────────────

/**
 * Fetch the balance and update the status bar.
 * Uses the cache to avoid duplicate in-flight requests.
 */
async function refreshBalance(force = false): Promise<void> {
  if (isDisposed) return;

  // Don't start a new fetch if one is already in progress (unless forced)
  if (!force && cache.isFetchingInProgress()) return;

  const apiKey = await getApiKey(extensionContext);

  if (!apiKey) {
    statusBar.updateNoKey();
    return;
  }

  // If cache is still valid and not forced, skip
  if (!force && cache.hasData() && !cache.isExpired(getRefreshIntervalMs())) {
    return;
  }

  cache.setFetching(true);
  statusBar.updateLoading();

  try {
    const balance = await fetchBalance(apiKey);
    cache.set(balance);
    statusBar.updateBalance(balance, cache.getLastFetchedAt());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // If we have cached data, keep showing it but mark as stale
    if (cache.hasData()) {
      cache.markStale();
      const data = cache.get()!;
      statusBar.updateBalance(data, cache.getLastFetchedAt());
      statusBar.updateStale(cache.getLastFetchedAt());
    } else {
      statusBar.updateError(message);
    }
  } finally {
    cache.setFetching(false);
  }
}

// ── Polling ──────────────────────────────────────────────────────────────

function startPolling(): void {
  stopPolling();
  pollingTimer = setInterval(() => {
    refreshBalance(false);
  }, getRefreshIntervalMs());
}

function stopPolling(): void {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// ── Activation ───────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  isDisposed = false;
  extensionContext = context;

  // Initialize singletons
  cache = new BalanceCache();
  statusBar = new StatusBarManager();

  // ── Register Commands ────────────────────────────────────────────────

  const refreshCmd = vscode.commands.registerCommand(
    'deepseekBalance.refresh',
    () => refreshBalance(true)
  );

  const configureCmd = vscode.commands.registerCommand(
    'deepseekBalance.configure',
    async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your DeepSeek API key',
        password: true,
        placeHolder: 'sk-...',
        ignoreFocusOut: true,
        validateInput: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'API key cannot be empty';
          }
          return null;
        },
      });

      if (key) {
        await setApiKey(context, key.trim());
        vscode.window.showInformationMessage('DeepSeek API key saved securely.');
        cache.clear();
        refreshBalance(true);
      }
    }
  );

  context.subscriptions.push(refreshCmd, configureCmd);

  // ── Config Change Listener ───────────────────────────────────────────

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (!e.affectsConfiguration('deepseekBalance')) return;

    // Restart polling with new interval
    startPolling();

    // Force refresh
    cache.clear();
    refreshBalance(true);
  });

  context.subscriptions.push(configListener);

  // ── Initial Load ─────────────────────────────────────────────────────

  // Show cached data immediately if available (from a previous fetch in this session)
  if (cache.hasData()) {
    const data = cache.get()!;
    statusBar.updateBalance(data, cache.getLastFetchedAt());
  }

  // Start polling
  startPolling();

  // Trigger first fetch
  refreshBalance(false);

  // Cleanup on deactivation
  context.subscriptions.push({
    dispose: () => {
      isDisposed = true;
      stopPolling();
      statusBar.dispose();
    },
  });
}

// ── Deactivation ─────────────────────────────────────────────────────────

export function deactivate(): void {
  isDisposed = true;
  stopPolling();
  statusBar?.dispose();
}
