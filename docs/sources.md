# Primary sources checked 2026-10-05

The factual profile is independently expressed; none of the source implementations below are copied into the app.

- [Arduino Uno R3](https://docs.arduino.cc/hardware/uno-rev3/): ATmega328P and board scope
- [Arduino AVR 1.8.8 release](https://github.com/arduino/ArduinoCore-avr/releases/tag/1.8.8): selected core version
- [Standard Uno pin mapping](https://github.com/arduino/ArduinoCore-avr/blob/1.8.8/variants/standard/pins_arduino.h): timer channels and standard pin aliases
- [Core timer initialization](https://github.com/arduino/ArduinoCore-avr/blob/1.8.8/cores/arduino/wiring.c): Timer0 fast PWM and Timer1/2 phase-correct modes; prescaler 64. At 16 MHz this gives 976.5625 Hz and 490.1961 Hz respectively
- [Core analogWrite](https://github.com/arduino/ArduinoCore-avr/blob/1.8.8/cores/arduino/wiring_analog.c): hardware PWM channels
- [Core tone implementation](https://github.com/arduino/ArduinoCore-avr/blob/1.8.8/cores/arduino/Tone.cpp): Timer2 use on the Uno
- [Servo 1.3.0 release](https://github.com/arduino-libraries/Servo/releases/tag/1.3.0), [AVR timer selection](https://github.com/arduino-libraries/Servo/blob/1.3.0/src/avr/ServoTimers.h), [implementation](https://github.com/arduino-libraries/Servo/blob/1.3.0/src/avr/Servo.cpp): Uno Timer1 allocation and Servo timing
- [Arduino CLI 1.5.1 release](https://github.com/arduino/arduino-cli/releases/tag/v1.5.1), [official checksums](https://github.com/arduino/arduino-cli/releases/download/v1.5.1/1.5.1-checksums.txt): official compiler frontend and binary verification
- [AVR8js](https://github.com/wokwi/avr8js), [0.21.1 package](https://www.npmjs.com/package/avr8js/v/0.21.1): instruction/timer/GPIO simulator used for tests, MIT package

Additional evidence is direct inspection of the installed official 1.8.8/1.3.0 source during tests and actual official compilation. Simulation establishes the stated four fixture behaviors, not every possible real Uno sketch.
