import { register } from 'node:module'; import { pathToFileURL } from 'node:url';
register('./loader_tmp.mjs', pathToFileURL('./'));
