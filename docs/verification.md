# Verification contract

## Solver

State is `(signalIndex, usedPinMask)` with 12 assignable pins. Each step considers every valid unused pin. Edge cost is 0 when preserving a signal's old pin and 1 otherwise. The minimum suffix cost gives a global minimum. Rows and domains are sorted; retaining the first equal-cost branch yields the lexicographically smallest assigned-pin sequence in signal-ID order. Inactive Servo/tone rows are omitted. Fixed rows have singleton domains, subject to capabilities and unavailable pins.

An infeasible result can arise from an empty domain, aggregate PWM capacity, or distinct-pin assignment failure. Explanations distinguish these cases and never generate a source bundle without a full assignment.

The independent Python oracle enumerates complete Cartesian products and rejects duplicate assignments. It does not call the solver or reuse its implementation. The fixture has an additional hand-checkable lower bound, beyond cross-implementation agreement.

## Native gate

The official pinned Arduino toolchain compiles the exact generated demonstration for `arduino:avr:uno`. Every compilation checks the CLI JSON result for the actual board/build platform version 1.8.8, ATmega328P, 16 MHz, and active Servo library version 1.3.0; reported versions do not come only from the planner profile. AVR8js executes the emitted firmware at 16 MHz with the Uno timer and GPIO models. Firmware is kept in temporary directories and removed; no HEX, ELF, compiler output, SDK source, or raw edge trace is distributed.

For hosted browser verification, the native gate validates the exact four source entries in each actual browser ZIP, compares them against the corresponding expected original export, and compiles those downloaded bytes. This is separate from the earlier generated-source feasibility gate.

Assertions use a post-feature 100–280 ms window. PWM frequency tolerance is 3 Hz; 25%/75% duty tolerance is 0.015. Servo period tolerance is 100 μs around 20 ms and pulse tolerance 50 μs around 1,500 μs. Tone frequency tolerance is 5 Hz around 1 kHz, duty tolerance 0.015. The old D9/D10 negative control must have fewer than three post-feature edges per pin. Pre-feature PWM is separately required to be present, proving that the negative control actually demonstrated timer takeover.

These tolerances establish bounded simulated behavior. They do not certify electrical characteristics, physical servo motion, real component response, worst-case jitter, arbitrary library combinations, or sketch equivalence.

## Browser gate

Hosted Ubuntu 22.04 and system Chrome with `chromiumSandbox: true`. Screenshots use installed Japanese system fonts, never bundled fonts. No `--no-sandbox`, no external website access from the application. A report and five screenshots record desktop JA/EN, infeasible EN, and mobile JA/EN. Smaller 320 px layout is checked for overflow.

## Reproduction and evidence

`evidence/native-verification.json` records measured quantities, source digests, exact tool versions, source origin, and assertion pass state. `evidence/independent-oracle.json` records oracle coverage. GitHub Actions reports the commit actually tested; inspect that exact commit rather than inferring completion from local source generation.
