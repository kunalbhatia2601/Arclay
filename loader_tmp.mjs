import { pathToFileURL } from 'node:url';
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
export function resolve(s,c,next){ if(s.startsWith('@/')){let p=path.join(ROOT,'src',s.slice(2));
 if(!fs.existsSync(p)&&fs.existsSync(p+'.js'))p+='.js'; return next(pathToFileURL(p).href,c);} return next(s,c); }
