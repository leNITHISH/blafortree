---
title: meeseeks
tagline: a crash-safe log-structured key-value store in C
stack: [C11, POSIX, pthreads]
year: 2026
repo: https://github.com/leNITHISH/meeseeks
rank: 1
accent: '#2e81ee'
---

A key-value store modeled on [Bitcask](https://riak.com/assets/bitcask-intro.pdf). Every write is appended to a log, an in-memory hash index points at the newest record of each key, and every get is exactly one disk read. It needs nothing beyond libc and pthreads.

Most of the work went into proving that it survives crashes. The tests kill it with SIGKILL, corrupt and truncate its files at random byte positions, fill the disk halfway through a compaction, and replay a recorded trace of every write and fsync it made to build the disk image a power cut could leave at each point. All of it recovers to a state that actually existed.

## Numbers

Measured on a 2013 dual-core laptop (Core i3-4005U) with a budget DRAM-less SATA SSD on btrfs.

| measurement | result |
|---|---|
| writes, fsync on every write | 520/s from one thread, 2,200/s from 8 threads sharing fsyncs |
| writes, fsync every 100 | 39,000/s |
| writes, no fsync | 198,000/s |
| get latency, 1M keys | 1.9 µs p50 from the page cache, 122 µs p50 from the SSD |
| reads, 1M keys | 474,000/s from one thread, 1.14M/s from four |
| startup, 1M keys | 0.31 s from hint files, 1.4 s replaying 1 GB of segments |
| index memory | 66 bytes per key |
| gets while a compaction runs | p99.9 of 18.5 µs, worst 1.5 ms |
| TCP server, 8 pipelining clients | 189,000 requests/s at 90% GET |

## How it works

- **Records.** Each put or delete appends one record: a CRC-32 that also covers the header, a timestamp, the key and value sizes, the key, and the value. A delete writes a tombstone, because otherwise a restart would replay the old put and bring the key back. The CRC uses slice-by-8 tables, which made a full replay 3.7 times faster than the byte-at-a-time version.
- **Segments.** The log is split into 64 MiB files. Compaction output is named so that it sorts after its inputs and before the next log segment, which is what lets writes keep going while compaction runs.
- **Index.** An open-addressing hash table with 8-byte slots, 48-byte entries kept in chunks that never move, and keys of up to 16 bytes stored inline. The first version used about 120 bytes per key; this one uses 66. Keys are hashed with SipHash-1-3 under a random per-process key, so a client of the TCP server can't send keys that all collide.
- **Durability.** Fsync on every write, every N writes, or never, with group commit: with 8 writer threads and fsync on every write, each fsync covers about 4 writes. If any fsync fails, the store refuses all further writes until it is reopened. Linux may already have dropped the pages it couldn't write and won't report the error a second time, which is what PostgreSQL ran into in 2018.
- **Backups** hard-link the sealed segments, so they take milliseconds whatever the size of the store.

## Testing

Ten suites run in about 25 seconds, and again under AddressSanitizer + UBSan and ThreadSanitizer.

The power-failure checker works like this. An `LD_PRELOAD` shim records every create, write, truncate, fsync, rename and unlink the unmodified library makes. The test replays that log through a model of a POSIX filesystem and builds about 15,600 crash images per run: only what was fsynced, random subsets of unsynced sectors, reordered directory changes. Each image has to recover to the state after some prefix of the operations. To check the checker, I removed each of the eight fsyncs the store depends on, one at a time. It failed for all eight.

Bugs the tests found:

- glibc's reader-preferring rwlock let a steady stream of gets starve writers forever. The concurrency test just hung. Fixed with a turnstile that readers skip when no writer is waiting.
- A new segment's directory entry wasn't fsynced before records went into it, so a power cut could keep segment N+2 and lose N+1. Found by the checker's reordering model.
- A key ending in a carriage return could be stored but never read back over the protocol. Found by the fuzzer in CI.
- One 64 KB packet of pipelined `GET`s for a 900 KB value asked the server to buffer 7 GB of replies. Replies now go out once 1 MB is pending.

It also ships a TCP server with a line protocol, `kvcli` (a shell for a local store or a server) and `kvtool` (an offline checker and dump). Limits are listed in the [README](https://github.com/leNITHISH/meeseeks#known-limitations), and the plans in the [roadmap](https://github.com/leNITHISH/meeseeks/blob/main/ROADMAP.md).
