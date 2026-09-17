const result = await Bun.build({
  entrypoints: ['./tests/integration/index.ts'],
  outdir: './out/test',
  target: 'node',
  format: 'cjs',
  external: ['vscode', 'mocha'],
  sourcemap: 'external',
});
if (!result.success) throw new AggregateError(result.logs, 'Integration test build failed');
export {};
