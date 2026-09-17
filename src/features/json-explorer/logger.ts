import type { LogOutputChannel } from 'vscode';
let logger: LogOutputChannel | undefined;
export function setLogger(channel: LogOutputChannel | undefined): void {
  logger = channel;
}
export function logInfo(message: string): void {
  logger?.info(`[JSON Explorer] ${message}`);
}
export function logError(message: string, error: unknown): void {
  logger?.error(`[JSON Explorer] ${message}`, error instanceof Error ? error : String(error));
}
