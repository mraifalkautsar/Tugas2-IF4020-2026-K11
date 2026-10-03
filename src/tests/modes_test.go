package integration_test

import (
	"bytes"
	"testing"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/internal/testonly"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func TestAllModesRoundTripAtBlockBoundaries(t *testing.T) {
	b, err := (testonly.Factory{}).New(make([]byte, 16))
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range modes.All {
		for _, size := range []int{0, 1, 15, 16, 17, 32, 100} {
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
