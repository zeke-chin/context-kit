import assert from 'node:assert/strict';
import { suite, test, suiteSetup, suiteTeardown } from 'mocha';
import * as vscode from 'vscode';
import { CONFIG_SECTION } from '../../src/features/json-explorer/config';
import { NestedJsonHoverProvider } from '../../src/features/json-explorer/providers/hoverProvider';
import { ConvertToJsonCodeLensProvider } from '../../src/features/json-explorer/providers/codeLensProvider';

const prefix = 'contextKit.jsonExplorer.';
async function open(content: string, language = 'json'): Promise<vscode.TextEditor> {
  return vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ content, language }),
  );
}
async function waitUntil(check: () => boolean): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!check()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for editor state');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

suite('JSON Explorer extension migration', () => {
  const settings = ['pythonRepr.autoConvert', 'lineBreakRepair.autoConvert'];
  const original = new Map<string, boolean | undefined>();
  suiteSetup(async () => {
    await vscode.extensions.getExtension('zekeChin.context-kit')!.activate();
    for (const key of settings) {
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      original.set(key, config.inspect<boolean>(key)?.globalValue);
      await config.update(key, false, vscode.ConfigurationTarget.Global);
    }
  });
  suiteTeardown(async () => {
    for (const key of settings) {
      await vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .update(key, original.get(key), vscode.ConfigurationTarget.Global);
    }
  });

  test('registers namespaced commands without the old extension', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const name of [
      'toggleCurrentDocument',
      'parseNestedJson',
      'parseNestedJsonByToken',
      'convertToJsonInPlace',
    ]) {
      assert.ok(commands.includes(prefix + name));
    }
    assert.ok(!commands.includes('better-json-explorer.toggleCurrentDocument'));
  });
  test('toggles JSON to a string and back, with undo', async () => {
    const editor = await open('{"a":1,"b":[true,null]}');
    await vscode.commands.executeCommand(prefix + 'toggleCurrentDocument');
    assert.equal(JSON.parse(editor.document.getText()), '{"a":1,"b":[true,null]}');
    await vscode.commands.executeCommand(prefix + 'toggleCurrentDocument');
    assert.deepEqual(JSON.parse(editor.document.getText()), { a: 1, b: [true, null] });
    await vscode.commands.executeCommand('undo');
    await waitUntil(() => typeof JSON.parse(editor.document.getText()) === 'string');
  });
  test('converts Python via the registered command', async () => {
    const editor = await open("{'ok': True, 'items': (1, 2)}", 'plaintext');
    await vscode.commands.executeCommand(
      prefix + 'convertToJsonInPlace',
      editor.document.uri.toString(),
    );
    assert.equal(editor.document.languageId, 'json');
    assert.deepEqual(JSON.parse(editor.document.getText()), { ok: true, items: [1, 2] });
  });
  test('repairs raw newlines through the plaintext shortcut command', async () => {
    const editor = await open('{"message":"first\nsecond"}', 'plaintext');
    await vscode.commands.executeCommand(prefix + 'toggleCurrentDocument');
    assert.equal(editor.document.languageId, 'json');
    assert.deepEqual(JSON.parse(editor.document.getText()), { message: 'first\nsecond' });
  });
  test('whole-document insertion is automatically formatted', async () => {
    const editor = await open('', 'plaintext');
    await editor.edit((edit) => edit.insert(new vscode.Position(0, 0), '{"auto":[1,2]}'));
    await waitUntil(
      () => editor.document.languageId === 'json' && editor.document.getText().includes('\n'),
    );
    assert.deepEqual(JSON.parse(editor.document.getText()), { auto: [1, 2] });
  });
  test('partial insertion and default Python paste retain original text', async () => {
    const editor = await open('prefix ', 'plaintext');
    await editor.edit((edit) => edit.insert(new vscode.Position(0, 7), '{"a":1}'));
    const python = await open('', 'plaintext');
    await python.edit((edit) => edit.insert(new vscode.Position(0, 0), "{'ok': True}"));
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(editor.document.getText(), 'prefix {"a":1}');
    assert.equal(editor.document.languageId, 'plaintext');
    assert.equal(python.document.languageId, 'plaintext');
    assert.equal(python.document.getText(), "{'ok': True}");
  });
  test('configuration invalidates CodeLens cache and enables Python auto-conversion', async () => {
    const editor = await open("{'ok': True}", 'plaintext');
    const provider = new ConvertToJsonCodeLensProvider();
    try {
      assert.equal(provider.provideCodeLenses(editor.document).length, 1);
      const changed = new Promise<void>((resolve) => {
        const listener = provider.onDidChangeCodeLenses(() => {
          listener.dispose();
          resolve();
        });
      });
      await vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .update(settings[0]!, true, vscode.ConfigurationTarget.Global);
      await changed;
      assert.equal(provider.provideCodeLenses(editor.document).length, 0);
      const pasted = await open('', 'plaintext');
      await pasted.edit((edit) => edit.insert(new vscode.Position(0, 0), "{'ok': True}"));
      await waitUntil(
        () => pasted.document.languageId === 'json' && pasted.document.getText().includes('true'),
      );
      assert.deepEqual(JSON.parse(pasted.document.getText()), { ok: true });
    } finally {
      provider.dispose();
      await vscode.workspace
        .getConfiguration(CONFIG_SECTION)
        .update(settings[0]!, false, vscode.ConfigurationTarget.Global);
    }
  });
  test('registered CodeLens opens nested JSON in another editor', async () => {
    const editor = await open(JSON.stringify({ payload: '{"nested":1}' }));
    const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
      'vscode.executeCodeLensProvider',
      editor.document.uri,
    );
    const lens = lenses.find((item) => item.command?.command === prefix + 'parseNestedJson');
    assert.ok(lens?.command);
    await vscode.commands.executeCommand(lens.command.command, ...lens.command.arguments!);
    const opened = vscode.window.activeTextEditor!;
    assert.notEqual(opened.document.uri.toString(), editor.document.uri.toString());
    assert.deepEqual(JSON.parse(opened.document.getText()), { nested: 1 });
    assert.match(opened.document.fileName, /Parsed-payload/);
  });
  test('hover tokens open complete large values repeatedly', async () => {
    const value = 'A'.repeat(5000);
    const editor = await open(JSON.stringify({ content: value }));
    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider',
      editor.document.uri,
      new vscode.Position(0, 20),
    );
    const markdown = hovers
      .flatMap((hover) => hover.contents)
      .find(
        (content) =>
          typeof content === 'object' &&
          'value' in content &&
          content.value.includes(prefix + 'parseNestedJsonByToken'),
      ) as vscode.MarkdownString | undefined;
    assert.ok(markdown);
    const match = markdown.value.match(/command:([^?]+)\?([^)]*)/);
    assert.ok(match);
    assert.ok(match[2]!.length < 100);
    assert.ok(markdown.value.includes('预览已截断'));
    const args = JSON.parse(decodeURIComponent(match[2]!)) as string[];
    await vscode.commands.executeCommand(match[1]!, ...args);
    const first = vscode.window.activeTextEditor!.document;
    assert.equal(first.getText(), value);
    assert.equal(first.languageId, 'plaintext');
    await vscode.commands.executeCommand(match[1]!, ...args);
    assert.notEqual(vscode.window.activeTextEditor!.document.uri.toString(), first.uri.toString());
    assert.equal(vscode.window.activeTextEditor!.document.getText(), value);
  });
  test('Markdown and Python strings retain their distinct hover modes', async () => {
    const provider = new NestedJsonHoverProvider();
    const examples = [
      ["{'active': True}", 'Parsed Python dict'],
      ['# Heading\n\n- first\n- second\n', 'Markdown'],
    ] as const;
    for (const [value, label] of examples) {
      const document = await vscode.workspace.openTextDocument({
        language: 'json',
        content: JSON.stringify({ value }),
      });
      const hover = await provider.provideHover(document, new vscode.Position(0, 12));
      assert.ok(hover);
      assert.ok((hover.contents[0] as vscode.MarkdownString).value.includes(label));
    }
  });
});
