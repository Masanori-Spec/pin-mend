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

Hosted Ubuntu 22.04 and system Chrome with `chromiumSandbox: true`. Screenshots use installed Japanese system fonts, never bundled fonts. No `--no-sandbox`, no external website access from the application. A report and five screen screenshots record desktop JA/EN, infeasible EN, and mobile JA/EN. Smaller 320 px layout is checked for overflow. Two further PNGs render actual browser-generated A4 print PDFs. The default repaired plan fits one page in both languages; generated pin constants and the carrier-frequency warning are present. Temporary PDFs are removed, avoiding redistribution of embedded system fonts. The print gate also verifies restoration of the code-preview open state.

## Reproduction and evidence

`evidence/native-verification.json` records measured quantities, source digests, exact tool versions, source origin, and assertion pass state. `evidence/independent-oracle.json` records oracle coverage. GitHub Actions reports the commit actually tested; inspect that exact commit rather than inferring completion from local source generation.


## Verified hosted result (2026-10-05)

- Runtime/source commit: `c6d50b0bc6cd13ca8b4eca97b5744b323bba3537`
- [GitHub Actions run 37253528302](https://github.com/Masanori-Spec/pin-mend/actions/runs/37253528302): all three jobs passed
- Node 22 and Node 24: 17 unit tests and 245 independent oracle cases, deterministic fixture and standalone build
- Browser: 21 checks, four actual ZIP downloads, no page errors or external application requests; sandbox enabled
- Desktop JA/EN, mobile JA/EN, infeasibility and both actual rendered print pages inspected
- Native: actual downloaded sources for repaired dual-peripheral, no-peripheral original and Servo-only repair; separately generated old-map negative control; custom downloaded alias/pin source also compiled
- Each native compile confirms Arduino AVR 1.8.8, ATmega328P, 16 MHz, and Servo 1.3.0 when active, from the official CLI JSON result

Measured repaired D5/D6 carrier is approximately 976.563 Hz, versus approximately 490.196 Hz before repair on D9/D10. The old D9/D10 fixture loses sustained PWM after Servo attachment. Repaired Servo and tone satisfy the stated tolerances. Full numerical measurements are in `evidence/native-verification.json`.

An independent reviewer additionally checked 21,336 assignment cases and four custom compile configurations outside the checked-in 245-case test suite. Those additional checks are review evidence; the reproducible repository test count remains 245.

The initial browser test caught an asynchronous import-assertion race in the test harness; auto-waiting assertions replaced immediate reads. Pixel inspection then caught a JA→EN→JA translation markup leak; the source now snapshots plain text for non-title translations and tests the round trip. The final hosted run covers both fixes, live accessible-label refresh, and interrupted-import protection.

### Remaining bounds

No physical board or connected device was used. No electrical, power, real-time jitter, arbitrary-library interaction, or arbitrary-sketch-preservation claim follows from these results. Keyboard flows were exercised, but no formal screen-reader audit was performed. Print validation covers the included six-signal repaired fixture, not every possible maximal input. The broader commercial usefulness and undocumented competitor capabilities remain unverified.
