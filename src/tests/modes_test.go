package integration_test

import (
	"bytes"
	"testing"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher/brainrot"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/internal/testonly"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func TestAllModesRoundTripAtBlockBoundaries(t *testing.T) {
	for _, factory := range []cipher.Factory{testonly.Factory{}, brainrot.Factory{}} {
		t.Run(factory.Name(), func(t *testing.T) { testModeBoundaries(t, factory) })
	}
}

func testModeBoundaries(t *testing.T, factory cipher.Factory) {
	t.Helper()
	b, err := factory.New(make([]byte, 16))
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range modes.All {
		for _, size := range []int{0, 1, 15, 16, 17, 31, 32, 33, 100, 257, 1027} {
			plaintext := make([]byte, size)
			for i := range plaintext {
				plaintext[i] = byte(i*13 + 9)
			}
			iv := bytes.Repeat([]byte{0x12}, 16)
			if mode == modes.ECB {
				iv = nil
			}
			ciphertext, err := modes.Encrypt(b, mode, iv, plaintext)
			if err != nil {
				t.Fatalf("%s size %d: %v", mode, size, err)
			}
			got, err := modes.Decrypt(b, mode, iv, ciphertext)
			if err != nil || !bytes.Equal(got, plaintext) {
				t.Fatalf("%s size %d: round trip failed: %v", mode, size, err)
			}
			if mode == modes.ECB || mode == modes.CBC {
				if len(ciphertext) != (size/16+1)*16 {
					t.Fatalf("%s size %d: wrong padded size", mode, size)
				}
			} else if len(ciphertext) != size {
				t.Fatalf("%s size %d: stream mode padded unexpectedly", mode, size)
			}
		}
	}
}

func TestBrainrotModeValidation(t *testing.T) {
	b, err := brainrot.New(make([]byte, 16))
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range modes.All {
		for _, size := range []int{0, 15, 17} {
			iv := make([]byte, size)
			if mode == modes.ECB && size == 0 {
				continue
			}
			if _, err := modes.Encrypt(b, mode, iv, []byte{0, 255, 128}); err == nil {
				t.Errorf("%s accepted %d-byte IV for encrypt", mode, size)
			}
			if _, err := modes.Decrypt(b, mode, iv, make([]byte, 16)); err == nil {
				t.Errorf("%s accepted %d-byte IV for decrypt", mode, size)
			}
		}
	}
	for _, mode := range []modes.Mode{modes.ECB, modes.CBC} {
		var iv []byte
		if mode == modes.CBC {
			iv = make([]byte, 16)
		}
		for _, size := range []int{0, 15, 17} {
			if _, err := modes.Decrypt(b, mode, iv, make([]byte, size)); err == nil {
				t.Errorf("%s accepted padded ciphertext size %d", mode, size)
			}
		}
		for _, suffix := range [][]byte{{0}, {17}, {1, 2}, {2, 3, 3}} {
			// Encrypt a deliberately invalid padded block with the raw primitive,
			// so failure does not depend on random ciphertext or a padding oracle.
			plain, encrypted := make([]byte, 16), make([]byte, 16)
			copy(plain[16-len(suffix):], suffix)
			b.EncryptBlock(encrypted, plain)
			if _, err := modes.Decrypt(b, mode, iv, encrypted); err == nil {
				t.Errorf("%s accepted padding suffix %x", mode, suffix)
			}
		}
	}
	iv := bytes.Repeat([]byte{255}, 16)
	for _, operation := range []func(cipher.Block, modes.Mode, []byte, []byte) ([]byte, error){modes.Encrypt, modes.Decrypt} {
		if _, err := operation(b, modes.CTR, iv, make([]byte, 17)); err == nil {
			t.Error("Brainrot CTR accepted counter overflow")
		}
		if _, err := operation(b, modes.CTR, iv, make([]byte, 16)); err != nil {
			t.Errorf("Brainrot CTR rejected last counter: %v", err)
		}
	}
	if !bytes.Equal(iv, bytes.Repeat([]byte{255}, 16)) {
		t.Error("mode mutated caller IV")
	}
}

func TestModeChainingAndCounter(t *testing.T) {
	// With the toy cipher and a zero key E(x)=x. This makes each mode's
	// feedback and counter behavior independently predictable.
	b, _ := (testonly.Factory{}).New(make([]byte, 16))
	iv := make([]byte, 16)
	iv[15] = 7
	plain := make([]byte, 32)
	plain[15], plain[31] = 1, 2
	for _, tc := range []struct {
		mode          modes.Mode
		first, second byte
	}{
		{modes.CFB, 6, 4},  // feedback: 2 xor (1 xor 7)
		{modes.OFB, 6, 5},  // E(E(IV)) = IV
		{modes.CTR, 6, 10}, // counter increments from 7 to 8
		{modes.CBC, 6, 4},  // first ciphertext block becomes chaining value
	} {
		got, err := modes.Encrypt(b, tc.mode, iv, plain)
		if err != nil || got[15] != tc.first || got[31] != tc.second {
			t.Errorf("%s got last bytes %d,%d, error %v", tc.mode, got[15], got[31], err)
		}
	}
	got, err := modes.Encrypt(b, modes.ECB, nil, plain)
	if err != nil || got[15] != 1 || got[31] != 2 {
		t.Fatal("ECB block transformation failed", err)
	}
}

func TestRejectBadIVPaddingAndCounterWrap(t *testing.T) {
	b, _ := (testonly.Factory{}).New(make([]byte, 16))
	if _, err := modes.Encrypt(b, modes.CBC, nil, []byte("hello")); err == nil {
		t.Fatal("missing IV accepted")
	}
	if _, err := modes.Encrypt(b, modes.ECB, make([]byte, 16), nil); err == nil {
		t.Fatal("ECB IV accepted")
	}
	if _, err := modes.Decrypt(b, modes.CBC, make([]byte, 16), make([]byte, 16)); err == nil {
		t.Fatal("invalid padding accepted")
	}
	if _, err := modes.Decrypt(b, modes.ECB, nil, make([]byte, 15)); err == nil {
		t.Fatal("partial padded block accepted")
	}
	iv := bytes.Repeat([]byte{0xff}, 16)
	if _, err := modes.Encrypt(b, modes.CTR, iv, make([]byte, 17)); err == nil {
		t.Fatal("CTR wrap accepted")
	}
	if _, err := modes.Encrypt(b, modes.CTR, iv, make([]byte, 16)); err != nil {
		t.Fatal("last valid counter rejected:", err)
	}
}
