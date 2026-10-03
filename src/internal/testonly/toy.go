package testonly

import "github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"

type Factory struct{}

func (Factory) Name() string { return "TEST-ONLY-XOR (INSECURE)" }
func (Factory) KeySize() int { return 16 }

func (Factory) New(key []byte) (cipher.Block, error) {
	if len(key) != 16 {
		return nil, cipher.ErrKeySize
	}
	var b block
	copy(b.key[:], key)
	return b, nil
}

type block struct{ key [16]byte }

func (block) BlockSize() int { return 16 }
func (b block) EncryptBlock(dst, src []byte) {
	for i := range b.key {
		dst[i] = src[i] ^ b.key[i]
	}
}
func (b block) DecryptBlock(dst, src []byte) { b.EncryptBlock(dst, src) }
