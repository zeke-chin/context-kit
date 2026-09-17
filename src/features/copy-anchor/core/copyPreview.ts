/** Format only the preview; never alter the clipboard itself. */
export function formatCopyPreview(text: string, isContext: boolean, maxLength: number): string {
  let preview = text;
  if (isContext) {
    const shortPath = (path: string): string => `../${path.split(/[/\\]/).at(-1) ?? path}`;
    const blocks = /^(`{3,}|~{3,})([^\n]+)\n([\s\S]*?)\n\1(?=\n|$)/gm;
    preview = text.replace(
      blocks,
      (_block, _fence: string, location: string, body: string) => `${shortPath(location)}\n${body}`,
    );
    if (preview === text) preview = shortPath(text);
    const location = preview.split('\n')[0]!;
    if (Array.from(location).length >= maxLength) {
      if (Array.from(location).length === maxLength) return location;
      // Spend the limited space on the filename's end, keeping the extension.
      const match = /^(.*?)(:\d+(?:-\d+)?)?$/.exec(location.slice(3))!;
      const filename = match[1]!;
      let lines = match[2] ?? '';
      const extension = /\.[^.]+$/.exec(filename)?.[0] ?? '';
      const prefix = '../..';
      if (prefix.length + Array.from(extension + lines).length > maxLength) lines = '';
      const tail = Array.from(filename + lines);
      if (maxLength <= prefix.length) return tail.slice(-maxLength).join('');
      return prefix + tail.slice(-(maxLength - prefix.length)).join('');
    }
  }
  preview = preview.replace(/\r\n|\r|\n/g, '\\n').replace(/\t/g, '\\t');
  const characters = Array.from(preview);
  return characters.length > maxLength
    ? `${characters.slice(0, Math.max(0, maxLength - 1)).join('')}…`
    : preview;
}
