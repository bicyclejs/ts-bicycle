import compile from './';

test('compile all', async () => {
  await compile(__dirname + '/example', __dirname + '/example', {
    shortenFileNames: true,
  });
});
