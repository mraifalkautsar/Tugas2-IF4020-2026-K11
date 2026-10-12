package brainrot

import (
	"fmt"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
)

const (
	BlockSize = 16
	KeySize   = 16
	Rounds    = 10
)

type Factory struct{}

func (Factory) Name() string { return "Brainrot Cipher" }
func (Factory) KeySize() int { return KeySize }
func (Factory) New(key []byte) (cipher.Block, error) {
	b, err := New(key)
	if err != nil {
		return nil, err
	}
	return b, nil
}


type Block struct {
	roundKeys [Rounds + 1][BlockSize]byte
}

var (
	_ cipher.Factory = Factory{}
	_ cipher.Block   = (*Block)(nil)
	_ cipher.Tracer  = (*Block)(nil)
)

// Ekspansi key
func New(key []byte) (*Block, error) {
	if len(key) != KeySize {
		return nil, fmt.Errorf("brainrot: %w: want %d bytes, got %d", cipher.ErrKeySize, KeySize, len(key))
	}
	var masterKey [KeySize]byte
	copy(masterKey[:], key)
	return &Block{roundKeys: keyExpansion67(masterKey)}, nil
}

func (*Block) BlockSize() int { return BlockSize }

// enkrip 1 blok
func (b *Block) EncryptBlock(dst, src []byte) {
	checkBlockBuffers(dst, src)
	s := stateFromBlock(src)
	b.encrypt(&s, nil)
	stateToBlock(dst, &s)
}

// dekrip 1 blok
func (b *Block) DecryptBlock(dst, src []byte) {
	checkBlockBuffers(dst, src)
	s := stateFromBlock(src)
	addRoundKey67(&s, b.roundKeys[Rounds])
	inverseShiftRows67(&s)
	inverseSubBytes67(&s)
	for round := Rounds - 1; round >= 1; round-- {
		addRoundKey67(&s, b.roundKeys[round])
		inverseMixColumns67(&s)
		inverseShiftRows67(&s)
		inverseSubBytes67(&s)
	}
	addRoundKey67(&s, b.roundKeys[0])
	stateToBlock(dst, &s)
}

func checkBlockBuffers(dst, src []byte) {
	if len(src) != BlockSize {
		panic(fmt.Errorf("brainrot: source block must be exactly %d bytes, got %d", BlockSize, len(src)))
	}
	if len(dst) < BlockSize {
		panic(fmt.Errorf("brainrot: destination needs at least %d bytes, got %d", BlockSize, len(dst)))
	}
}

func (b *Block) encrypt(s *state, snapshots *[]cipher.Snapshot) {
	addRoundKey67(s, b.roundKeys[0])
	recordSnapshot(snapshots, s, 0, "AddRoundKey67")
	for round := 1; round <= Rounds; round++ {
		subBytes67(s)
		recordSnapshot(snapshots, s, round, "SubBytes67")
		shiftRows67(s)
		recordSnapshot(snapshots, s, round, "ShiftRows67")
		if round != Rounds {
			mixColumns67(s)
			recordSnapshot(snapshots, s, round, "MixColumns67")
		}
		addRoundKey67(s, b.roundKeys[round])
		recordSnapshot(snapshots, s, round, "AddRoundKey67")
	}
}


func (b *Block) TraceEncryptBlock(src []byte) ([]cipher.Snapshot, error) {
	if len(src) != BlockSize {
		return nil, fmt.Errorf("brainrot: source block must be exactly %d bytes, got %d", BlockSize, len(src))
	}
	s := stateFromBlock(src)
	snapshots := make([]cipher.Snapshot, 0, 1+4*(Rounds-1)+3)
	b.encrypt(&s, &snapshots)
	return snapshots, nil
}

func recordSnapshot(snapshots *[]cipher.Snapshot, s *state, round int, operation string) {
	if snapshots == nil {
		return
	}
	data := make([]byte, BlockSize)
	stateToBlock(data, s)
	*snapshots = append(*snapshots, cipher.Snapshot{Round: round, Operation: operation, State: data})
}
