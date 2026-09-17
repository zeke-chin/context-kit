import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';

suite('Independent feature switches', () => {
  test('Copy Anchor master switch disables commands and preserves the chosen mode', async () => {
    const config = vscode.workspace.getConfiguration('contextKit.copyAnchor');
    const originalEnabled = config.inspect<boolean>('enabled')?.globalValue;
    const originalMode = config.inspect<boolean>('contextMode')?.globalValue;
    const clipboard = await vscode.env.clipboard.readText();
    const folder = await mkdtemp(join(tmpdir(), 'context-kit-switch-'));
    try {
      const path = join(folder, 'source.txt');
      await writeFile(path, 'hello\nworld');
      const editor = await vscode.window.showTextDocument(
        await vscode.workspace.openTextDocument(path),
      );
      editor.selection = new vscode.Selection(0, 0, 0, 5);
      await config.update('contextMode', true, vscode.ConfigurationTarget.Global);
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
      await vscode.env.clipboard.writeText('unchanged');
      await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
      await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
      assert.equal(await vscode.env.clipboard.readText(), 'unchanged');
      assert.equal(
        vscode.workspace.getConfiguration('contextKit.copyAnchor').get('enabled'),
        false,
      );
      assert.equal(
        vscode.workspace.getConfiguration('contextKit.copyAnchor').get('contextMode'),
        true,
      );
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
      await vscode.commands.executeCommand('contextKit.copyAnchor.copy');
      assert.equal(await vscode.env.clipboard.readText(), `\`\`\`${path}:1\nhello\n\`\`\``);
      await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
      assert.equal(await vscode.env.clipboard.readText(), 'hello');
      assert.equal(vscode.workspace.getConfiguration('contextKit.copyAnchor').get('enabled'), true);
      assert.equal(
        vscode.workspace.getConfiguration('contextKit.copyAnchor').get('contextMode'),
        false,
      );
      // Disable clears the remembered selection without clearing the clipboard.
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
      editor.selection = new vscode.Selection(1, 0, 1, 0);
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
      await vscode.commands.executeCommand('contextKit.copyAnchor.toggle');
      assert.equal(await vscode.env.clipboard.readText(), 'hello');
    } finally {
      await config.update('contextMode', originalMode, vscode.ConfigurationTarget.Global);
      await config.update('enabled', originalEnabled, vscode.ConfigurationTarget.Global);
      await vscode.env.clipboard.writeText(clipboard);
      await rm(folder, { recursive: true, force: true });
    }
  });

  test('JSON Explorer stops commands, automatic formatting and providers until re-enabled', async () => {
    const config = vscode.workspace.getConfiguration('contextKit.jsonExplorer');
    const original = config.inspect<boolean>('enabled')?.globalValue;
    const text = JSON.stringify({ payload: '{"a":1}' });
    try {
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
      const document = await vscode.workspace.openTextDocument({ content: text, language: 'json' });
      await vscode.window.showTextDocument(document);
      await vscode.commands.executeCommand('contextKit.jsonExplorer.toggleCurrentDocument');
      assert.equal(document.getText(), text);
      const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        document.uri,
      );
      assert.ok(
        !lenses.some((lens) => lens.command?.command.startsWith('contextKit.jsonExplorer.')),
      );
      const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        document.uri,
        new vscode.Position(0, 15),
      );
      assert.ok(!JSON.stringify(hovers).includes('contextKit.jsonExplorer.parseNestedJsonByToken'));
      const pasted = await vscode.workspace.openTextDocument({ language: 'plaintext' });
      const editor = await vscode.window.showTextDocument(pasted);
      await editor.edit((edit) => edit.insert(new vscode.Position(0, 0), '{"a":1}'));
      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.equal(pasted.languageId, 'plaintext');
      assert.equal(pasted.getText(), '{"a":1}');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
      const restored = await vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        document.uri,
      );
      assert.equal(
        restored.filter(
          (lens) => lens.command?.command === 'contextKit.jsonExplorer.parseNestedJson',
        ).length,
        1,
      );
      await vscode.window.showTextDocument(document);
      await vscode.commands.executeCommand('contextKit.jsonExplorer.toggleCurrentDocument');
      assert.equal(typeof JSON.parse(document.getText()), 'string');
    } finally {
      await config.update('enabled', original, vscode.ConfigurationTarget.Global);
    }
  });
});
