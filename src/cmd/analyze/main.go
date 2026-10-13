package main

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/analysis"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher/brainrot"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/internal/testonly"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

const maxFixture = 1 << 20 // The experiment repeats whole-file encryption many times.

func main() {
	cipherName := flag.String("cipher", "brainrot", "registered cipher: brainrot or toy (test-only)")
	blockPath := flag.String("block-input", "testdata/fixtures/one-block.txt", "one-block fixture")
	inputPath := flag.String("input", "testdata/fixtures/repeated-text.txt", "file fixture")
	keyHex := flag.String("key-hex", "00112233445566778899aabbccddeeff", "fixed-length master key, hexadecimal")
	selected := flag.String("modes", "all", "all or comma-separated ECB,CBC,CFB,OFB,CTR")
	trials := flag.Int("trials", 256, "number of bit-flip pairs per experiment")
	seed := flag.Int64("seed", 42, "repeatable experiment seed (not for production IVs)")
	output := flag.String("output", "../reports/brainrot.json", "JSON report destination (empty disables file output)")
	flag.Parse()
	if err := execute(*cipherName, *blockPath, *inputPath, *keyHex, *selected, *trials, *seed, *output); err != nil {
		fmt.Fprintln(os.Stderr, "analyze:", err)
		os.Exit(1)
	}
}

func execute(cipherName, blockPath, inputPath, keyHex, selected string, trials int, seed int64, output string) error {
	factory, err := lookupCipher(cipherName)
	if err != nil {
		return err
	}
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return fmt.Errorf("key-hex must contain valid hexadecimal: %w", err)
	}
	if len(key) != factory.KeySize() {
		return fmt.Errorf("key-hex must be exactly %d hex characters", factory.KeySize()*2)
	}
	chosen, err := parseModes(selected)
	if err != nil {
		return err
	}
	block, err := readFixture(blockPath)
	if err != nil {
		return err
	}
	input, err := readFixture(inputPath)
	if err != nil {
		return err
	}
	report, err := analysis.Run(analysis.Config{
		Factory: factory, Key: key, BlockInput: block, Input: input,
		Modes: chosen, Trials: trials, Seed: seed,
	})
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}
	if output != "" {
		if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil {
			return fmt.Errorf("create report directory: %w", err)
		}
		if err := os.WriteFile(output, append(data, '\n'), 0600); err != nil {
			return fmt.Errorf("write report: %w", err)
		}
	}
	fmt.Printf("%s — educational evaluation; cryptographic security is not established\n", report.Cipher)
	fmt.Printf("block avalanche: plaintext %.2f%%, key %.2f%% (%d trials each)\n",
		report.BlockPlaintext.MeanPercent, report.BlockKey.MeanPercent, trials)
	for _, m := range report.Modes {
		fmt.Printf("%-3s round-trip OK | entropy %.3f → %.3f bits/byte | plaintext flip %.2f%% | key flip %.2f%%\n",
			m.Mode, m.Plaintext.Entropy, m.Ciphertext.Entropy,
			m.PlaintextAvalanche.MeanPercent, m.KeyAvalanche.MeanPercent)
	}
	if output != "" {
		fmt.Println("JSON report:", output)
	}
	return nil
}

func lookupCipher(name string) (cipher.Factory, error) {
	switch name {
	case "brainrot":
		return brainrot.Factory{}, nil
	case "toy":
		return testonly.Factory{}, nil
	default:
		return nil, fmt.Errorf("unknown cipher %q (available: brainrot, toy)", name)
	}
}

func parseModes(s string) ([]modes.Mode, error) {
	if strings.EqualFold(strings.TrimSpace(s), "all") {
		return append([]modes.Mode(nil), modes.All...), nil
	}
	var result []modes.Mode
	seen := make(map[modes.Mode]bool)
	for _, part := range strings.Split(s, ",") {
		mode := modes.Mode(strings.ToUpper(strings.TrimSpace(part)))
		valid := false
		for _, candidate := range modes.All {
			if mode == candidate {
				valid = true
			}
		}
		if !valid || seen[mode] {
			return nil, fmt.Errorf("invalid or duplicate mode %q", part)
		}
		seen[mode] = true
		result = append(result, mode)
	}
	return result, nil
}

func readFixture(path string) ([]byte, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > maxFixture {
		return nil, errors.New("fixture must be a regular file of at most 1 MiB")
	}
	return os.ReadFile(path)
}
