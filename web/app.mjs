import {PROFILE, TYPES, example} from '../src/profile.mjs';
import {validate, solve} from '../src/solver.mjs';
import {exportFiles} from '../src/export.mjs';
import {zipFiles} from '../src/zip.mjs';
import {en,ja} from './i18n.mjs';
const $=id=>document.getElementById(id);
let lang='ja',state=example(),result=null,dirty=false,revision=0;
const initial=new Map([...document.querySelectorAll('[data-i18n]')].map(e=>[e.dataset.i18n,e.dataset.i18n==='title'?e.innerHTML:e.textContent]));
const tr=k=>(lang==='en'?en:ja)[k]||initial.get(k)||k;
const element=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const errorJa={
 'Unknown or missing project fields':'プロジェクトに未対応の項目、または不足した項目があります',
 'Unknown or missing feature fields':'周辺機能には servo と tone のみを指定してください',
 'Unknown or missing signal fields':'信号には id・type・pin・fixed のみを指定してください',
 'Expected a pinmend/1 object':'pinmend/1 形式のオブジェクトが必要です',
 'Unsupported schema':'未対応のスキーマです',
 'Features must be booleans':'周辺機能には true または false を指定してください',
 'Unavailable pins must be unique D2–D13 integers':'使用不可ピンは、重複しない D2–D13 の整数で指定してください',
 'Use 1–12 signals':'信号は 1–12 個にしてください',
 'Signal IDs must be unique uppercase identifiers (1–24 characters)':'信号 ID は大文字で始まる英数字と _ の 1–24 文字で、重複なく指定してください',
 'Unsupported signal type':'未対応の信号種類です',
 'Signal pins must be D2–D13':'信号のピンは D2–D13 を指定してください',
 'Fixed must be a boolean':'固定指定には true または false を使ってください',
 'This profile supports at most one Servo and one tone signal':'Servo と tone の信号は、それぞれ最大 1 個です',
 'An enabled Servo feature needs one Servo signal':'Servo を有効にするには、Servo 信号が 1 個必要です',
 'An enabled tone feature needs one tone signal':'tone を有効にするには、tone 信号が 1 個必要です'
};
function errorText(e){return lang==='ja'?(errorJa[e.message]||(e instanceof SyntaxError?'JSON の構文が正しくありません':e.message)):e.message;}
function announce(message){$('error').textContent=message;}
function typeName(type){return ({'led-pwm':tr('led'),'digital-in':tr('input'),'digital-out':tr('output'),servo:'Servo',tone:'tone'})[type];}
function renderRows(){
  $('signals').replaceChildren();
  for(const [index,s] of state.signals.entries()){
    const row=element('div','signal-row'); if(['servo','tone'].includes(s.type)&&!state.features[s.type])row.classList.add('inactive');
    row.dataset.index=index;
    const name=element('input');name.type='text';name.value=s.id;name.maxLength=24;name.setAttribute('aria-label',`${tr('name')} ${index+1}`);name.dataset.key='id';
    const type=element('select');type.setAttribute('aria-label',`${tr('kind')} ${s.id}`);type.dataset.key='type';
    for(const t of TYPES){const o=element('option','',typeName(t));o.value=t;type.append(o);}type.value=s.type;
    const pin=element('select');pin.setAttribute('aria-label',`${tr('pin')} ${s.id}`);pin.dataset.key='pin';for(const p of PROFILE.pins){const o=element('option','',`D${p}`);o.value=p;pin.append(o);}pin.value=s.pin;
    const lock=element('input');lock.type='checkbox';lock.checked=s.fixed;lock.dataset.key='fixed';lock.setAttribute('aria-label',`${tr('fixedLabel')} ${s.id}`);
    const remove=element('button','remove','×');remove.type='button';remove.setAttribute('aria-label',`${tr('remove')} ${s.id}`);remove.addEventListener('click',()=>{state.signals.splice(index,1);renderRows();invalidate();});
    row.append(name,type,pin,lock,remove);$('signals').append(row);
  }
  $('add').disabled=state.signals.length>=12;
}
function renderPins(){
  $('unavailable').replaceChildren();for(const p of PROFILE.pins){const label=element('label','pin-check');const input=element('input');input.type='checkbox';input.value=p;input.checked=state.unavailable.includes(p);input.setAttribute('aria-label',`${tr('unavailable')} D${p}`);label.append(input,element('span','',`D${p}`));$('unavailable').append(label);}
}
function renderInputs(){ $('servo').checked=state.features.servo;$('tone').checked=state.features.tone;renderRows();renderPins(); }
function invalidate(){revision++;dirty=true;result=null;$('status').textContent=tr('dirty');$('status').className='pill warning';$('output').replaceChildren(element('p','stale',tr('dirtyText')));$('export-area').hidden=true;$('ack').checked=false;announce('');}
function timers(){const wrap=element('div','timer-map');for(const [i,pins,used] of [[0,'D5 · D6',false],[1,'D9 · D10',state.features.servo],[2,'D3 · D11',state.features.tone]]){const box=element('div',`timer${used?' used':''}`);box.append(element('b','',`Timer${i}`),element('span','',pins),element('div','',used?(i===1?'Servo':'tone'):tr('free')));wrap.append(box);}return wrap;}
function isFixture(){const e=example();return JSON.stringify(state)===JSON.stringify(e);}
function renderResult(){
  if(!result){invalidate();return;}
  const out=$('output');out.replaceChildren();$('status').textContent=tr(result.status==='solved'?'solved':'infeasible');$('status').className=`pill${result.status==='solved'?'':' warning'}`;
  if(result.status==='infeasible'){
    const box=element('div','infeasible');box.append(element('h3','',tr('noSolution')),timers());
    if(result.reason==='pwm-shortage'){const c=element('div','repair-count');c.append(element('strong','',`${result.pwmDemand}/${result.pwmCapacity}`),element('span','',tr('shortage')));box.append(c,element('p','explain',`${tr('pins')}: ${result.pwmCandidates.map(p=>`D${p}`).join(', ')||tr('none')}`));}
    else box.append(element('p','callout',tr(result.reason==='empty-domain'?'empty':'collision')+(result.emptySignals.length?' '+result.emptySignals.join(', '):'')));
    box.append(element('p','explain',tr('locked')),element('p','explain',tr('constraintHelp')));out.append(box);$('export-area').hidden=true;return;
  }
  const count=element('div','repair-count');const words=element('span','',tr('changes'));words.append(element('small','',tr('exact')));count.append(element('strong','',String(result.cost)),words);out.append(count);
  const list=element('div','mapping');
  for(const s of result.assignments){const r=element('div',`mapping-row${s.changed?'':' unchanged'}`);r.append(element('span','mapping-id',s.id),element('span','old-pin',`D${s.previousPin}`),element('span','arrow',s.changed?'→':'·'),element('span','new-pin',`D${s.pin}`),element('span','mapping-tag',tr(s.fixed?'fixedTag':s.changed?'changed':'unchanged')));list.append(r);}out.append(list,element('p','explain',isFixture()?tr('lower'):tr('countExplain')),timers());
  const changes=result.frequencyChanges;
  if(changes.length){const note=element('div','callout');note.append(element('strong','',tr('warningTitle')));for(const c of changes)note.append(element('div','',`${c.id}: ${c.fromHz===null?'—':c.fromHz.toFixed(2)} Hz → ${c.toHz.toFixed(2)} Hz`));note.append(element('div','',lang==='ja'?'LED 輝度用のみ。波形の周波数は保存しません。':'LED brightness only. Waveform frequency is not preserved.'));out.append(note);}else out.append(element('p','explain',tr('noFrequency')));
  $('ack-wrap').hidden=!changes.length;$('download').disabled=changes.length>0&&!$('ack').checked;
  $('code').textContent=exportFiles(state)['pins.h'];$('export-area').hidden=false;
}
function run(){revision++;try{validate(state);result=solve(state);dirty=false;announce('');$('ack').checked=false;renderResult();}catch(e){invalidate();announce(errorText(e));}}
$('signals').addEventListener('input',event=>{const e=event.target,key=e.dataset.key;if(!key)return;const row=e.closest('.signal-row');const i=Number(row.dataset.index);state.signals[i][key]=key==='fixed'?e.checked:key==='pin'?Number(e.value):e.value;if(key==='id'){row.querySelector('[data-key=type]').setAttribute('aria-label',`${tr('kind')} ${e.value}`);row.querySelector('[data-key=pin]').setAttribute('aria-label',`${tr('pin')} ${e.value}`);row.querySelector('[data-key=fixed]').setAttribute('aria-label',`${tr('fixedLabel')} ${e.value}`);row.querySelector('.remove').setAttribute('aria-label',`${tr('remove')} ${e.value}`);}invalidate();});
$('signals').addEventListener('change',event=>{if(event.target.dataset.key==='type')renderRows();});
for(const id of ['servo','tone'])$(id).addEventListener('change',()=>{state.features[id]=$(id).checked;renderRows();invalidate();});
$('unavailable').addEventListener('change',()=>{state.unavailable=[...$('unavailable').querySelectorAll('input:checked')].map(e=>Number(e.value));invalidate();});
$('solve').addEventListener('click',run);
$('reset').addEventListener('click',()=>{revision++;state=example();renderInputs();run();});
$('add').addEventListener('click',()=>{if(state.signals.length>=12)return;let i=1;while(state.signals.some(s=>s.id===`SIGNAL_${i}`))i++;state.signals.push({id:`SIGNAL_${i}`,type:'digital-out',pin:2,fixed:false});renderRows();invalidate();$('signals').lastElementChild.firstElementChild.focus();});
$('ack').addEventListener('change',()=>{if(result?.status==='solved')$('download').disabled=result.frequencyChanges.length>0&&!$('ack').checked;});
$('import-button').addEventListener('click',()=>$('import').click());
$('import').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;const token=++revision;try{if(file.size>=65536)throw new Error(tr('tooBig'));const text=await file.text();if(token!==revision)return;const parsed=JSON.parse(text);validate(parsed);state={schema:parsed.schema,features:{...parsed.features},unavailable:[...parsed.unavailable],signals:parsed.signals.map(({id,type,pin,fixed})=>({id,type,pin,fixed}))};renderInputs();run();}catch(e){if(token===revision)announce(tr('parseError')+errorText(e));}});
$('download').addEventListener('click',()=>{try{if(dirty||result?.status!=='solved')return;if(result.frequencyChanges.length&&!$('ack').checked){announce(tr('needAck'));return;}const files=exportFiles(state);const bundle=Object.fromEntries(Object.entries(files).map(([name,text])=>[`PinMendDemo/${name}`,text]));const blob=new Blob([zipFiles(bundle)],{type:'application/zip'}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download='PinMendDemo.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){announce(tr('exportError')+errorText(e));}});
$('language').addEventListener('click',()=>{lang=lang==='ja'?'en':'ja';document.documentElement.lang=lang;$('language').textContent=lang==='ja'?'EN':'日本語';$('language').setAttribute('aria-label',lang==='ja'?'Switch to English':'日本語に切り替え');for(const e of document.querySelectorAll('[data-i18n]')){const value=lang==='en'?en[e.dataset.i18n]:initial.get(e.dataset.i18n);if(e.dataset.i18n==='title')e.innerHTML=value;else e.textContent=value;}renderInputs();if(dirty)invalidate();else renderResult();});
let previewWasOpen=false,printing=false;
window.addEventListener('beforeprint',()=>{if(!printing){const d=$('code').parentElement;previewWasOpen=d.open;printing=true;d.open=true;}});
window.addEventListener('afterprint',()=>{if(printing){$('code').parentElement.open=previewWasOpen;printing=false;}});
renderInputs();run();
