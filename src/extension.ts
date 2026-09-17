import * as vscode from 'vscode';
import { createLogger } from './shared/logger';

export function activate(context: vscode.ExtensionContext): void {
  const logger = createLogger();
  context.subscriptions.push(
    logger,
    vscode.commands.registerCommand('contextKit.showOutput', () => logger.show()),
  );
  logger.info('Context Kit activated. Feature migration is pending.');
}
