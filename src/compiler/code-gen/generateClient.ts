import AST from '../AST';
import generateHeader from './generateHeader';

const client = `${generateHeader()}

import Client from 'bicycle/typed-helpers/client';
import OptimisticUpdates from './optimistic';

export default class TypedClient extends Client<OptimisticUpdates> {}
`;
export default function generateClient(ast: AST): string {
  return client;
}
