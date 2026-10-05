# Product hypothesis and boundaries

## Intended user and task

A maker or beginner has an already-working Uno LED/button experiment, then adds Servo and a buzzer tone. The program may still compile even though a timer-based PWM output no longer behaves as expected. They need a short, inspectable rewiring plan that respects immovable connections.

The unit of value is an explicit minimum number of changed signal assignments, followed by downloadable original code that demonstrates the repaired mapping. The strongest initial use case is debugging a small learning project or documenting why a workshop exercise needs a pin change. No paid demand, customer interviews, market size, or commercial readiness have been established.

## Relationship to existing tools

- [Arduino CLI](https://docs.arduino.cc/arduino-cli/getting-started/) supplies compilation and board/library tooling. PinMend uses it only as a test consumer; a successful compile alone is not the timer-conflict diagnosis
- [Wokwi's Uno simulation](https://docs.wokwi.com/parts/wokwi-arduino-uno) offers a much broader circuit/program simulation surface. PinMend focuses on a declarative, minimum-change assignment with fixed/unavailable constraints and a small source export
- [AVR8js](https://github.com/wokwi/avr8js) supplies instruction-level CPU/timer/GPIO simulation. PinMend does not replace or redistribute it; test code uses it to inspect the compiled result

Direct pin-planning competitors also matter:

- [Robot Maker Toolkit](https://play.google.com/store/apps/details?id=com.infinitx.maker.toolkit) already advertises automatic repair of clashing pin assignments and generation of a sketch pin map. Generic “pin conflict repair” is therefore not a defensible novelty claim
- [uPinly](https://github.com/eggfly/uPinly) documents visual pin allocation, functional/electrical conflict detection, and image/CSV/PDF exports
- [EDAsolver](https://edasolver.com/) describes automated component selection and pin matching from a JSON-based specification

The inspected documentation does not establish the specific combination of Uno library-timer exclusions, fixed existing assignments, a proved minimum changed-assignment count, and executable before/after waveform evidence. That is a limited documentation-based distinction, not evidence those products lack undocumented features. The existing competitors make a broad multi-board planner less compelling than this small, verified repair workflow.

These are scope distinctions supported by the linked tool documentation, not a claim that no existing product can solve a similar problem. There has been no exhaustive prior-art or patent search, and no novelty or patentability assertion is made.

## Why the bounded profile matters

Uno R3 is not interchangeable with Uno R4, Nano Every, ESP32, Mega, or alternative Servo/tone libraries. Additional libraries can alter timer behavior. Supporting more boards without official-source profiles and compiled behavioral fixtures would make the result misleading. This version therefore rejects unknown signal types and undeclared extra constraints.

Frequency-preserving protocols, motor safety, electrical constraints, arbitrary source transformations, physical-device control and energy optimization are excluded. A lower rewiring count does not imply lower energy use or safer hardware.
