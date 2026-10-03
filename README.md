# IF4020 Block Cipher Project

Go backend sources are in [`src/`](src/); frontend work belongs in `web/`.

## Analysis harness (initial milestone)

Requires Go 1.23 or later. Run from the repository root:

```sh
go -C src test ./...
go -C src run ./cmd/analyze
```

The second command reads the predetermined fixtures in `src/testdata/fixtures/`,
checks all five modes, prints a summary, and writes `reports/toy.json`. To
choose a fixture, experimental key, and mode:

```sh
go -C src run ./cmd/analyze -input testdata/fixtures/repeated-text.txt \
  -block-input testdata/fixtures/one-block.txt \
  -cipher toy \
  -key-hex 00112233445566778899aabbccddeeff \
  -modes ECB,CBC,CFB,OFB,CTR -trials 256 -seed 42 \
  -output ../reports/toy.json
```

**Current results use a deliberately insecure test-only XOR cipher.**
