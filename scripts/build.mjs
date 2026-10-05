import fs from 'node:fs/promises';
const files=['src/profile.mjs','src/solver.mjs','src/export.mjs','src/zip.mjs','web/i18n.mjs','web/app.mjs'];
let js='';for(const f of files)js+='\n'+(await fs.readFile(f,'utf8')).replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
const css=await fs.readFile('web/styles.css','utf8');let html=await fs.readFile('web/index.html','utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`).replace('<script type="module" src="app.mjs"></script>',`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
await fs.mkdir('dist',{recursive:true});await fs.writeFile('dist/index.html',html);console.log(`Built standalone dist/index.html (${Buffer.byteLength(html)} bytes)`);
