import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import * as vscode from 'vscode';

/** Native copy may return before the renderer/OS clipboard update reaches the host. */
export async function assertClipboard(expected: string): Promise<void> {
  const deadline = Date.now() + 5000;
  let actual = await vscode.env.clipboard.readText();
  while (actual !== expected && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    actual = await vscode.env.clipboard.readText();
  }
  assert.equal(actual, expected);
}

/** Native DOM copy needs an active OS window, not just an active editor group. */
export async function focusClipboardEditor(): Promise<void> {
  if (process.env.CI && process.platform === 'linux') {
    const windows = execFileSync('xdotool', ['search', '--onlyvisible', '--class', 'Code'], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n');
    const windowId = windows.at(-1);
    if (!windowId) throw new Error('No visible VS Code test window');
    execFileSync('xdotool', ['windowactivate', '--sync', windowId]);
  }
  await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (process.env.CI && process.platform === 'linux') {
    // Chromium's DOM copy requires a trusted input event. F18 has no default binding
    // and activates the window without changing text, selection, or clipboard.
    execFileSync('xdotool', ['key', '--clearmodifiers', 'F18']);
  }
}

/** With no selection the contributed Ctrl+C binding is inactive; exercise native fallthrough. */
export async function copyWithoutSelection(): Promise<void> {
  if (process.env.CI && process.platform === 'linux') {
    execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+c']);
  } else {
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
  }
}
