package cipher

import "errors"

type Block interface {
	BlockSize() int
	EncryptBlock(dst, src []byte)
	DecryptBlock(dst, src []byte)
}

type Factory interface {
	Name() string
	KeySize() int
	New(key []byte) (Block, error)
}

var ErrKeySize = errors.New("master key has incorrect length")

type Snapshot struct {
	Round     int    `json:"round"`
	Operation string `json:"operation"`
	State     []byte `json:"state"`
}

type Tracer interface {
	TraceEncryptBlock(src []byte) ([]Snapshot, error)
}
