# PinMend

Minimum-rewire timer-conflict repair for one deliberately bounded Arduino Uno profile.

日本語 / English UI. Open `dist/index.html` directly, or run `npm run serve` after a build. The application is one original standalone HTML file with zero runtime dependencies, no network calls, no storage, and no hardware access.

## The useful problem

Adding Servo to an Uno takes Timer1 away from normal `analogWrite()` on D9/D10. A simultaneous tone occupies Timer2, excluding PWM on D3/D11. When the remaining PWM pins are occupied, fixing the LEDs also requires moving other signals. PinMend computes the fewest changed signal assignments while honoring locked and unavailable pins, explains the result, and exports an original compilable demonstration.

### Acceptance fixture

Start with LED_A=D9, LED_B=D10, BUTTON_A=D5, BUTTON_B=D6, fixed SERVO=D8, and fixed TONE=D12.

- Both peripherals: LEDs → D5/D6, buttons → D2/D3. Exactly **4** changed assignments
- No peripherals: **0** changes
- Servo only: LEDs → D3/D11. Exactly **2** changes
- Both peripherals with BUTTON_A fixed to D5: infeasible, **2** PWM signals need the **1** remaining PWM pin

The four-change lower bound is direct: both LEDs must leave Timer1; D5/D6 are the only surviving PWM pins, so both buttons must leave them. The computed plan reaches that lower bound. This is not a count of physical disconnect/reconnect operations or a wire-length optimum.

## Scope and exports

- Arduino Uno R3, ATmega328P, 16 MHz
- D2–D13; D0/D1 are reserved. Analog pins are not modeled
- Digital input/output and **LED-brightness** PWM; at most one Servo and one tone
- Fixed assignments and unavailable pins; exact minimum changed-assignment count
- Deterministic tie-break: lexicographic assigned pins in ascending signal-ID order
- Strict `pinmend/1` JSON: unknown fields are rejected rather than silently discarded

A download contains `PinMendDemo/pins.h`, `PinMendDemo/PinMendDemo.ino`, `wiring-changes.json`, and `pinmend-project.json`. The ZIP is generated in-browser using an original uncompressed ZIP writer. The source is an original bounded demonstration, not a rewrite of your sketch. IDs use a `PINMEND_PIN_` prefix to avoid Arduino core macro aliases.

**Frequency is not preserved.** D9/D10 normally run at approximately 490.20 Hz; D5/D6 run at 976.56 Hz (often rounded to 980 Hz). The UI makes this change explicit and requires acceptance before exporting a frequency-changing plan. The scope is LED brightness, never arbitrary PWM protocols, motor control, or precision waveforms.

No arbitrary sketch parsing, hardware uploads, electrical safety validation, energy-saving claim, third-party customer contact, or patentability claim. Physical hardware has not been tested. Follow the board and component documentation before any hardware use.

## Verification

```sh
npm ci --ignore-scripts
npm run check
# Hosted Ubuntu 22.04, sandbox enabled:
CHROME_BIN=/usr/bin/google-chrome npm run test:browser
bash scripts/setup-arduino.sh
# For local CLI use, set ARDUINO_CLI and ARDUINO_DIRECTORIES_* to the isolated toolchain.
npm run test:native
```

- Node unit tests cover features, locks, unavailable pins, invalid/hostile input, ties, exports, core-macro names and ZIP determinism
- Independent Python Cartesian-product enumeration compares the JS solver to 245 seeded and fixture cases
- Official Arduino CLI **1.5.1**, Arduino AVR core **1.8.8**, Servo **1.3.0**
- AVR8js **0.21.1**, test-only: execute compiled instructions and measure GPIO edges
- Four waveform cases: repaired dual-peripheral, old-map negative control, no-peripheral baseline, Servo-only repair
- Separate official compile case checks user IDs that overlap common core macro aliases
- Browser CI exercises JA/EN, desktop/mobile, keyboard controls, stale result invalidation, import errors, infeasibility, and actual ZIP downloads; those actual downloaded sources then pass official compilation and waveform checks

The negative control starts PWM, waits 60 ms, then attaches Servo and starts tone. Measurements compare 15–50 ms against 100–280 ms, avoiding a false “passes” result from the pre-attachment window. Expected dual-peripheral behavior is lost sustained PWM on old D9/D10 but correct repaired D5/D6 PWM, 1,500 μs Servo pulses at about 20 ms intervals, and approximately 1 kHz tone.

Current checked-in numerical evidence reflects the local generated-source gate; hosted browser results must be reviewed on the published commit before calling browser verification complete. Tests are simulations, not electrical or physical-device certification.

## Distribution boundary

Only original app/demo/test source, independently expressed factual profiles, documentation, lockfile metadata, original graphics, and safe numerical summaries belong in the publication allowlist. `scripts/package.py` writes a hash manifest and a clean source ZIP from exact allowed paths.

Third-party SDKs, toolchains, libraries, downloaded archives, compiled firmware, caches, raw GPIO traces, response bodies, and local browser traces are excluded. Test dependencies are installed separately from official or recognized package sources. No license for this original project has been selected here. See `docs/dependencies.md` and `docs/sources.md`.
