import {solve} from '../src/solver.mjs';
let data='';for await(const chunk of process.stdin)data+=chunk;
console.log(JSON.stringify(JSON.parse(data).map(solve)));
