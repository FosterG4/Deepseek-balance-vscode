/**
 * Manages the VS Code StatusBarItem for displaying DeepSeek balance.
 * Handles color coding, tooltip formatting, and state transitions.
 */

import * as vscode from 'vscode';
import type { BalanceResponse } from './deepseekApi';

export class StatusBarManager {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.name = 'DeepSeek Balance';
  }

  // ── Display Helpers ──────────────────────────────────────────────────

  /**
   * Format a number as currency (USD by default).
   * Accepts string or number since the DeepSeek API returns balance as strings.
   */
  private formatCurrency(amount: string | number): string {
    const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numeric.toFixed(2)}`;
  }

  /**
   * Compute a human-readable "time ago" string.
   */
  private timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min ago`;
  }

  /**
   * Build tooltip text from balance data.
   */
  private buildTooltip(balance: BalanceResponse, lastFetchedAt: number | null): string {
    const infos = balance.balance_infos;
    const primary = infos[0];
    const lines: string[] = [
      'DeepSeek API Balance',
      '',
      `Total: ${this.formatCurrency(primary?.total_balance ?? 0)}`,
      `Granted: ${this.formatCurrency(primary?.granted_balance ?? 0)}`,
      `Topped up: ${this.formatCurrency(primary?.topped_up_balance ?? 0)}`,
      `Available: ${balance.is_available ? 'Yes' : 'No'}`,
    ];

    if (lastFetchedAt) {
      lines.push('');
      lines.push(`Updated: ${this.timeAgo(lastFetchedAt)}`);
    }

    // Show additional balance info if multiple accounts
    if (infos.length > 1) {
      lines.push('');
      lines.push(`${infos.length - 1} other account(s)`);
    }

    return lines.join('\n');
  }

  // ── State Methods ────────────────────────────────────────────────────

  /**
   * Show the balance in the status bar with appropriate color.
   */
  updateBalance(balance: BalanceResponse, lastFetchedAt: number | null): void {
    const primary = balance.balance_infos[0];
    const total = parseFloat(primary?.total_balance ?? '0');

    this.item.text = `$(dashboard) DeepSeek: ${this.formatCurrency(total)}`;

    if (this.item.text.includes('stale')) {
      // Do nothing special for stale icon yet
    }

    this.item.tooltip = this.buildTooltip(balance, lastFetchedAt);

    // Color coding
    if (!balance.is_available) {
      this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (total < 1) {
      // Low balance warning (yellow)
      this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      // Normal — use default colors (reset)
      this.item.color = undefined;
      this.item.backgroundColor = undefined;
    }

    this.item.show();
  }

  /**
   * Show a loading/refreshing state.
   */
  updateLoading(): void {
    this.item.text = '$(sync~spin) DeepSeek: ...';
    this.item.tooltip = 'Fetching DeepSeek balance...';
    this.item.color = undefined;
    this.item.backgroundColor = undefined;
    this.item.show();
  }

  /**
   * Show an error state in the status bar.
   */
  updateError(message: string): void {
    this.item.text = '$(error) DeepSeek: Error';
    this.item.tooltip = `DeepSeek Balance — Error\n\n${message}`;
    this.item.color = new vscode.ThemeColor('statusBarItem.errorForeground');
    this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    this.item.show();
  }

  /**
   * Prompt the user to configure the API key.
   * The status bar item is clickable and opens settings.
   */
  updateNoKey(): void {
    this.item.text = '$(key) DeepSeek: Set API Key';
    this.item.tooltip = 'Click to configure your DeepSeek API key in settings.';
    this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
    this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.item.command = 'deepseekBalance.configure';
    this.item.show();
  }

  /**
   * Update tooltip to indicate cached (possibly stale) data.
   */
  updateStale(lastFetchedAt: number | null): void {
    if (!this.item.text) return;
    const existingTooltip = this.item.tooltip;
    const staleNote = lastFetchedAt
      ? `\n⚠ Data may be outdated (last fetch: ${this.timeAgo(lastFetchedAt)}). Retrying...`
      : '\n⚠ Data may be outdated. Retrying...';

    if (typeof existingTooltip === 'string') {
      this.item.tooltip = existingTooltip + staleNote;
    } else {
      this.item.tooltip = `DeepSeek Balance — Stale Data${staleNote}`;
    }

    this.item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
    this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  /** Show the status bar item. */
  show(): void {
    this.item.show();
  }

  /** Hide the status bar item. */
  hide(): void {
    this.item.hide();
  }

  /** Dispose the status bar item (cleanup). */
  dispose(): void {
    this.item.dispose();
  }
}
