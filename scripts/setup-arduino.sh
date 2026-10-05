#!/usr/bin/env bash
# Test-only dependencies. Keep this directory outside the published package.
set -euo pipefail
base="${PINMEND_TOOLCHAIN_DIR:-${RUNNER_TEMP:-/tmp}/pinmend-toolchain}"
mkdir -p "$base/bin" "$base/data" "$base/user" "$base/downloads"
export ARDUINO_DIRECTORIES_DATA="$base/data" ARDUINO_DIRECTORIES_USER="$base/user" ARDUINO_DIRECTORIES_DOWNLOADS="$base/downloads"
# Arduino CLI uses its own proxy setting; respect an existing environment proxy.
if [ -n "${HTTPS_PROXY:-}" ]; then export ARDUINO_NETWORK_PROXY="$HTTPS_PROXY"; fi
curl -fsSL --retry 2 https://downloads.arduino.cc/arduino-cli/arduino-cli_1.5.1_Linux_64bit.tar.gz -o "$base/cli.tar.gz"
curl -fsSL --retry 2 https://github.com/arduino/arduino-cli/releases/download/v1.5.1/1.5.1-checksums.txt -o "$base/checksums.txt"
(cd "$base"; grep 'arduino-cli_1.5.1_Linux_64bit.tar.gz$' checksums.txt | sed 's#arduino-cli_1.5.1_Linux_64bit.tar.gz#cli.tar.gz#' | sha256sum -c -)
tar -xzf "$base/cli.tar.gz" -C "$base/bin" arduino-cli
"$base/bin/arduino-cli" core update-index
"$base/bin/arduino-cli" core install arduino:avr@1.8.8
"$base/bin/arduino-cli" lib install Servo@1.3.0
if [ -n "${GITHUB_ENV:-}" ]; then
  printf 'ARDUINO_CLI=%s\nARDUINO_DIRECTORIES_DATA=%s\nARDUINO_DIRECTORIES_USER=%s\nARDUINO_DIRECTORIES_DOWNLOADS=%s\n' "$base/bin/arduino-cli" "$base/data" "$base/user" "$base/downloads" >> "$GITHUB_ENV"
fi
