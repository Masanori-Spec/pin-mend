// Test-only official compilation and instruction-level GPIO measurement.
// No compiler, dependency source, ELF/HEX, or raw trace is distributed.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {CPU, avrInstruction, AVRIOPort, portBConfig, portDConfig, AVRTimer, timer0Config, timer1Config, timer2Config} from 'avr8js';
import {example, PROFILE} from '../src/profile.mjs';
import {exportFiles} from '../src/export.mjs';
const cli=process.env.ARDUINO_CLI || 'arduino-cli';
const cliVersion=execFileSync(cli,['version'],{encoding:'utf8'}).trim();
assert.match(cliVersion,/Version: 1\.5\.1\b/);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pinmend-verify-'));
const hash=s=>createHash('sha256').update(s).digest('hex');
function compile(dir,build,servoActive){
  const raw=execFileSync(cli,['compile','--json','--fqbn',PROFILE.fqbn,'--build-path',build,dir],{encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});
  const output=JSON.parse(raw);assert.equal(output.success,true);const actual=output.builder_result;
  assert.equal(actual.board_platform.id,'arduino:avr');assert.equal(actual.board_platform.version,'1.8.8');
  assert.equal(actual.build_platform.id,'arduino:avr');assert.equal(actual.build_platform.version,'1.8.8');
  assert.ok(actual.build_properties.includes('build.mcu=atmega328p'));assert.ok(actual.build_properties.includes('build.f_cpu=16000000L'));
  const servo=actual.used_libraries?.find(x=>x.name==='Servo');if(servoActive)assert.equal(servo?.version,'1.3.0');
  return {core:actual.build_platform.version,servo:servo?.version??null,mcu:'atmega328p',clockHz:16000000};
}

function loadHex(text) {
  const bytes=new Uint8Array(32768); let base=0;
  for(const line of text.trim().split(/\r?\n/)) {
    assert.ok(/^:[\da-f]+$/i.test(line)); const values=Buffer.from(line.slice(1),'hex');
    assert.equal(values.reduce((a,b)=>a+b,0)&255,0,'Intel HEX checksum');
    const size=values[0],address=(values[1]<<8)|values[2],type=values[3];
    if(type===0) {assert.ok(base+address+size<=bytes.length); bytes.set(values.subarray(4,4+size),base+address);}
    else if(type===4) base=((values[4]<<8)|values[5])*65536;
    else if(type===1) break;
    else assert.ok([2,3,5].includes(type),'Known HEX record');
  }
  return new Uint16Array(bytes.buffer);
}
function simulate(hex) {
  const cpu=new CPU(loadHex(hex)); const b=new AVRIOPort(cpu,portBConfig); const d=new AVRIOPort(cpu,portDConfig);
  new AVRTimer(cpu,timer0Config); new AVRTimer(cpu,timer1Config); new AVRTimer(cpu,timer2Config);
  const edges=Object.fromEntries(Array.from({length:12},(_,i)=>[i+2,[]]));
  for(const [port,offset,max] of [[d,0,8],[b,8,6]]) port.addListener((value,old)=>{
    for(let bit=0;bit<max;bit++){const pin=offset+bit; if(edges[pin] && ((value^old)&(1<<bit))) edges[pin].push({cycle:cpu.cycles,high:Boolean(value&(1<<bit))});}
  });
  const end=PROFILE.clockHz*0.3;
  while(cpu.cycles<end){avrInstruction(cpu); cpu.tick();}
  return {edges,cycles:cpu.cycles};
}
function summarize(edges,pin,startMs=100,endMs=280) {
  const e=edges[pin].filter(x=>x.cycle>=startMs*16000&&x.cycle<endMs*16000);
  const rise=e.filter(x=>x.high); const periods=rise.slice(1).map((x,i)=>(x.cycle-rise[i].cycle)/16);
  const widths=[]; for(let i=0;i<e.length-1;i++)if(e[i].high&&!e[i+1].high) widths.push((e[i+1].cycle-e[i].cycle)/16);
  const mean=a=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
  const period=mean(periods),high=mean(widths);
  return {pin,windowMs:[startMs,endMs],edgeCount:e.length,periods:periods.length,frequencyHz:period?1e6/period:null,meanPeriodUs:period,meanHighUs:high,dutyFraction:period&&high?high/period:null,minPeriodUs:periods.length?Math.min(...periods):null,maxPeriodUs:periods.length?Math.max(...periods):null};
}
function near(actual,target,tolerance,label){assert.ok(Number.isFinite(actual)&&Math.abs(actual-target)<=tolerance,`${label}: ${actual} expected ${target} ± ${tolerance}`);}
const cases=[];
try {
  for(const [name,features,old] of [['both-repaired',{servo:true,tone:true},false],['both-old-negative',{servo:true,tone:true},true],['no-features-original',{servo:false,tone:false},false],['servo-only-repaired',{servo:true,tone:false},false]]) {
    let files=exportFiles(example(features));
    if(process.env.PINMEND_BROWSER_DOWNLOADS&&!old){
      const archive=path.resolve(process.env.PINMEND_BROWSER_DOWNLOADS,`${name}.zip`);
      const actual=JSON.parse(execFileSync('python3',['scripts/read-bundle.py',archive],{encoding:'utf8'}));
      assert.deepEqual(actual,files,'Compile the exact browser download, matching expected original sources');
      files=actual;
    }
    if(old)files['pins.h']=files['pins.h'].replace(/PINMEND_PIN_LED_A = 5;/,'PINMEND_PIN_LED_A = 9;').replace(/PINMEND_PIN_LED_B = 6;/,'PINMEND_PIN_LED_B = 10;').replace(/PINMEND_PIN_BUTTON_A = 2;/,'PINMEND_PIN_BUTTON_A = 5;').replace(/PINMEND_PIN_BUTTON_B = 3;/,'PINMEND_PIN_BUTTON_B = 6;');
    const dir=path.join(temp,name,'PinMendDemo'); await fs.mkdir(dir,{recursive:true});
    for(const key of ['pins.h','PinMendDemo.ino'])await fs.writeFile(path.join(dir,key),files[key]);
    const build=path.join(temp,name,'build');
    const verifiedCompileTarget=compile(dir,build,features.servo);
    const hex=await fs.readFile(path.join(build,'PinMendDemo.ino.hex'),'utf8');
    const sim=simulate(hex);
    const report={name,compiled:true,verifiedCompileTarget,sourceOrigin:process.env.PINMEND_BROWSER_DOWNLOADS&&!old?'actual-browser-download':'generated-source',sourceSha256:hash(files['PinMendDemo.ino']),pinsSha256:hash(files['pins.h']),cycles:sim.cycles,measurements:{}};
    const pins=old?[9,10]:features.servo?(features.tone?[5,6]:[3,11]):[9,10];
    for(const [i,pin] of pins.entries()) {
      const pre=summarize(sim.edges,pin,15,50),post=summarize(sim.edges,pin);
      report.measurements[`LED_${i?'B':'A'}`]={pre,post};
      near(pre.frequencyHz,PROFILE.pwmHz[pin],3,'Pre-feature PWM frequency');
      if(old) assert.ok(post.edgeCount<3,'Negative control must lose sustained PWM after Servo takes Timer1');
      else {near(post.frequencyHz,PROFILE.pwmHz[pin],3,'Repaired PWM frequency');near(post.dutyFraction,i?0.75:0.25,0.015,'PWM duty');}
    }
    if(features.servo){const m=summarize(sim.edges,8);report.measurements.SERVO=m;near(m.meanPeriodUs,20000,100,'Servo period');near(m.meanHighUs,1500,50,'Servo pulse');}
    if(features.tone){const m=summarize(sim.edges,12);report.measurements.TONE=m;near(m.frequencyHz,1000,5,'tone frequency');near(m.dutyFraction,0.5,0.015,'tone duty');}
    cases.push(report);
    console.log(`${name}: official compile + GPIO assertions passed`);
  }
  const aliasIds=['A0','A1','A2','A3','A4','A5','A6','A7','SPI_SS','SPI_MOSI','WIRE_SDA','WIRE_SCL'];
  const aliasInput={schema:'pinmend/1',features:{servo:false,tone:false},unavailable:[],signals:aliasIds.map((id,i)=>({id,type:'digital-out',pin:i+2,fixed:false}))};
  let aliasFiles=exportFiles(aliasInput);
  if(process.env.PINMEND_BROWSER_DOWNLOADS){const actual=JSON.parse(execFileSync('python3',['scripts/read-bundle.py',path.resolve(process.env.PINMEND_BROWSER_DOWNLOADS,'custom-aliases.zip')],{encoding:'utf8'}));assert.deepEqual(actual,aliasFiles);aliasFiles=actual;}
  const aliasDir=path.join(temp,'Aliases');await fs.mkdir(aliasDir);
  await fs.writeFile(path.join(aliasDir,'Aliases.ino'),aliasFiles['PinMendDemo.ino']);await fs.writeFile(path.join(aliasDir,'pins.h'),aliasFiles['pins.h']);
  compile(aliasDir,path.join(temp,'alias-build'),false);
  console.log('Core macro alias names: official compile passed');
  const evidence={schema:'pinmend-native-evidence/1',status:'passed',extraCompiles:[{name:'core-macro-alias-identifiers',status:'passed',signalIds:aliasIds}],profile:PROFILE,cliVersion,simulator:'avr8js@0.21.1',method:'Official generated demo source compiled to Uno firmware; AVR instruction execution and GPIO edge measurement. Firmware and raw traces stay temporary.',limitations:['Simulator result only, not hardware/electrical validation','New LED carrier 976.56 Hz vs previous 490.20 Hz: not waveform preserving'],cases};
  await fs.mkdir('evidence',{recursive:true});await fs.writeFile('evidence/native-verification.json',JSON.stringify(evidence,null,2)+'\n');
} finally {await fs.rm(temp,{recursive:true,force:true});}
