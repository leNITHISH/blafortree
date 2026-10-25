---
title: cronen
tagline: see what pacman -Syu is about to do before you run it
stack: [Go, TUI, Arch Linux]
year: 2026
repo: https://github.com/leNITHISH/cronen
rank: 2
---

A terminal UI for Arch Linux. Before you run `pacman -Syu`, it shows the pending repo and AUR updates, the Arch news you haven't read, anything that needs manual intervention, and risky packages (kernel, GPU drivers, glibc, systemd), with links to upstream and the packaging changelog. When you're happy, `U` hands the terminal to `sudo pacman -Syu` or your AUR helper.

It only reads. It never runs `pacman -Sy`, so it can't cause a partial upgrade: pending updates come from `checkupdates`, which syncs a temporary copy of the database.

There's a [demo GIF](https://github.com/leNITHISH/cronen/blob/main/doc/demo.gif), recorded from `cronen --demo`, which runs the TUI on bundled sample data and touches nothing.

## Install

```sh
git clone https://github.com/leNITHISH/cronen.git
cd cronen
makepkg -si
```

The bundled PKGBUILD builds the latest commit as `cronen-git`. `go install github.com/leNITHISH/cronen/cmd/cronen@latest` installs just the binary.

## Scripting

`cronen --check` prints a short summary, most important first, and its exit code says what it found:

| code | meaning |
|---|---|
| 0 | nothing to do |
| 10 | updates available |
| 20 | at least one update is flagged |
| 30 | an unread news item requires manual intervention |
| 1 | a source (checkupdates, the AUR, the news feed) failed |

Any failed source makes the exit code 1, even if the rest looked fine. With a source missing, cronen can't tell "nothing to do" from "didn't look".

```
$ cronen --check
18 updates (2 AUR) · 11 flagged · 2 unread news · 1 .pacnew
‼ manual intervention: linux-firmware >= 20251021-1 upgrade requires manual intervention
‼ linux-firmware: Manual intervention in news: '…' (yesterday)
⚠ nvidia-utils: Mentioned in news: 'NVIDIA 590 driver drops Pascal support' (yesterday)
…
reboot after upgrading: the kernel is updated
```

`cronen --json` prints the same state as one JSON object, and `cronen --json --waybar` formats it as a Waybar custom module: the update count, the summary as a tooltip, and a class (`updates`, `attention`, `critical`, `error`) to style it by.

## Details

- After an upgrade it reloads everything, counts the `.pacnew` files waiting for `pacdiff`, and tells you whether to reboot for a new kernel.
- News only counts as read after an upgrade that exits 0.
- Config lives in `~/.config/cronen/config.toml`: AUR helper, a watchlist of package globs, how many days of news to show, and packages whose major version bumps shouldn't be flagged.
- News and AUR responses are cached for 15 minutes.
- `man cronen` documents everything. CI runs `make test` and `make lint`. MIT licensed.
