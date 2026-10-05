// Original PinMend demonstrator. No user sketch parsing or hardware upload.
// Uno R3 / ATmega328P / 16 MHz / Arduino AVR 1.8.8 / Servo 1.3.0
// Simulation is not electrical validation. Review wiring and power before hardware use.
#include "pins.h"
#include <Servo.h>
Servo demoServo;

void setup() {
  pinMode(PINMEND_PIN_BUTTON_A, INPUT_PULLUP);
  pinMode(PINMEND_PIN_BUTTON_B, INPUT_PULLUP);
  analogWrite(PINMEND_PIN_LED_A, 64);
  analogWrite(PINMEND_PIN_LED_B, 192);
  // Establish PWM before taking over timers, exposing conflicts in the old mapping.
  delay(60);
  demoServo.attach(PINMEND_PIN_SERVO);
  demoServo.writeMicroseconds(1500);
  tone(PINMEND_PIN_TONE, 1000);
}

void loop() {
  // The demo holds fixed brightness and peripheral signals for waveform inspection.
}
