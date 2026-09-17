import * as vscode from 'vscode';
import { createLogger } from './shared/logger';
import { registerJsonExplorerFeature } from './features/json-explorer';

export function activate(context: vscode.ExtensionContext): void {
  const logger = createLogger();
  context.subscriptions.push(
    logger,
    vscode.commands.registerCommand('contextKit.showOutput', () => logger.show()),
  );
  registerJsonExplorerFeature(context, logger);
  logger.info('Context Kit activated.');
}
