import {lsrSync} from 'lsr';
import loadTsConfig from '../utils/loadTsConfig';
import shortenFileNames from '../utils/shortenFileNames';

import parse from './';

test('parse', () => {
  const filenames = lsrSync(__dirname + '/../../example')
    .filter(e => e.isFile())
    .map(e => e.fullPath);
  const config = loadTsConfig(process.cwd());
  expect(shortenFileNames(parse(filenames, config.options))).toMatchSnapshot();
});
