import Mocha from 'mocha';
export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', timeout: 15000 });
  mocha.suite.emit('pre-require', globalThis, 'integration', mocha);
  require('./convertCodeLens.test');
  require('./extension.test');
  require('./copyAnchor.test');
  require('./combinedFeatures.test');
  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) =>
      failures ? reject(new Error(`${failures} integration tests failed`)) : resolve(),
    );
  });
}
