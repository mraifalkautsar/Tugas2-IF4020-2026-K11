// Package analysis measures block and mode behavior without claiming that
// statistical measurements prove cryptographic security.
package analysis

import (
	"bytes"
	"errors"
	"fmt"
	"math/rand"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

type Config struct {
	Factory    cipher.Factory
	Key        []byte
	BlockInput []byte
	Input      []byte
	Modes      []modes.Mode
	Trials     int
	Seed       int64
}

type ModeReport struct {
	Mode               modes.Mode   `json:"mode"`
	RoundTrip          bool         `json:"round_trip"`
	Plaintext          Distribution `json:"plaintext"`
	Ciphertext         Distribution `json:"ciphertext"`
	PlaintextAvalanche Avalanche    `json:"plaintext_avalanche"`
	KeyAvalanche       Avalanche    `json:"key_avalanche"`
}

type Report struct {
	Cipher         string       `json:"cipher"`
	Experimental   bool         `json:"experimental"`
	Seed           int64        `json:"seed"`
	Trials         int          `json:"trials"`
	BlockSizeBytes int          `json:"block_size_bytes"`
	KeySizeBytes   int          `json:"key_size_bytes"`
	BlockPlaintext Avalanche    `json:"block_plaintext_avalanche"`
	BlockKey       Avalanche    `json:"block_key_avalanche"`
	Modes          []ModeReport `json:"modes"`
}

// Run compares ciphertext *bodies*; IVs and future authentication tags are
// excluded. Each pair of bit-flip runs uses the same experimental IV.
func Run(c Config) (Report, error) {
	if c.Factory == nil || c.Trials <= 0 || len(c.Input) == 0 || len(c.Modes) == 0 {
		return Report{}, errors.New("factory, positive trials, nonempty input, and modes are required")
	}
	if len(c.Key) != c.Factory.KeySize() {
		return Report{}, cipher.ErrKeySize
	}
	b, err := c.Factory.New(c.Key)
	if err != nil {
		return Report{}, err
	}
	n := b.BlockSize()
	if n < 8 || n > 255 || len(c.BlockInput) != n || len(c.Key) < n {
		return Report{}, errors.New("block input must be exactly one block; block size must be 8..255 bytes and key at least one block")
	}
	report := Report{
		Cipher: c.Factory.Name(), Experimental: true, Seed: c.Seed,
		Trials: c.Trials, BlockSizeBytes: n, KeySizeBytes: len(c.Key),
	}
	rng := rand.New(rand.NewSource(c.Seed)) // Experiments only; never production IV generation.
	blockPlain := newAccumulator(n*8, n*8)
	blockKey := newAccumulator(n*8, len(c.Key)*8)
	base := make([]byte, n)
	changed := make([]byte, n)
	for trial := 0; trial < c.Trials; trial++ {
		plain := append([]byte(nil), c.BlockInput...)
		// Randomize successive baseline blocks to avoid measuring only one input.
		if trial != 0 {
			rng.Read(plain)
		}
		b.EncryptBlock(base, plain)
		plainBit := trial % (n * 8)
		plain[plainBit/8] ^= 1 << (plainBit % 8)
		b.EncryptBlock(changed, plain)
		blockPlain.add(plainBit, changedBits(base, changed))

		keyBit := trial % (len(c.Key) * 8)
		flippedKey := append([]byte(nil), c.Key...)
		flippedKey[keyBit/8] ^= 1 << (keyBit % 8)
		flippedBlock, err := c.Factory.New(flippedKey)
		if err != nil {
			return Report{}, err
		}
		plain[plainBit/8] ^= 1 << (plainBit % 8)
		flippedBlock.EncryptBlock(changed, plain)
		blockKey.add(keyBit, changedBits(base, changed))
	}
	report.BlockPlaintext = blockPlain.result()
	report.BlockKey = blockKey.result()

	for _, mode := range c.Modes {
		iv := make([]byte, n)
		if mode == modes.ECB {
			iv = nil
		} else {
			rng.Read(iv)
		}
		body, err := modes.Encrypt(b, mode, iv, c.Input)
		if err != nil {
			return Report{}, fmt.Errorf("%s encrypt: %w", mode, err)
		}
		decrypted, err := modes.Decrypt(b, mode, iv, body)
		if err != nil || !bytes.Equal(decrypted, c.Input) {
			return Report{}, fmt.Errorf("%s round trip failed: %v", mode, err)
		}
		mr := ModeReport{
			Mode: mode, RoundTrip: true,
			Plaintext: Describe(c.Input), Ciphertext: Describe(body),
		}
		plainAvalanche := newAccumulator(len(body)*8, 0)
		keyAvalanche := newAccumulator(len(body)*8, 0)
		for trial := 0; trial < c.Trials; trial++ {
			// Paired runs intentionally share IV; they never write encrypted files.
			plainBit := rng.Intn(len(c.Input) * 8)
			flipped := append([]byte(nil), c.Input...)
			flipped[plainBit/8] ^= 1 << (plainBit % 8)
			alternative, err := modes.Encrypt(b, mode, iv, flipped)
			if err != nil {
				return Report{}, err
			}
			plainAvalanche.add(plainBit, changedBits(body, alternative))

			keyBit := trial % (len(c.Key) * 8)
			flippedKey := append([]byte(nil), c.Key...)
			flippedKey[keyBit/8] ^= 1 << (keyBit % 8)
			flippedBlock, err := c.Factory.New(flippedKey)
			if err != nil {
				return Report{}, err
			}
			alternative, err = modes.Encrypt(flippedBlock, mode, iv, c.Input)
			if err != nil {
				return Report{}, err
			}
			keyAvalanche.add(keyBit, changedBits(body, alternative))
		}
		mr.PlaintextAvalanche = plainAvalanche.result()
		mr.KeyAvalanche = keyAvalanche.result()
		report.Modes = append(report.Modes, mr)
	}
	return report, nil
}
