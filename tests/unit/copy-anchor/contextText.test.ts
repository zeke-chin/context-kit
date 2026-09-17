import assert from 'node:assert/strict';
import { test } from 'bun:test';
import { formatContext, formatSelection } from '../../../src/features/copy-anchor/core/contextText';

test('blank boundary lines are removed and source line numbers track retained text', () => {
  assert.equal(
    formatSelection('/repo/README.md', {
      text: '\n## 功能演示\n\n### 1. 智能识别与格式化\n![Auto Paste Format](images/auto-paste-format.gif)\n\n',
      startLine: 6,
    }),
    '```/repo/README.md:8-11\n## 功能演示\n\n### 1. 智能识别与格式化\n![Auto Paste Format](images/auto-paste-format.gif)\n```',
  );
});

test('single-line selections preserve indentation and trailing spaces', () => {
  assert.equal(
    formatSelection('/a.ts', { text: '  value  ', startLine: 4 }),
    '```/a.ts:5\n  value  \n```',
  );
});

test('selection ending at the start of the next line excludes that line', () => {
  assert.equal(formatSelection('/a', { text: 'a\nb\n', startLine: 0 }), '```/a:1-2\na\nb\n```');
});

test('CRLF source and blank lines preserve correct coordinates', () => {
  assert.equal(
    formatSelection('C:\\项目\\a.ts', { text: '\r\n  a\r\n\r\n  b\r\n', startLine: 1 }),
    '```C:\\项目\\a.ts:3-5\n  a\n\n  b\n```',
  );
});

test('Markdown snippets cannot prematurely close the outer fence', () => {
  assert.equal(
    formatSelection('/a.md', { text: '```ts\na\n```', startLine: 0 }),
    '````/a.md:1-3\n```ts\na\n```\n````',
  );
});

test('filenames containing backticks use tilde fences', () => {
  assert.equal(formatSelection('/a`b', { text: '~~~', startLine: 0 }), '~~~~/a`b:1\n~~~\n~~~~');
});

test('whitespace-only selection remains copyable', () => {
  assert.equal(formatSelection('/a', { text: '  \n', startLine: 3 }), '```/a:4\n  \n```');
});

test('multiple selections get separate source headers', () => {
  assert.equal(
    formatContext('/a', [
      { text: 'a', startLine: 0 },
      { text: 'b', startLine: 8 },
    ]),
    '```/a:1\na\n```\n\n```/a:9\nb\n```',
  );
});
