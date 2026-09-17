const path = require('node:path');
const { runTests } = require('@vscode/test-electron');

runTests({
  version: '1.105.0',
  vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH,
  extensionDevelopmentPath: path.resolve(__dirname, '..'),
  extensionTestsPath: path.resolve(__dirname, '../out/test/index.js'),
  launchArgs: [
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--skip-welcome',
    '--skip-release-notes',
  ],
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
