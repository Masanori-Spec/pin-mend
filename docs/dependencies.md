# Dependency and distribution boundary

## Runtime

Zero package dependencies. The shipped single-file app contains only original JS/CSS/HTML, a factual Uno profile, original CSS board artwork, and system-font preferences. No remote fonts, images, analytics, APIs, compiled firmware, or third-party source are bundled.

## Test only

- `avr8js@0.21.1`: MIT package, used only to execute locally compiled AVR instructions in tests. It is not embedded in the app or source ZIP; only package/lockfile references are included
- `@playwright/test@1.56.0`: browser-test dependency, not part of the browser app or source ZIP
- Arduino CLI 1.5.1 and official core/compiler/support packages: installed in an isolated temporary directory by the test setup, not redistributed
- Arduino Servo 1.3.0: installed by Arduino CLI for compilation tests, not redistributed
- System Chrome and Japanese system fonts: supplied by the hosted test runner, not redistributed

The original generated demo invokes the Arduino APIs by name. The distributed demo includes no copied library implementation. Test-only firmware may contain linked third-party material, so it is deliberately excluded from every publication path.

The public package is built from an exact positive file allowlist. The package step rejects symlinks, missing files, non-allowlisted extensions, and binary/compiled/toolchain entries. Adding dependencies or assets requires revisiting the distribution boundary. No project license choice is made by these files.
