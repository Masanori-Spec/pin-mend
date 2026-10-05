// Original factual profile, independently expressed. Source links are in docs/sources.md.
export const PROFILE = Object.freeze({
  id: 'uno-r3-avr-1.8.8-servo-1.3.0', board: 'Arduino Uno R3', mcu: 'ATmega328P', clockHz: 16000000,
  fqbn: 'arduino:avr:uno', core: 'arduino:avr@1.8.8', servo: 'Servo@1.3.0', cli: '1.5.1',
  pins: Object.freeze(Array.from({length: 12}, (_, i) => i + 2)),
  pwmPins: Object.freeze([3, 5, 6, 9, 10, 11]),
  timers: Object.freeze({3: 2, 5: 0, 6: 0, 9: 1, 10: 1, 11: 2}),
  pwmHz: Object.freeze({3: 16000000 / 64 / 510, 5: 16000000 / 64 / 256, 6: 16000000 / 64 / 256, 9: 16000000 / 64 / 510, 10: 16000000 / 64 / 510, 11: 16000000 / 64 / 510})
});
export const TYPES = Object.freeze(['led-pwm', 'digital-in', 'digital-out', 'servo', 'tone']);
export function example(features = {servo: true, tone: true}) {
  return {schema: 'pinmend/1', features: {...features}, unavailable: [], signals: [
    {id:'LED_A', type:'led-pwm', pin:9, fixed:false},
    {id:'LED_B', type:'led-pwm', pin:10, fixed:false},
    {id:'BUTTON_A', type:'digital-in', pin:5, fixed:false},
    {id:'BUTTON_B', type:'digital-in', pin:6, fixed:false},
    {id:'SERVO', type:'servo', pin:8, fixed:true},
    {id:'TONE', type:'tone', pin:12, fixed:true}
  ]};
}
