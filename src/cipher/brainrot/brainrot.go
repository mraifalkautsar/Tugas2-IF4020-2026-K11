package brainrot

import (
	"fmt"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
)

const (
	BlockSize   = 16
	KeySize     = 16
	Rounds      = 10
	subkeyCount = 2*Rounds + 1
	traceCount  = 1 + 6*Rounds + Rounds/2
)

type Factory struct{}

func (Factory) Name() string { return "Brainrot Cipher v2" }
func (Factory) KeySize() int { return KeySize }
func (Factory) New(key []byte) (cipher.Block, error) {
	b, err := New(key)
	if err != nil {
		return nil, err
	}
	return b, nil
}

type Block struct {
	// Q0 whitens; round r uses Q(2r-1) for addition and Q(2r) for XOR.
	roundKeys [subkeyCount][BlockSize]byte
}

var (
	_ cipher.Factory = Factory{}
	_ cipher.Block   = (*Block)(nil)
	_ cipher.Tracer  = (*Block)(nil)
)

func New(key []byte) (*Block, error) {
	if len(key) != KeySize {
		return nil, fmt.Errorf("brainrot: %w: want %d bytes, got %d", cipher.ErrKeySize, KeySize, len(key))
	}
	var masterKey [KeySize]byte
	copy(masterKey[:], key)
	return &Block{roundKeys: keyExpansion67(masterKey)}, nil
}

func (*Block) BlockSize() int { return BlockSize }

func (b *Block) RoundKeys() [Rounds + 1][BlockSize]byte { return b.roundKeys }

func SBoxTable() [256]byte { return sbox67 }

func (b *Block) EncryptBlock(dst, src []byte) {
	checkBlockBuffers(dst, src)
	s := stateFromBlock(src)
	b.encrypt(&s, nil)
	stateToBlock(dst, &s)
}

func (b *Block) DecryptBlock(dst, src []byte) {
	checkBlockBuffers(dst, src)
	s := stateFromBlock(src)
	for round := Rounds; round >= 1; round-- {
		addRoundKey67(&s, b.roundKeys[2*round])
		inverseModularAddition(&s, b.roundKeys[2*round-1])
		if round%2 == 0 {
			inverseFeistelCrossMix(&s)
		}
		inverseBitPlaneTranspose(&s)
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
		mixColumns67(s)
		recordSnapshot(snapshots, s, round, "MixColumns67")
		bitPlaneTranspose(s)
		recordSnapshot(snapshots, s, round, "BitPlaneTranspose")
		if round%2 == 0 {
			feistelCrossMix(s)
			recordSnapshot(snapshots, s, round, "FeistelCrossMix")
		}
		modularAddition(s, b.roundKeys[2*round-1])
		recordSnapshot(snapshots, s, round, "ModularAddition")
		addRoundKey67(s, b.roundKeys[2*round])
		recordSnapshot(snapshots, s, round, "AddRoundKey67")
	}
}

func (b *Block) TraceEncryptBlock(src []byte) ([]cipher.Snapshot, error) {
	if len(src) != BlockSize {
		return nil, fmt.Errorf("brainrot: source block must be exactly %d bytes, got %d", BlockSize, len(src))
	}
	s := stateFromBlock(src)
	snapshots := make([]cipher.Snapshot, 0, traceCount)
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
