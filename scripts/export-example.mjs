import fs from 'node:fs/promises';import {example} from '../src/profile.mjs';import {exportFiles} from '../src/export.mjs';
await fs.mkdir('generated/PinMendDemo',{recursive:true});
for(const [name,text] of Object.entries(exportFiles(example())))await fs.writeFile('generated/PinMendDemo/'+name,text);
console.log('Exported original demo source only');
