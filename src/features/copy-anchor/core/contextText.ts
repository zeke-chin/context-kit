export interface SelectedText {
  text: string;
  /** Zero-based document line containing the first selected character. */
  startLine: number;
}

/** Keep indentation and internal blank lines; remove only empty boundary lines. */
export function formatSelection(path: string, selection: SelectedText): string {
  const lines = selection.text.split(/\r\n|\n|\r/);
  let first = 0;
  let last = lines.length - 1;
  while (first <= last && lines[first]!.trim() === '') first++;
  while (last >= first && lines[last]!.trim() === '') last--;
  // A whitespace-only selection still needs meaningful source coordinates.
  if (first > last) {
    first = 0;
    last = lines.length - 1;
    if (last > 0 && lines[last] === '') last--;
  }
  const content = lines.slice(first, last + 1).join('\n');
  const start = selection.startLine + first + 1;
  const end = selection.startLine + last + 1;
  const location = `${path}:${start === end ? start : `${start}-${end}`}`;
  // Tilde fences also allow backticks in filenames and Markdown snippets.
  const marker = path.includes('`') ? '~' : '`';
  const runs = (path + '\n' + content).match(marker === '`' ? /`+/g : /~+/g) ?? [];
  const length = runs.reduce((max, run) => Math.max(max, run.length + 1), 3);
  const fence = marker.repeat(length);
  return `${fence}${location}\n${content}\n${fence}`;
}

export function formatContext(path: string, selections: readonly SelectedText[]): string {
  return selections.map((selection) => formatSelection(path, selection)).join('\n\n');
}
