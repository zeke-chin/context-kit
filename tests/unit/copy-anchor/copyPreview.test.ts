import assert from 'node:assert/strict';
import { test } from 'bun:test';
import { formatCopyPreview } from '../../../src/features/copy-anchor/core/copyPreview';
import { formatSelection } from '../../../src/features/copy-anchor/core/contextText';

test('context preview keeps filename, lines and content without the outer fence', () => {
  const content = formatSelection('/home/zeke/Downloads/# Copy Anchor 📌.txt', {
    text: '## 使用\n\n在已保存文件中',
    startLine: 4,
  });
  assert.equal(
    formatCopyPreview(content, true, 100),
    '../# Copy Anchor 📌.txt:5-7\\n## 使用\\n\\n在已保存文件中',
  );
});

test('plain preview preserves Markdown and escapes line endings', () => {
  assert.equal(
    formatCopyPreview('## 使用\r\n\r\n在已保存文件中', false, 100),
    '## 使用\\n\\n在已保存文件中',
  );
  assert.equal(formatCopyPreview('```/a:1\ntext\n```', false, 100), '```/a:1\\ntext\\n```');
});

test('preview handles path-only copies and code containing fences', () => {
  assert.equal(formatCopyPreview('C:\\repo\\file.txt', true, 100), '../file.txt');
  const content = formatSelection('/a`b.md', { text: '~~~\ncode\n~~~', startLine: 0 });
  assert.equal(formatCopyPreview(content, true, 100), '../a`b.md:1-3\\n~~~\\ncode\\n~~~');
});

test('preview limit includes ellipsis and does not split emoji surrogate pairs', () => {
  assert.equal(formatCopyPreview('📌中文abcdef', false, 4), '📌中文…');
  assert.equal(formatCopyPreview('long', false, 1), '…');
  assert.equal(formatCopyPreview('📌中文', false, 3), '📌中文');
});

test('short context previews keep the filename end and extension', () => {
  assert.equal(formatCopyPreview('/repo/README.txt', true, 11), '../..ME.txt');
  const content = formatSelection('/repo/README.txt', { text: 'body', startLine: 4 });
  assert.equal(formatCopyPreview(content, true, 13), '../..ME.txt:5');
  assert.equal(formatCopyPreview(content, true, 10), '../..E.txt');
  assert.equal(formatCopyPreview('/repo/README.txt', true, 4), '.txt');
  assert.equal(formatCopyPreview('/repo/📌中文.txt', true, 12), '../📌中文.txt');
});
