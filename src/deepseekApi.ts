/**
 * HTTP client for the DeepSeek API balance endpoint.
 * Uses Node.js built-in `https` module — zero external dependencies.
 *
 * API docs: https://api-docs.deepseek.com/api/get-user-balance
 */

import * as https from 'https';

// ── Types ────────────────────────────────────────────────────────────────

export interface BalanceInfo {
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
  currency: string;
}

export interface BalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

export class AuthenticationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'NetworkError';
  }
}

// ── Constants ────────────────────────────────────────────────────────────

const BALANCE_URL = 'https://api.deepseek.com/user/balance';
const REQUEST_TIMEOUT_MS = 10_000;

// ── Client ───────────────────────────────────────────────────────────────

/**
 * Fetch the DeepSeek account balance.
 *
 * @param apiKey - DeepSeek API key
 * @throws {AuthenticationError} on 401
 * @throws {RateLimitError}      on 429
 * @throws {NetworkError}        on timeouts, DNS failures, or unexpected HTTP statuses
 */
export function fetchBalance(apiKey: string): Promise<BalanceResponse> {
  return new Promise<BalanceResponse>((resolve, reject) => {
    const url = new URL(BALANCE_URL);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: REQUEST_TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');

        if (res.statusCode === 401) {
          return reject(
            new AuthenticationError(
              'Invalid DeepSeek API key. Check your settings.'
            )
          );
        }

        if (res.statusCode === 429) {
          return reject(
            new RateLimitError(
              'DeepSeek API rate limit exceeded. Retrying later.'
            )
          );
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(
            new NetworkError(
              `DeepSeek API returned HTTP ${res.statusCode}: ${body.slice(0, 200)}`
            )
          );
        }

        try {
          const data: BalanceResponse = JSON.parse(body);
          resolve(data);
        } catch {
          reject(
            new NetworkError(
              `Failed to parse DeepSeek API response: ${body.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        reject(new NetworkError(`Network error: ${err.message}`));
      } else {
        reject(new NetworkError(`Request failed: ${err.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new NetworkError('DeepSeek API request timed out.'));
    });

    req.end();
  });
}
