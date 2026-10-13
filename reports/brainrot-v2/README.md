# Brainrot v2 recorded evaluation

These are educational measurements and correctness evidence, not proof of
full-cipher security. Every mode round-trip succeeded for the tested fixtures.
The JSON `cipher` field distinguishes the original cipher from v2.

`manifest.json` records the base commit, v2 Go source hashes, Go/OS versions,
fixture hashes/sizes, public experimental keys, seeds, and benchmark medians.
V2 measurements come from the working-tree revision recorded by those hashes;
the base commit alone does not identify the modified cipher. Baseline JSON and
benchmarks were captured before replacing the original implementation.

| Report | Fixture | Key (hex) | Seed |
| --- | --- | --- | --- |
| `baseline-text.json` | Repeated text, 404 bytes | `00112233445566778899aabbccddeeff` | 42 |
| `baseline-binary.json` | Byte pattern, 1027 bytes | `00112233445566778899aabbccddeeff` | 42 |
| `text-seed42.json` | Repeated text, 404 bytes | `00112233445566778899aabbccddeeff` | 42 |
| `binary-seed42.json` | Byte pattern, 1027 bytes | `00112233445566778899aabbccddeeff` | 42 |
| `text-zero-seed1337.json` | Repeated text, 404 bytes | `00000000000000000000000000000000` | 1337 |
| `binary-ones-seed1337.json` | Byte pattern, 1027 bytes | `ffffffffffffffffffffffffffffffff` | 1337 |

All runs use 256 trials, the 16-byte `one-block.txt` fixture, and all five modes.
Baseline runs require the original implementation; current code implements v2
without legacy fallback. The binary fixture is `bytes(range(256))*4` followed
by `00 ff 80`. Its near-uniform input distribution and repeated blocks are
intentional; this sample is not representative of arbitrary binary files.

Reproduce the v2 runs from the repository root:

```sh
go -C src run ./cmd/analyze -output ../reports/brainrot-v2/text-seed42.json
go -C src run ./cmd/analyze -input testdata/fixtures/byte-pattern.bin -output ../reports/brainrot-v2/binary-seed42.json
go -C src run ./cmd/analyze -seed 1337 -key-hex 00000000000000000000000000000000 -output ../reports/brainrot-v2/text-zero-seed1337.json
go -C src run ./cmd/analyze -seed 1337 -key-hex ffffffffffffffffffffffffffffffff -input testdata/fixtures/byte-pattern.bin -output ../reports/brainrot-v2/binary-ones-seed1337.json
```

Block plaintext/key avalanche means across these four v2 runs are approximately
49.64–50.05% / 50.15–50.49%. OFB/CTR plaintext changes affect exactly one
ciphertext bit, as their XOR-based mode construction predicts. The denominator
for mode avalanche is the entire ciphertext body, so those percentages cannot
be compared directly to single-block avalanche. IV bytes are excluded.

`baseline-bench.txt` and `v2-bench.txt` contain three runs of:

```sh
go -C src test ./cipher/brainrot -run '^$' -bench . -benchtime=1s -count=3
```

On Linux amd64 / AMD Ryzen 5 5600H, median encryption cost increased from
20,225 to 24,959 ns/block (23.4%); decryption increased from 20,141 to
24,673 ns/block (22.5%). Both versions reported zero heap allocations per
block. Key construction is excluded from the timed section. These are local
timings with observable run-to-run variation, not universal throughput claims.

The revised linear layer has independently checked differential and linear-mask
byte branch numbers **at least 5**. Run:

```sh
go -C src test ./cipher/brainrot -run TestLinearLayerBranchBounds -v
python3 scripts/brainrot_reference.py --check-diffusion
```

Each method rules out 36,416 low-weight support pairs for each propagation
type. The bound applies only to ShiftRows67 → MixColumns67 → revised BPT;
it does not certify FCM, modular addition, key expansion, or multi-round security.

To regenerate the report tables and histogram PNGs, run
`python3 scripts/render_brainrot_results.py` in an environment with matplotlib.
The frozen-vector checker and Go implementation require no plotting dependency.
