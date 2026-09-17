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
