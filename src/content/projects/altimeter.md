---
title: altimeter
tagline: a barometric altimeter on an 8051, in C with SDCC
stack: [C, SDCC, AT89S52, BMP280]
year: 2026
repo: https://github.com/leNITHISH/altimeter
rank: 4
accent: '#9866f0'
---

An AT89S52 reads a BMP280 pressure sensor over bit-banged I2C, converts pressure to altitude, and shows altitude, temperature and pressure on a 16x2 character LCD. A push button zeroes the altitude at the current height, so you can lift the board 1 m and watch it read +1.0 m.

It's a Microprocessors and Microcontrollers course project, written in C for SDCC on Arch Linux and flashed with avrdude through a USBasp clone. No Keil, no Windows.

```
Alt:     1.0 m R     <- metres; R = relative (zeroed), A = absolute
T 32.8C P1013.9      <- °C, hPa
```

## Tested on the board

| feature | result |
|---|---|
| I2C scan | sensor found at 0x76 |
| chip ID | 0x58, a BMP280 (sold as a BME280) |
| temperature and pressure | 32.8 °C, 1013.9 hPa in a warm room |
| zero button | tap zeroes, hold 2 s returns to absolute mode |
| lift test | about +1 m when raised 1 m, back to about 0 when lowered |

The UART debug output is written but untested, because the only programmer available is a USBasp with no serial port.

## Fitting in 8 KB of flash and 256 bytes of RAM

Flash wasn't the problem: the current build uses 6,402 of 8,192 bytes. RAM was.

- The standard-atmosphere formula needs a fractional power. SDCC's `powf` pushed the image to about 7.3 KB and overflowed direct RAM. It's now a 61-point table from 50 to 110 kPa, kept in flash and interpolated linearly. The worst error is 0.27 m at the high-altitude end and under 0.1 m near sea level.
- SDCC's small model gives every local variable a fixed slot in direct RAM. The first build needed 125 bytes there and failed to link. Calibration data and buffers moved to `__idata`, and the 32-bit compensation functions were marked `__reentrant` so their locals live on the stack. The stack now has 104 bytes free.
- There's no `printf`, which is several KB in SDCC. A small fixed-point formatter prints tenths.
- Smoothing is one 32-bit exponential running average with a 1/8 weight, instead of a 32-byte sample array.

## Contrast without a potentiometer

The LCD needs its contrast pin slightly above 0 V, which normally comes from a pot. There wasn't one, and the resistors on hand blanked the screen. So the pin goes to a spare port pin, and a Timer2 interrupt toggles it at 3.6 kHz with a 40% duty cycle. The handler is written in assembly and touches neither the accumulator nor the flags, so there's nothing to save, and the PWM costs about 10% of the CPU.

One SDCC gotcha came out of this: SDCC only builds the interrupt vector table from handler prototypes visible in the file that holds `main()`. Without the prototype the build succeeds, and the first Timer2 interrupt jumps into unrelated code.

## Bring-up

Each stage was flashed and checked on the hardware as its own commit: LED blink, LCD driver, I2C scan and chip ID, compensation and altitude, the zero button, contrast PWM. Flashing takes about 26 ms per byte, so a full write and verify of the 6.4 KB image takes roughly 3 minutes.

Known limits: at 32 °C, relative heights read 5 to 6% low, because the table assumes 15 °C air. Weather drift of 0.1 hPa looks like about 0.8 m. The zero reference is lost at power-off, because the chip has no EEPROM.
