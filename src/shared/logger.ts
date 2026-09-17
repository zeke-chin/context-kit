import * as vscode from 'vscode';

export function createLogger(): vscode.LogOutputChannel {
  return vscode.window.createOutputChannel('Context Kit', { log: true });
}
