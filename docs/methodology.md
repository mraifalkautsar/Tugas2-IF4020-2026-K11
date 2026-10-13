# Experimental methodology

`src/cmd/analyze` defaults to **Brainrot Cipher v2**, the implemented 128-bit
SPN with a 128-bit master key and ten rounds. `-cipher toy` selects
**TEST-ONLY-XOR**, an intentionally insecure reversible adapter used by the
infrastructure tests. Toy figures are **not** Brainrot security results.
All reports currently set `experimental: true`, and the CLI labels its output
as an educational evaluation whose cryptographic security is not established.
Statistical measurements describe the
tested samples; they do not establish cryptographic security.

The cipher contract is `src/cipher.Block` and `src/cipher.Factory`. The factory
is needed to rerun encryption after flipping a master-key bit. Brainrot
implements both contracts and `cipher.Tracer`, which exposes state snapshots
after each encryption operation: 66 snapshots including whitening. There is
no graphical UI in the current code. V2 uses revised BPT after MixColumns,
FCM on even rounds, and byte-wise addition with distinct scheduled subkeys.
All ten rounds include MixColumns. See [`../addition.md`](../addition.md) for
the exact operation order, subkey assignment, and component limitations.
V2 replaces the previous cipher and cannot decrypt its ciphertext; the CLI
hex format has no embedded version identifier or legacy fallback.

For each block-cipher trial, a baseline block is encrypted. One bit in the
plaintext is flipped and encrypted with the same key; separately, one bit of
the key is flipped and the unmodified block is encrypted again. The first
trial uses the provided exact-block fixture; later trials use pseudorandom
baseline blocks from the recorded seed. The number of changed output bits is
the Hamming distance between the two ciphertext blocks. Block-test bit
positions cycle through all available input bits. Set trials to at least the
number of input bits for full block-test coverage. The JSON includes mean,
extrema, per-input-bit means, and per-input-bit trial counts for block tests.

For *each* of ECB, CBC, CFB, OFB, and CTR, the tool encrypts the whole-file
fixture, checks decryption returns the original bytes, and records plaintext
and ciphertext-body byte histograms (256 bins) and Shannon entropy in
bits/byte: `-sum(p * log2(p))` for nonzero byte frequencies. It repeats
single-bit plaintext/key flips on that file, comparing ciphertext *bodies*.
Whole-file plaintext bit positions are sampled over the fixture with the
seeded experiment generator; key bits cycle across the key.
Paired runs use the same IV. Headers and future integrity tags are excluded.
CTR/OFB plaintext flips normally change only one ciphertext bit; these
mode-level figures must not be confused with the cipher-only avalanche result.
Small samples do not establish uniformity or cryptographic security.

The `-seed` controls only deterministic experimental inputs/IVs; real files
need fresh unpredictable IVs/counters. ECB/CBC use PKCS#7 padding; CFB uses
full-block feedback; OFB and CTR process a partial last block without padding.
CTR interprets the entire IV as a big-endian initial counter and rejects
counter wrap when another block is needed. These mode primitives do not
authenticate ciphertext. `bytes.Equal` in the analysis runner verifies
round-trip recovery, and ECB/CBC decryption validates padding; neither
provides authentication of arbitrary ciphertext modifications.

The `crypt` CLI accepts text for encryption and hexadecimal for decryption.
It generates a fresh IV with `crypto/rand` for non-ECB modes and prefixes it
to the ciphertext body. It has no arbitrary-file input/output flags or
integrity tag yet. The analysis CLI reads byte fixtures of at most 1 MiB;
the default whole-file fixture is 404 bytes of repeated text. A second fixture,
`byte-pattern.bin`, contains byte values 0..255 repeated four times plus
`00 ff 80` (1027 bytes). Its almost uniform plaintext histogram is deliberate;
its repeated blocks still expose ECB patterns. Record fixture hashes as well
as sizes when preparing the assignment report.

Run from the repository root:

```sh
go -C src test ./...
go -C src run ./cmd/analyze -cipher brainrot -modes all \
  -trials 256 -seed 42 -output ../reports/brainrot-v2/text-seed42.json
```

The automated tests exercise both the toy cipher and actual v2 mode/analysis
behavior. Dedicated Brainrot tests check independently generated ciphertext,
all 21 subkeys and 66 snapshots, reversible operations, random/structured
inputs, overlapping buffers, BPT basis bits, and all 65,536 byte/subkey pairs
for addition. The frozen vectors come from `scripts/brainrot_reference.py`,
which derives the AES S-box algebraically and uses polynomial multiplication
and long division rather than the Go table or GF routine.

`TestLinearLayerBranchBounds` exhaustively rules out byte-support sums below
5 in the binary matrix A and its transpose A^T, checking 36,416 support pairs
for each. Thus both differential and linear-mask byte branch numbers are at
least 5 for **ShiftRows67 → MixColumns67 → revised BPT only**. It does not
bound the complete nonlinear round or establish multi-round attack resistance.
The Python reference independently verifies the same bound:

```sh
python3 scripts/brainrot_reference.py --check-diffusion
```

Recorded experiments, three-run block benchmarks, and metadata are in
[`../reports/brainrot-v2/README.md`](../reports/brainrot-v2/README.md).
No statistical security threshold is used to pass/fail the tests.
FCM's rotational symmetry, byte addition's deterministic MSB differential,
and equivalent addition/XOR subkey pairs remain documented limitations.

The LaTeX report and writing instructions are in
[`laporan/README.md`](laporan/README.md). To regenerate tables and figures,
use Python 3 with matplotlib in an optional development environment:

```sh
python3 scripts/render_brainrot_results.py
make -C docs/laporan
```

The PDF build itself uses the included tables/PNG figures and requires no
Python environment. Identity details, discussion prompts, and conclusions
remain editable placeholders.
