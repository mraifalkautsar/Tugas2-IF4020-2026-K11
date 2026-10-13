package brainrot

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"errors"
	"math/rand"
	"os"
	"testing"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
)

func decodeHex(t *testing.T, value string) []byte {
	t.Helper()
	data, err := hex.DecodeString(value)
	if err != nil {
		t.Fatal(err)
	}
	return data
}

func TestIndependentKnownAnswers(t *testing.T) {
	data, err := os.ReadFile("testdata/v2-vectors.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct {
		Cipher  string `json:"cipher"`
		Vectors []struct {
			Name       string   `json:"name"`
			Key        string   `json:"key_hex"`
			Plaintext  string   `json:"plaintext_hex"`
			Ciphertext string   `json:"ciphertext_hex"`
			Subkeys    []string `json:"subkeys_hex"`
			Snapshots  []struct {
				Round     int    `json:"round"`
				Operation string `json:"operation"`
				State     string `json:"state_hex"`
			} `json:"snapshots"`
		} `json:"vectors"`
	}
	if err := json.Unmarshal(data, &fixture); err != nil {
		t.Fatal(err)
	}
	if fixture.Cipher != (Factory{}).Name() || len(fixture.Vectors) != 4 {
		t.Fatal("wrong vector fixture version/count")
	}
	for _, vector := range fixture.Vectors {
		t.Run(vector.Name, func(t *testing.T) {
			block, err := New(decodeHex(t, vector.Key))
			if err != nil {
				t.Fatal(err)
			}
			if len(vector.Subkeys) != 21 || len(vector.Snapshots) != 66 {
				t.Fatal("incomplete key schedule/trace fixture")
			}
			for i, expected := range vector.Subkeys {
				if !bytes.Equal(block.roundKeys[i][:], decodeHex(t, expected)) {
					t.Fatalf("subkey Q%d differs", i)
				}
			}
			plain, expected := decodeHex(t, vector.Plaintext), decodeHex(t, vector.Ciphertext)
			actual := make([]byte, BlockSize)
			block.EncryptBlock(actual, plain)
			if !bytes.Equal(actual, expected) {
				t.Fatalf("ciphertext = %x; want %x", actual, expected)
			}
			block.DecryptBlock(actual, expected)
			if !bytes.Equal(actual, plain) {
				t.Fatalf("decrypted = %x; want %x", actual, plain)
			}
			trace, err := block.TraceEncryptBlock(plain)
			if err != nil || len(trace) != 66 {
				t.Fatalf("trace length %d, error %v", len(trace), err)
			}
			for i, snapshot := range trace {
				want := vector.Snapshots[i]
				if snapshot.Round != want.Round || snapshot.Operation != want.Operation ||
					!bytes.Equal(snapshot.State, decodeHex(t, want.State)) {
					t.Fatalf("snapshot %d (%s) differs", i, want.Operation)
				}
			}
			if !bytes.Equal(trace[len(trace)-1].State, expected) {
				t.Fatal("final trace state differs from encryption")
			}
			second := append([]byte(nil), trace[1].State...)
			trace[0].State[0] ^= 1
			if !bytes.Equal(trace[1].State, second) {
				t.Fatal("snapshots alias one another")
			}
		})
	}
}

func TestBlockRoundTripsAndOverlap(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	for trial := 0; trial < 128+1024; trial++ {
		key, plain := make([]byte, KeySize), make([]byte, BlockSize)
		if trial < 128 {
			key[trial/8], plain[trial/8] = 1<<uint(trial%8), 1<<uint(trial%8)
		} else {
			rng.Read(key)
			rng.Read(plain)
		}
		block, err := New(key)
		if err != nil {
			t.Fatal(err)
		}
		ciphertext := make([]byte, BlockSize)
		block.EncryptBlock(ciphertext, plain)
		for _, offset := range []int{0, 1} {
			buffer := make([]byte, BlockSize+offset)
			copy(buffer, plain)
			block.EncryptBlock(buffer[offset:], buffer[:BlockSize])
			if !bytes.Equal(buffer[offset:], ciphertext) {
				t.Fatalf("trial %d overlap %d encryption", trial, offset)
			}
			block.DecryptBlock(buffer[:BlockSize], buffer[offset:])
			if !bytes.Equal(buffer[:BlockSize], plain) {
				t.Fatalf("trial %d overlap %d decryption", trial, offset)
			}
		}
	}
}

func TestKeyAndBufferValidation(t *testing.T) {
	for _, size := range []int{0, 15, 17, 32} {
		if _, err := New(make([]byte, size)); !errors.Is(err, cipher.ErrKeySize) {
			t.Fatalf("key size %d: %v", size, err)
		}
	}
	key := make([]byte, 16)
	block, _ := New(key)
	expected := make([]byte, 16)
	block.EncryptBlock(expected, make([]byte, 16))
	key[0] = 255
	actual := bytes.Repeat([]byte{0xaa}, 20)
	block.EncryptBlock(actual, make([]byte, 16))
	if !bytes.Equal(actual[:16], expected) || !bytes.Equal(actual[16:], bytes.Repeat([]byte{0xaa}, 4)) {
		t.Fatal("key aliases caller or destination suffix changed")
	}
	for _, operation := range []func([]byte, []byte){block.EncryptBlock, block.DecryptBlock} {
		for _, sizes := range [][2]int{{15, 16}, {16, 15}, {16, 17}} {
			func() {
				defer func() {
					if recover() == nil {
						t.Errorf("accepted dst/src lengths %v", sizes)
					}
				}()
				operation(make([]byte, sizes[0]), make([]byte, sizes[1]))
			}()
		}
	}
	for _, size := range []int{0, 15, 17} {
		if _, err := block.TraceEncryptBlock(make([]byte, size)); err == nil {
			t.Fatalf("trace accepted %d-byte source", size)
		}
	}
}

func TestOperationInverses(t *testing.T) {
	rng := rand.New(rand.NewSource(1337))
	for trial := 0; trial < 128+4+1024; trial++ {
		var data [16]byte
		if trial < 128 {
			data[trial/8] = 1 << uint(trial%8)
		} else if trial < 132 {
			for i := range data {
				if (trial-128)&(1<<(i/8)) != 0 {
					data[i] = 255
				}
			}
		} else {
			rng.Read(data[:])
		}
		for _, pair := range [][2]func(*state){
			{subBytes67, inverseSubBytes67}, {shiftRows67, inverseShiftRows67},
			{mixColumns67, inverseMixColumns67}, {feistelCrossMix, inverseFeistelCrossMix},
			{bitPlaneTranspose, inverseBitPlaneTranspose},
		} {
			original := stateFromBlock(data[:])
			s := original
			pair[0](&s)
			pair[1](&s)
			if s != original {
				t.Fatalf("inverse failed on trial %d", trial)
			}
		}
	}
}

func TestBPTBasisMapping(t *testing.T) {
	for inputBit := 0; inputBit < 128; inputBit++ {
		var input, actual, expected [16]byte
		input[inputBit/8] = 1 << uint(7-inputBit%8)
		outputBit := 3 * (16*(inputBit%8) + inputBit/8) % 128
		expected[outputBit/8] = 1 << uint(7-outputBit%8)
		s := stateFromBlock(input[:])
		bitPlaneTranspose(&s)
		stateToBlock(actual[:], &s)
		if actual != expected {
			t.Fatalf("input bit %d: %x; want %x", inputBit, actual, expected)
		}
	}
}

func TestModularAdditionExhaustive(t *testing.T) {
	for x := 0; x < 256; x++ {
		for k := 0; k < 256; k++ {
			var data, key [16]byte
			for i := range data {
				data[i], key[i] = byte(x), byte(k)
			}
			original := stateFromBlock(data[:])
			s := original
			modularAddition(&s, key)
			for _, row := range s {
				for _, v := range row {
					if int(v) != (x+k)%256 {
						t.Fatalf("%d+%d did not wrap correctly", x, k)
					}
				}
			}
			inverseModularAddition(&s, key)
			if s != original {
				t.Fatalf("inverse addition failed for %d,%d", x, k)
			}
		}
	}
}
