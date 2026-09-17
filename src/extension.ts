import * as vscode from 'vscode';
import { createLogger } from './shared/logger';
import { registerJsonExplorerFeature } from './features/json-explorer';
import { registerCopyAnchorFeature } from './features/copy-anchor';

export function activate(context: vscode.ExtensionContext): void {
  const logger = createLogger();
  context.subscriptions.push(
    logger,
    vscode.commands.registerCommand('contextKit.showOutput', () => logger.show()),
  );
  registerJsonExplorerFeature(context, logger);
  registerCopyAnchorFeature(context, logger);
  logger.info('Context Kit activated.');
}
