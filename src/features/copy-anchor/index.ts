import * as vscode from 'vscode';
import {
  captureSelection,
  clearCopyHistory,
  copyAfterToggle,
  copyWithCurrentMode,
  type CopyResult,
} from './commands';
import { formatCopyPreview } from './core/copyPreview';

export function registerCopyAnchorFeature(
  context: vscode.ExtensionContext,
  logger: vscode.LogOutputChannel,
): void {
  const reportError = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[Copy Anchor] ${message}`);
    void vscode.window.showErrorMessage(`Context Kit: Copy Anchor：操作失败。${message}`);
  };
  const copied = vscode.window.createStatusBarItem(
    'contextKit.copyAnchor.copied',
    vscode.StatusBarAlignment.Left,
    -100,
  );
  copied.name = 'Context Kit: Copy Anchor 复制提示';
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const hideCopied = (): void => {
    clearTimeout(hideTimer);
    hideTimer = undefined;
    copied.hide();
  };
  const showCopied = (result: CopyResult | undefined): void => {
    if (!result) return;
    hideCopied();
    const config = vscode.workspace.getConfiguration('contextKit.copyAnchor');
    const duration = config.get<number>('previewDuration', 1);
    if (duration <= 0) return;
    const maxLength = Math.max(1, config.get<number>('previewMaxLength', 30));
    const text = `${result.isContext ? '📌' : '📄'}copied: ${formatCopyPreview(result.text, result.isContext, maxLength)}`;
    // Status bar text interprets $(...) as icons; copied source must stay literal.
    copied.text = text.replace(/\$\(/g, '\\$(');
    copied.accessibilityInformation = { label: text };
    copied.show();
    hideTimer = setTimeout(hideCopied, duration * 1000);
  };
  const status = vscode.window.createStatusBarItem(
    'contextKit.copyAnchor.mode',
    vscode.StatusBarAlignment.Right,
    100,
  );
  status.name = 'Context Kit: Copy Anchor';
  status.command = 'contextKit.copyAnchor.toggle';
  const refresh = (): void => {
    const enabled = vscode.workspace
      .getConfiguration('contextKit.copyAnchor')
      .get<boolean>('enabled', true);
    status.text = enabled ? '📌' : '📄';
    const mode = enabled ? '上下文复制' : '普通复制';
    status.tooltip = `Copy Anchor：${mode}。点击或按 Ctrl+\\ Ctrl+\\ 切换并复制。未保存文件始终普通复制。`;
    status.accessibilityInformation = { label: `Copy Anchor：${mode}` };
    status.show();
  };
  // Serialize toggles so two rapid invocations do not read the same old value.
  let toggleQueue: Promise<void> = Promise.resolve();
  const toggle = (): Promise<void> => {
    const content = captureSelection();
    toggleQueue = toggleQueue
      .then(async () => {
        const config = vscode.workspace.getConfiguration('contextKit.copyAnchor');
        const inspected = config.inspect<boolean>('enabled');
        const target =
          inspected?.workspaceValue !== undefined
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
        await config.update('enabled', !config.get<boolean>('enabled', true), target);
        refresh();
        showCopied(await copyAfterToggle(content));
      })
      .catch(reportError);
    return toggleQueue;
  };
  context.subscriptions.push(
    status,
    copied,
    { dispose: hideCopied },
    { dispose: clearCopyHistory },
    vscode.commands.registerCommand('contextKit.copyAnchor.toggle', toggle),
    vscode.commands.registerCommand('contextKit.copyAnchor.copy', () =>
      copyWithCurrentMode().then(showCopied).catch(reportError),
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('contextKit.copyAnchor.enabled')) refresh();
      if (
        event.affectsConfiguration('contextKit.copyAnchor.previewDuration') ||
        event.affectsConfiguration('contextKit.copyAnchor.previewMaxLength')
      )
        hideCopied();
    }),
  );
  refresh();
}
