import { clearPendingOpens } from './core/pendingOpens';
import * as vscode from 'vscode';
import {
  ConvertToJsonCodeLensProvider,
  NestedJsonCodeLensProvider,
} from './providers/codeLensProvider';
import {
  CONVERT_TO_JSON_COMMAND_ID,
  convertInPlaceToJson,
  formatDocumentIfPossible,
  toggleActiveDocument,
} from './commands';
import { isWholeDocumentPaste, shouldAutoFormatDocument } from './editorOps';
import { NestedJsonHoverProvider } from './providers/hoverProvider';
import { setLogger, logError, logInfo } from './logger';
import {
  OpenKind,
  PARSE_BY_TOKEN_COMMAND_ID,
  PARSE_COMMAND_ID,
  parseNestedJsonCommand,
  takePendingOpen,
} from './parseNestedCommand';

export function registerJsonExplorerFeature(
  context: vscode.ExtensionContext,
  logger: vscode.LogOutputChannel,
): void {
  const formatInFlight = new Set<string>();
  setLogger(logger);
  context.subscriptions.push({
    dispose: () => {
      formatInFlight.clear();
      clearPendingOpens();
      setLogger(undefined);
    },
  });
  logInfo('Activated.');

  const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const documentKey = event.document.uri.toString();
    // Short-circuit any change events fired while we are mid-format on the same document.
    // This catches our own applyEdit echo, language-switch echoes, and any user keystrokes
    // landing during the async format window.
    if (formatInFlight.has(documentKey)) {
      return;
    }
    if (!shouldAutoFormatDocument(event.document) || !isWholeDocumentPaste(event)) {
      return;
    }

    formatInFlight.add(documentKey);
    formatDocumentIfPossible(event.document)
      .catch((error: unknown) => {
        logError('Failed to format pasted JSON.', error);
      })
      .finally(() => {
        formatInFlight.delete(documentKey);
      });
  });

  const toggleDisposable = vscode.commands.registerCommand(
    'contextKit.jsonExplorer.toggleCurrentDocument',
    () => {
      return toggleActiveDocument().then(undefined, (error: unknown) => {
        logError('Failed to toggle current document.', error);
      });
    },
  );

  const parseNestedDisposable = vscode.commands.registerCommand(
    PARSE_COMMAND_ID,
    (content: string, keyPath: string, kind: OpenKind = 'json') => {
      return parseNestedJsonCommand(content, keyPath, kind).then(undefined, (error: unknown) => {
        logError('Failed to open parsed content document.', error);
      });
    },
  );

  // Hover links can't carry large content through their command URI, so the
  // hover stashes the content and passes only a token; trade it back here.
  const parseByTokenDisposable = vscode.commands.registerCommand(
    PARSE_BY_TOKEN_COMMAND_ID,
    (token: string) => {
      const open = takePendingOpen(token);
      if (!open) {
        logError(`Hover open token expired or missing (token=${token}).`, token);
        void vscode.window.showWarningMessage(
          'Context Kit: JSON Explorer: 内容已过期，请重新悬停后再点击打开。',
        );
        return;
      }
      return parseNestedJsonCommand(open.content, open.keyPath, open.kind).then(
        undefined,
        (error: unknown) => {
          logError('Failed to open parsed content document.', error);
        },
      );
    },
  );

  const convertDisposable = vscode.commands.registerCommand(
    CONVERT_TO_JSON_COMMAND_ID,
    (uriString?: string) => {
      return convertInPlaceToJson(uriString).then(undefined, (error: unknown) => {
        logError('Failed to convert document to JSON.', error);
      });
    },
  );

  const jsonSelector: vscode.DocumentSelector = [{ language: 'json' }, { language: 'jsonc' }];

  const hoverDisposable = vscode.languages.registerHoverProvider(
    jsonSelector,
    new NestedJsonHoverProvider(),
  );

  const codeLensDisposable = vscode.languages.registerCodeLensProvider(
    jsonSelector,
    new NestedJsonCodeLensProvider(),
  );

  const convertProvider = new ConvertToJsonCodeLensProvider();
  context.subscriptions.push(convertProvider);
  const convertCodeLensDisposable = vscode.languages.registerCodeLensProvider(
    { language: 'plaintext' },
    convertProvider,
  );

  context.subscriptions.push(
    changeDisposable,
    toggleDisposable,
    parseNestedDisposable,
    parseByTokenDisposable,
    convertDisposable,
    hoverDisposable,
    codeLensDisposable,
    convertCodeLensDisposable,
  );
}
