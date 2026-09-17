import * as vscode from 'vscode';

export function isCopyAnchorEnabled(): boolean {
  return vscode.workspace.getConfiguration('contextKit.copyAnchor').get<boolean>('enabled', true);
}
