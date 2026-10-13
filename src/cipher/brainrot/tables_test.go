package brainrot

import (
	"bytes"
	"fmt"
	"math/bits"
	"testing"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func TestMixColumnsMDSAndInverse(t *testing.T) {
	for _, matrices := range [][2][4][4]byte{
		{mix67, inverseMix67}, {inverseMix67, mix67},
	} {
		for row := 0; row < 4; row++ {
			for col := 0; col < 4; col++ {
				var got, want byte
				for k := 0; k < 4; k++ {
					got ^= gfMul(matrices[0][row][k], matrices[1][k][col])
				}
				if row == col {
					want = 1
				}
				if got != want {
					t.Fatalf("matrix/inverse product at (%d,%d) = %02x; want %02x", row, col, got, want)
				}
			}
		}
	}
	checked := 0
	for rowMask := 1; rowMask < 16; rowMask++ {
		for colMask := 1; colMask < 16; colMask++ {
			if bits.OnesCount(uint(rowMask)) != bits.OnesCount(uint(colMask)) {
				continue
			}
			var rows, cols []int
			for i := 0; i < 4; i++ {
				if rowMask&(1<<i) != 0 {
					rows = append(rows, i)
				}
				if colMask&(1<<i) != 0 {
					cols = append(cols, i)
				}
			}
			// In characteristic two, determinant signs are all +1. Sum the
			// products for every column permutation using XOR.
			var determinant byte
			var visit func(int, int, byte)
			visit = func(row, used int, product byte) {
				if row == len(rows) {
					determinant ^= product
					return
				}
				for col := range cols {
					if used&(1<<col) == 0 {
						visit(row+1, used|(1<<col), gfMul(product, mix67[rows[row]][cols[col]]))
					}
				}
			}
			visit(0, 0, 1)
			if determinant == 0 {
				t.Fatalf("MixColumns is not MDS: singular minor rows %v, columns %v", rows, cols)
			}
			checked++
		}
	}
	if checked != 69 {
		t.Fatalf("checked %d square minors; want 69", checked)
	}
}

func TestSBox67PermutationAndInverse(t *testing.T) {
	// Reference from an independent simulation: zero-based axes 6 then 7,
	// circular right-6/down-7 shifts, 67 iterations, row-major serialization.
	want := [256]byte{
		0x54, 0x91, 0xfc, 0x39, 0x94, 0xc2, 0x5a, 0x5b, 0x89, 0x8a, 0xf4, 0xf5, 0x7e, 0x15, 0xbc, 0xbd,
		0xce, 0x1a, 0xfd, 0x67, 0x1d, 0x1e, 0x00, 0x01, 0x7b, 0x03, 0x40, 0xd8, 0x7f, 0x70, 0x71, 0xcd,
		0xde, 0xdf, 0xfe, 0x0e, 0x87, 0xb5, 0xc5, 0xc6, 0xb8, 0x6e, 0xe7, 0xf7, 0xad, 0xae, 0x18, 0x19,
		0xb1, 0xef, 0x95, 0x0f, 0xe2, 0x3e, 0x3f, 0xd6, 0x04, 0x32, 0x24, 0x25, 0x9f, 0x72, 0x46, 0xb0,
		0x3a, 0xe0, 0x3c, 0x3d, 0x10, 0x20, 0x5e, 0xd7, 0xab, 0xd9, 0xe9, 0xea, 0xdc, 0x82, 0xa1, 0x1b,
		0x59, 0xe1, 0xa6, 0xd4, 0xd5, 0x21, 0x31, 0x41, 0x51, 0x52, 0x53, 0x90, 0x28, 0x65, 0x48, 0x49,
		0x69, 0x1f, 0xf2, 0x02, 0x12, 0xb9, 0x6f, 0x60, 0x61, 0x08, 0x09, 0x73, 0x29, 0x66, 0xb2, 0xb3,
		0x6a, 0x6b, 0x5d, 0x8b, 0x22, 0x23, 0xca, 0x07, 0x62, 0xaf, 0x0a, 0x38, 0x0c, 0x1c, 0xff, 0xf0,
		0xb6, 0x4e, 0x6d, 0x7d, 0x8d, 0x33, 0x34, 0x80, 0x63, 0xdd, 0x83, 0x84, 0x85, 0x2c, 0x2d, 0x79,
		0xe4, 0xe5, 0x13, 0x14, 0x8e, 0x8f, 0x44, 0x45, 0x64, 0x74, 0xee, 0x2b, 0x68, 0xc3, 0x2e, 0x5c,
		0x9a, 0x9b, 0x05, 0x9d, 0xda, 0x26, 0x27, 0x55, 0x0b, 0x75, 0x58, 0xa4, 0x78, 0xf1, 0x7a, 0xa8,
		0x5f, 0x50, 0x42, 0xf8, 0x17, 0x81, 0xa0, 0x56, 0xa2, 0xa3, 0x86, 0x96, 0x88, 0x98, 0x11, 0x4f,
		0xc9, 0x06, 0x9e, 0xcc, 0xbe, 0xbf, 0xcf, 0x57, 0xd0, 0x4a, 0x4b, 0x97, 0x2f, 0x99, 0xc7, 0xc8,
		0xe8, 0x16, 0x35, 0x36, 0x37, 0x47, 0xc0, 0x76, 0x3b, 0xa5, 0xc4, 0xa7, 0x6c, 0x7c, 0xaa, 0xba,
		0xcb, 0xdb, 0xeb, 0xec, 0xed, 0x2a, 0xc1, 0x77, 0xd2, 0xd3, 0xe3, 0xb7, 0x30, 0xe6, 0xf6, 0xbb,
		0xf9, 0xfa, 0xfb, 0x92, 0x93, 0x0d, 0xd1, 0xb4, 0x4c, 0x4d, 0xf3, 0xa9, 0x8c, 0x9c, 0xac, 0x43,
	}
	if sbox67 != want || generateSbox67() != want {
		t.Fatal("S-box differs from the specified 67-iteration permutation")
	}
	var seen [256]bool
	for x, y := range sbox67 {
		if seen[y] {
			t.Fatalf("duplicate S-box output: %02x", y)
		}
		seen[y] = true
		if inverseSbox67[y] != byte(x) || sbox67[inverseSbox67[x]] != byte(x) {
			t.Fatalf("inverse mismatch at input %02x", x)
		}
	}
	// Returned arrays must not let callers mutate the package tables.
	exposed := SBoxTable()
	exposed[0] ^= 0xff
	if SBoxTable() != want {
		t.Fatal("SBoxTable exposes mutable package state")
	}
}

func TestSubBytes67Inverse(t *testing.T) {
	for start := 0; start < 256; start += BlockSize {
		var original state
		for row := range original {
			for col := range original[row] {
				original[row][col] = byte(start + 4*row + col)
			}
		}
		got := original
		subBytes67(&got)
		for row := range got {
			for col := range got[row] {
				if got[row][col] != sbox67[original[row][col]] {
					t.Fatal("SubBytes67 did not use the new table")
				}
			}
		}
		inverseSubBytes67(&got)
		if got != original {
			t.Fatal("inverse SubBytes67 did not recover the state")
		}
	}
}

func TestNewSBoxAllModesRoundTrip(t *testing.T) {
	key := make([]byte, KeySize)
	for i := range key {
		key[i] = byte(i)
	}
	block, err := New(key)
	if err != nil {
		t.Fatal(err)
	}
	inputs := [][]byte{[]byte("Halo Brainrot! Teks UTF-8: enkripsi \u2192 dekripsi.")}
	for _, size := range []int{0, 1, 15, 16, 17, 31, 32, 33, 255, 256, 257, 1025} {
		data := make([]byte, size)
		for i := range data {
			data[i] = byte(i)
		}
		inputs = append(inputs, data)
	}
	for _, mode := range modes.All {
		for _, plain := range inputs {
			t.Run(fmt.Sprintf("%s/%d", mode, len(plain)), func(t *testing.T) {
				var iv []byte
				if mode != modes.ECB {
					iv = bytes.Repeat([]byte{0x12}, BlockSize)
				}
				encrypted, err := modes.Encrypt(block, mode, iv, plain)
				if err != nil {
					t.Fatal(err)
				}
				wantSize := len(plain)
				if mode == modes.ECB || mode == modes.CBC {
					wantSize = (len(plain)/BlockSize + 1) * BlockSize
				}
				if len(encrypted) != wantSize {
					t.Fatalf("ciphertext length %d, want %d", len(encrypted), wantSize)
				}
				decrypted, err := modes.Decrypt(block, mode, iv, encrypted)
				if err != nil {
					t.Fatal(err)
				}
				if !bytes.Equal(decrypted, plain) {
					t.Fatal("decryption did not recover the original bytes")
				}
			})
		}
	}
}
