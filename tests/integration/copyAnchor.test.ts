import { suite, test } from 'mocha';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as vscode from 'vscode';
import { contextForEditor } from '../../src/features/copy-anchor/commands';

async function runCopyAnchorRegression(): Promise<void> {
  const folder = await mkdtemp(join(tmpdir(), 'copy-anchor-'));
  const path = join(folder, 'example.md');
  const originalClipboard = await vscode.env.clipboard.readText();
  const config = vscode.workspace.getConfiguration('contextKit.copyAnchor');
  const originalEnabled = config.inspect<boolean>('enabled')?.globalValue;
  let assertions = 0;
  const equal = (actual: unknown, expected: unknown): void => {
    assert.deepEqual(actual, expected);
    assertions++;
  };
  try {
    await vscode.extensions.getExtension('zekeChin.context-kit')!.activate();
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    await writeFile(path, 'before\n\n  alpha\n\n  beta\n\nafter\n');
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(1, 0, 6, 0);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3-5\n  alpha\n\n  beta\n\`\`\``);
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), '\n  alpha\n\n  beta\n\n');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3-5\n  alpha\n\n  beta\n\`\`\``);

    // Reversed selections have the same normalized range.
    editor.selection = new vscode.Selection(6, 0, 1, 0);
    equal(contextForEditor(editor), `\`\`\`${path}:3-5\n  alpha\n\n  beta\n\`\`\``);

    editor.selection = new vscode.Selection(0, 0, document.lineCount - 1, 0);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    equal(await vscode.env.clipboard.readText(), path);

    editor.selections = [new vscode.Selection(4, 2, 4, 6), new vscode.Selection(2, 2, 2, 7)];
    equal(
      contextForEditor(editor),
      `\`\`\`${path}:3\nalpha\n\`\`\`\n\n\`\`\`${path}:5\nbeta\n\`\`\``,
    );

    editor.selection = new vscode.Selection(2, 2, 2, 7);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(vscode.workspace.getConfiguration('contextKit.copyAnchor').get('enabled'), false);
    equal(await vscode.env.clipboard.readText(), 'alpha');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(vscode.workspace.getConfiguration('contextKit.copyAnchor').get('enabled'), true);
    equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3\nalpha\n\`\`\``);
    await Promise.all([
      vscode.commands.executeCommand('contextKit.copyAnchor.toggle'),
      vscode.commands.executeCommand('contextKit.copyAnchor.toggle'),
    ]);
    equal(vscode.workspace.getConfiguration('contextKit.copyAnchor').get('enabled'), true);
    equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3\nalpha\n\`\`\``);

    // Keep switching the copied snippet after the selection is cleared or moved.
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), 'alpha');
    editor.selection = new vscode.Selection(4, 2, 4, 6);
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3\nalpha\n\`\`\``);

    // Unrelated clipboard content must not be overwritten by a blank line.
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await vscode.env.clipboard.writeText('clipboard to preserve');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), 'clipboard to preserve');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), 'clipboard to preserve');

    // Capture a fresh selection before the asynchronous settings write.
    editor.selection = new vscode.Selection(2, 2, 2, 7);
    const selectionChange = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('contextKit.copyAnchor.enabled')) {
        editor.selection = new vscode.Selection(1, 0, 1, 0);
      }
    });
    try {
      await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
      equal(await vscode.env.clipboard.readText(), 'alpha');
      await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
      equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:3\nalpha\n\`\`\``);
    } finally {
      selectionChange.dispose();
    }

    await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    editor.selection = new vscode.Selection(2, 2, 2, 2);
    equal(contextForEditor(editor), undefined);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    equal(await vscode.env.clipboard.readText(), '  alpha\n');

    const untitled = await vscode.workspace.openTextDocument({ content: 'Untitled text\n' });
    const unsaved = await vscode.window.showTextDocument(untitled);
    await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    unsaved.selection = new vscode.Selection(0, 0, 1, 0);
    equal(contextForEditor(unsaved), undefined);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    equal(await vscode.env.clipboard.readText(), 'Untitled text\n');
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');

    // Full selection in a file without a trailing newline.
    const singlePath = join(folder, 'single.txt');
    await writeFile(singlePath, 'single line');
    const single = await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(singlePath),
    );
    single.selection = new vscode.Selection(0, 11, 0, 0);
    equal(contextForEditor(single), singlePath);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    single.selection = new vscode.Selection(0, 0, 0, 0);
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), 'single line');
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    equal(await vscode.env.clipboard.readText(), singlePath);
    console.log(`Copy Anchor integration: ${assertions} assertions passed.`);
  } finally {
    await config.update('enabled', originalEnabled, vscode.ConfigurationTarget.Global);
    await vscode.env.clipboard.writeText(originalClipboard);
    await rm(folder, { recursive: true, force: true });
  }
}

suite('Copy Anchor migrated regression', () => {
  test('preserves the current standalone clipboard and toggle behavior', async function () {
    this.timeout(60000);
    await runCopyAnchorRegression();
  });
});
