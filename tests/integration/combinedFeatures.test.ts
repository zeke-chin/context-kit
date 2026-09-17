import { assertClipboard, focusClipboardEditor } from './clipboard';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { suite, test, suiteSetup, suiteTeardown } from 'mocha';
import * as vscode from 'vscode';

suite('JSON Explorer and Copy Anchor together', () => {
  let folder: string;
  let clipboard: string;
  let originalMode: boolean | undefined;
  suiteSetup(async () => {
    await vscode.extensions.getExtension('zekeChin.context-kit-tools')!.activate();
    folder = await mkdtemp(join(tmpdir(), 'context-kit-combined-'));
    clipboard = await vscode.env.clipboard.readText();
    const config = vscode.workspace.getConfiguration('contextKit.copyAnchor');
    originalMode = config.inspect<boolean>('contextMode')?.globalValue;
    await config.update('contextMode', true, vscode.ConfigurationTarget.Global);
  });
  suiteTeardown(async () => {
    await vscode.workspace
      .getConfiguration('contextKit.copyAnchor')
      .update('contextMode', originalMode, vscode.ConfigurationTarget.Global);
    await vscode.env.clipboard.writeText(clipboard);
    await rm(folder, { recursive: true, force: true });
  });

  test('JSON conversion and copy use the latest text and line positions', async () => {
    const path = join(folder, 'source.json');
    await writeFile(path, '{"a":1,"b":2}');
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('contextKit.jsonExplorer.toggleCurrentDocument');
    await vscode.commands.executeCommand('contextKit.jsonExplorer.toggleCurrentDocument');
    assert.deepEqual(JSON.parse(document.getText()), { a: 1, b: 2 });
    const line = document.lineAt(1);
    editor.selection = new vscode.Selection(line.range.start, line.range.end);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    assert.equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:2\n${line.text}\n\`\`\``);
    assert.deepEqual(JSON.parse(document.getText()), { a: 1, b: 2 });
  });

  test('whole-file copy can switch to original JSON and paste into auto-formatting', async () => {
    const path = join(folder, 'paste-source.json');
    const source = '{"nested":{"ok":true}}';
    await writeFile(path, source);
    const document = await vscode.workspace.openTextDocument(path);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(0, 0, 0, source.length);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    assert.equal(await vscode.env.clipboard.readText(), path);
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    assert.equal(await vscode.env.clipboard.readText(), source);
    const pasted = await vscode.workspace.openTextDocument({ language: 'plaintext' });
    const target = await vscode.window.showTextDocument(pasted);
    await target.edit((edit) => edit.insert(new vscode.Position(0, 0), source));
    const deadline = Date.now() + 5000;
    while (pasted.languageId !== 'json' || !pasted.getText().includes('\n')) {
      if (Date.now() >= deadline) throw new Error('JSON auto-format did not finish');
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.deepEqual(JSON.parse(pasted.getText()), { nested: { ok: true } });
    await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
    assert.equal(await vscode.env.clipboard.readText(), path);
    assert.deepEqual(JSON.parse(pasted.getText()), { nested: { ok: true } });
  });

  test('JSON Explorer side-panel Untitled output copies without a source path', async () => {
    await vscode.commands.executeCommand('workbench.action.joinAllGroups');
    const content = '{"parsed":true}';
    await vscode.commands.executeCommand(
      'contextKit.jsonExplorer.parseNestedJson',
      content,
      'combined',
      'json',
    );
    const sideDocument = vscode.window.activeTextEditor!.document;
    assert.equal(sideDocument.isUntitled, true);
    // Native copy routes through renderer focus; isolate the opened document before selecting.
    await vscode.commands.executeCommand('workbench.action.joinAllGroups');
    const editor = await vscode.window.showTextDocument(sideDocument, {
      viewColumn: vscode.ViewColumn.One,
      preserveFocus: false,
    });
    await focusClipboardEditor();
    const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
    editor.selection = new vscode.Selection(new vscode.Position(0, 0), end);
    await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
    await assertClipboard(content);
  });
});
