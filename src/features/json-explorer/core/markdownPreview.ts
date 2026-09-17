/**
 * A truncated (or malformed) markdown preview can leave a ``` code fence open,
 * which would swallow everything appended after it — including the footer
 * "open" link, rendering it as literal text instead of a clickable command.
 * Balancing the fences lets the trailing content escape the code block.
 */
export function closeDanglingCodeFence(markdown: string): string {
  const fences = markdown.match(/^```/gm);
  if (fences && fences.length % 2 !== 0) {
    return `${markdown}\n\`\`\``;
  }
  return markdown;
}
