---
title: paxcounter
tagline: an ESP32 crowd counter that follows phones across MAC randomization
stack: [ESP32-C3, C++, Java, DuckDB]
year: 2025
repo: https://github.com/leNITHISH/paxcounter
rank: 3
---

A Wi-Fi crowd-density counter. An ESP32 in promiscuous mode hops across channels 1 to 11 capturing probe requests, the frames phones broadcast while looking for networks. It hashes MAC addresses on the device and streams sightings over serial to a Java service, which links sightings across MAC randomization, removes duplicates, and logs CSV files that DuckDB queries turn into peak counts, visits, dwell time and occupancy over time.

```
ESP32 (promiscuous mode, channel hopping 1-11)
   |  RAM ring buffer: holds sightings while USB is disconnected
   |  UART @ 115200: hashed_mac,rssi,channel,seq,ieFingerprint,isRandomized,captureMillis
   v
Java service
   1. SerialReader    jSerialComm, finds the port by USB descriptor, reconnects on drop
   2. SequenceLinker  links rotated MACs by sequence number + IE fingerprint
   3. TtlCache        drops repeat sightings within a 10 s window
   4. loggers         metrics.csv and raw_probes.csv
   v
DuckDB: peak devices, visits and dwell time, occupancy over time
```

## Following a phone through a MAC rotation

Phones change their MAC address every so often, so counting distinct MACs overcounts. The 802.11 sequence-control field comes from the radio's hardware counter and usually isn't reset when the MAC rotates. A new hash whose sequence number continues within a small window of a recent sighting is therefore a candidate for being the same phone. Two more signals tighten the check:

- The MAC's locally administered bit says whether it is randomized at all. A burned-in MAC never rotates, so it is never a link target.
- A small fingerprint of the probe request's information elements (tag IDs and lengths only, never their content) reflects the chipset and driver rather than the MAC. A match widens the allowed sequence gap from 20 to 30. A mismatch blocks a link that the gap alone would have allowed.

Same-model phones share a fingerprint, so when more than one known device matches, the linker refuses to guess and gives the new hash its own identity. A simulation with known ground truth puts pairwise precision at 1.00 with one device per fingerprint and 0.34 with 100. Recall holds near 0.78 up to 30 devices, then drops to 0.60 at 100. The linking has also been confirmed on several real MAC rotations captured live. Details are in [findings.md](https://github.com/leNITHISH/paxcounter/blob/master/pax-server/findings.md).

## Privacy

MACs are hashed on the device with HMAC-SHA256 and a secret pepper, and never stored raw. An unsalted hash of a real MAC can be brute-forced from the CSV alone (2^24 candidates per vendor prefix). The pepper stops that attack. It doesn't hide anything from someone who has the device's flash or a radio, since probe requests carry the real MAC in the clear.

## Other decisions

- Every time window keys off the ESP32's own capture timestamp, not the host's arrival time. After a USB reconnect the ring buffer replays its backlog in one burst, and arrival times would make all of it look simultaneous.
- Visits are rebuilt in SQL with a gaps-and-islands query: a new visit starts when a device goes quiet for more than 2 minutes. Occupancy counts a device in every minute its visit spans, not only the minutes it happened to probe in.
- DuckDB, not Postgres: the workload is aggregate queries over one growing log, and it needs no server.

## Known limits

- A phone that's connected to an access point mostly stops probing, so this counts devices looking for a network, not everyone in the room.
- Newer iOS and Android versions send fewer probes when idle.
- The ring buffer survives a USB data drop, not a power loss.

JUnit tests cover the cache and the linker with synthetic timestamps, so no hardware is needed. A host-side test runs the firmware's fingerprint parser under AddressSanitizer, sharing its code verbatim with the firmware.
