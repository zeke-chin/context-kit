import * as vscode from 'vscode';
import { formatContext } from './core/contextText';

export const NATIVE_COPY = 'editor.action.clipboardCopyAction';

interface CopyContent {
  plain: string;
  context: string;
}

export interface CopyResult {
  text: string;
  isContext: boolean;
}

let lastCopy: { content: CopyContent; written: string } | undefined;

export function captureSelection(): CopyContent | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selections.some((selection) => selection.isEmpty)) return undefined;
  const separator = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const plain = [...editor.selections]
    .sort((a, b) => a.start.compareTo(b.start))
    .map((selection) => editor.document.getText(selection))
    .join(separator);
  return { plain, context: contextForEditor(editor) ?? plain };
}

export async function copyAfterToggle(
  content: CopyContent | undefined,
): Promise<CopyResult | undefined> {
  // Keep switching the same copied content, even after the cursor/selection moves.
  const previous = lastCopy;
  if (previous && (await vscode.env.clipboard.readText()) === previous.written) {
    content = previous.content;
  }
  if (!content) return;
  const enabled = vscode.workspace
    .getConfiguration('contextKit.copyAnchor')
    .get<boolean>('enabled', true);
  const written = enabled ? content.context : content.plain;
  await vscode.env.clipboard.writeText(written);
  lastCopy = { content, written };
  return { text: written, isContext: enabled && content.context !== content.plain };
}

export function contextForEditor(editor: vscode.TextEditor): string | undefined {
  const { document, selections } = editor;
  if (
    document.isUntitled ||
    !['file', 'vscode-remote'].includes(document.uri.scheme) ||
    selections.some((selection) => selection.isEmpty)
  ) {
    return undefined;
  }
  const path = document.uri.fsPath;
  // A newline in a filename cannot be represented in the one-line header.
  if (/[\r\n]/.test(path)) return undefined;
  const end = document.lineAt(document.lineCount - 1).range.end;
  if (
    selections.length === 1 &&
    selections[0]!.start.isEqual(new vscode.Position(0, 0)) &&
    selections[0]!.end.isEqual(end)
  ) {
    return path;
  }
  return formatContext(
    path,
    [...selections]
      .sort((a, b) => a.start.compareTo(b.start))
      .map((selection) => ({
        text: document.getText(selection),
        startLine: selection.start.line,
      })),
  );
}

export async function copyWithCurrentMode(): Promise<CopyResult> {
  const content = captureSelection();
  const editor = vscode.window.activeTextEditor;
  const enabled = vscode.workspace
    .getConfiguration('contextKit.copyAnchor')
    .get<boolean>('enabled', true);
  const text = enabled && editor ? contextForEditor(editor) : undefined;
  if (text === undefined) {
    await vscode.commands.executeCommand(NATIVE_COPY);
    const written = await vscode.env.clipboard.readText();
    lastCopy = content ? { content, written } : undefined;
    return { text: written, isContext: false };
  }
  await vscode.env.clipboard.writeText(text);
  lastCopy = content ? { content, written: text } : undefined;
  return { text, isContext: true };
}

/** Release the in-memory clipboard snapshot when the feature is disposed. */
export function clearCopyHistory(): void {
  lastCopy = undefined;
}
