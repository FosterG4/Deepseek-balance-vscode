/**
 * VS Code settings reader for the DeepSeek Balance extension.
 * Reads configuration from `deepseekBalance.*` namespace.
 */

import * as vscode from 'vscode';

export interface ExtensionConfig {
  /** Refresh interval in seconds (default: 300, min: 30) */
  refreshIntervalSeconds: number;
}

const CONFIG_SECTION = 'deepseekBalance';

/**
 * Read the current extension configuration from VS Code settings.
 */
export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

  return {
    refreshIntervalSeconds: Math.max(
      30,
      config.get<number>('refreshInterval', 300)
    ),
  };
}

/**
 * Read the API key from VS Code SecretStorage.
 */
export async function getApiKey(context: vscode.ExtensionContext): Promise<string> {
  return (await context.secrets.get('deepseekBalance.apiKey')) ?? '';
}

/**
 * Store the API key in VS Code SecretStorage.
 */
export async function setApiKey(context: vscode.ExtensionContext, key: string): Promise<void> {
  await context.secrets.store('deepseekBalance.apiKey', key);
}

/**
 * Returns the refresh interval in milliseconds.
 */
export function getRefreshIntervalMs(): number {
  return getConfig().refreshIntervalSeconds * 1000;
}

/**
 * Whether the user has configured an API key (stored in SecretStorage).
 */
export async function hasApiKey(context: vscode.ExtensionContext): Promise<boolean> {
  const key = await getApiKey(context);
  return key.length > 0;
}
