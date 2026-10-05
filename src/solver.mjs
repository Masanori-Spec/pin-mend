import {PROFILE, TYPES} from './profile.mjs';
const bad = message => {throw new Error(message);};
function exactKeys(value,keys,label){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))bad(`Unknown or missing ${label} fields`);}
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) bad('Expected a pinmend/1 object');
  exactKeys(input,['schema','features','unavailable','signals'],'project');
  exactKeys(input.features,['servo','tone'],'feature');
  if(input.schema !== 'pinmend/1') bad('Unsupported schema');
  if(!input.features || typeof input.features.servo !== 'boolean' || typeof input.features.tone !== 'boolean') bad('Features must be booleans');
  if(!Array.isArray(input.unavailable) || input.unavailable.some(p=>!Number.isInteger(p)||!PROFILE.pins.includes(p)) || new Set(input.unavailable).size!==input.unavailable.length) bad('Unavailable pins must be unique D2–D13 integers');
  if(!Array.isArray(input.signals) || input.signals.length<1 || input.signals.length>12) bad('Use 1–12 signals');
  const ids = new Set(); const counts = {servo:0,tone:0};
  for(const s of input.signals) {
    exactKeys(s,['id','type','pin','fixed'],'signal');
    if(!s || typeof s!=='object' || typeof s.id!=='string' || !/^[A-Z][A-Z0-9_]{0,23}$/.test(s.id) || ids.has(s.id)) bad('Signal IDs must be unique uppercase identifiers (1–24 characters)');
    ids.add(s.id);
    if(!TYPES.includes(s.type)) bad('Unsupported signal type');
    if(!Number.isInteger(s.pin)||!PROFILE.pins.includes(s.pin)) bad('Signal pins must be D2–D13');
    if(typeof s.fixed!=='boolean') bad('Fixed must be a boolean');
    if(s.type==='servo'||s.type==='tone') counts[s.type]++;
  }
  if(counts.servo>1||counts.tone>1) bad('This profile supports at most one Servo and one tone signal');
  if(input.features.servo && counts.servo!==1) bad('An enabled Servo feature needs one Servo signal');
  if(input.features.tone && counts.tone!==1) bad('An enabled tone feature needs one tone signal');
  return input;
}
export function activeSignals(input) {return input.signals.filter(s=> !['servo','tone'].includes(s.type) || input.features[s.type]);}
export function pwmAvailable(input) {return PROFILE.pwmPins.filter(p=> !input.unavailable.includes(p) && !(input.features.servo&&[9,10].includes(p)) && !(input.features.tone&&[3,11].includes(p)));}
export function candidates(s,input) {return (s.type==='led-pwm'?pwmAvailable(input):PROFILE.pins.filter(p=>!input.unavailable.includes(p))).filter(p=>!s.fixed||s.pin===p);}
export function diagnose(input) {
  validate(input); const active = activeSignals(input).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0); const issues=[];
  for (const s of active) {
    if(!candidates({...s,fixed:false},input).includes(s.pin)) issues.push({id:s.id,pin:s.pin,reason:input.unavailable.includes(s.pin)?'unavailable':s.type==='led-pwm'&&PROFILE.pwmPins.includes(s.pin)?'timer-conflict':'not-pwm'});
    const other=active.find(x=>x.id!==s.id&&x.pin===s.pin); if(other) issues.push({id:s.id,pin:s.pin,reason:'duplicate',other:other.id});
  }
  return issues;
}
export function solve(input) {
  validate(input);
  const rows=activeSignals(input).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const domains=rows.map(s=>candidates(s,input)); const memo=new Map(); let states=0;
  function visit(i,mask) {
    if(i===rows.length) return {cost:0,pins:[]};
    const key=i*4096+mask; if(memo.has(key)) return memo.get(key); states++;
    let best=null;
    for(const pin of domains[i]) {const bit=1<<(pin-2); if(mask&bit)continue;
      const tail=visit(i+1,mask|bit); if(!tail)continue;
      const cost=tail.cost+(pin!==rows[i].pin?1:0);
      // Ascending domains and lexicographic recursion make equal-cost ties deterministic.
      if(!best || cost<best.cost) best={cost,pins:[pin,...tail.pins]};
    }
    memo.set(key,best); return best;
  }
  const best=visit(0,0); const issues=diagnose(input);
  if(!best) {
    const fixedOther=new Set(rows.filter(s=>s.fixed&&s.type!=='led-pwm').map(s=>s.pin));
    const pwm=pwmAvailable(input).filter(p=>!fixedOther.has(p)); const demand=rows.filter(s=>s.type==='led-pwm').length;
    let reason = domains.some(d=>!d.length)?'empty-domain':demand>pwm.length?'pwm-shortage':'distinct-pin-shortage';
    return {status:'infeasible',issues,reason,emptySignals:rows.filter((_,i)=>!domains[i].length).map(s=>s.id),pwmDemand:demand,pwmCapacity:pwm.length,pwmCandidates:pwm,states};
  }
  const assignments=rows.map((s,i)=>({...s,previousPin:s.pin,pin:best.pins[i],changed:s.pin!==best.pins[i]}));
  const changes=assignments.filter(s=>s.changed).map(s=>({id:s.id,from:s.previousPin,to:s.pin}));
  const frequencyChanges=assignments.filter(s=>s.type==='led-pwm'&&PROFILE.pwmHz[s.previousPin]!==PROFILE.pwmHz[s.pin]).map(s=>({id:s.id,fromHz:PROFILE.pwmHz[s.previousPin]??null,toHz:PROFILE.pwmHz[s.pin]}));
  return {status:'solved',cost:best.cost,assignments,changes,frequencyChanges,issues,states,tieBreak:'lexicographic pins by ascending signal ID',optimality:'exact dynamic programming over all distinct-pin assignments'};
}
