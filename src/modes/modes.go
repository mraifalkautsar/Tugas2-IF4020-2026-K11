package modes

import (
	"errors"
	"fmt"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher"
)

type Mode string

const (
	ECB Mode = "ECB"
	CBC Mode = "CBC"
	CFB Mode = "CFB"
	OFB Mode = "OFB"
	CTR Mode = "CTR"
)

var All = []Mode{ECB, CBC, CFB, OFB, CTR}

func (m Mode) valid() bool {
	switch m {
	case ECB, CBC, CFB, OFB, CTR:
		return true
	}
	return false
}

func validate(b cipher.Block, m Mode, iv []byte) (int, error) {
	if b == nil || b.BlockSize() < 8 || b.BlockSize() > 255 {
		return 0, errors.New("block size must be between 8 and 255 bytes")
	}
	if !m.valid() {
		return 0, fmt.Errorf("unknown mode %q", m)
	}
	n := b.BlockSize()
	if m == ECB && len(iv) != 0 || m != ECB && len(iv) != n {
		return 0, fmt.Errorf("%s needs %d IV bytes", m, map[bool]int{true: 0, false: n}[m == ECB])
	}
	return n, nil
}


func Encrypt(b cipher.Block, m Mode, iv, plaintext []byte) ([]byte, error) {
	n, err := validate(b, m, iv)
	if err != nil {
		return nil, err
	}
	if m == ECB || m == CBC {
		pad := n - len(plaintext)%n
		data := make([]byte, len(plaintext)+pad)
		copy(data, plaintext)
		for i := len(plaintext); i < len(data); i++ {
			data[i] = byte(pad)
		}
		out := make([]byte, len(data))
		prev := append([]byte(nil), iv...)
		for offset := 0; offset < len(data); offset += n {
			if m == CBC {
				for j := 0; j < n; j++ {
					data[offset+j] ^= prev[j]
				}
			}
			b.EncryptBlock(out[offset:offset+n], data[offset:offset+n])
			if m == CBC {
				prev = out[offset : offset+n]
			}
		}
		return out, nil
	}
	return stream(b, m, iv, plaintext, false)
}


func Decrypt(b cipher.Block, m Mode, iv, ciphertext []byte) ([]byte, error) {
	n, err := validate(b, m, iv)
	if err != nil {
		return nil, err
	}
	if m != ECB && m != CBC {
		return stream(b, m, iv, ciphertext, true)
	}
	if len(ciphertext) == 0 || len(ciphertext)%n != 0 {
		return nil, errors.New("invalid padded ciphertext length")
	}
	out := make([]byte, len(ciphertext))
	prev := append([]byte(nil), iv...)
	for offset := 0; offset < len(ciphertext); offset += n {
		b.DecryptBlock(out[offset:offset+n], ciphertext[offset:offset+n])
		if m == CBC {
			for j := 0; j < n; j++ {
				out[offset+j] ^= prev[j]
			}
			prev = ciphertext[offset : offset+n]
		}
	}
	pad := int(out[len(out)-1])
	if pad == 0 || pad > n {
		return nil, errors.New("invalid padding")
	}
	for _, v := range out[len(out)-pad:] {
		if int(v) != pad {
			return nil, errors.New("invalid padding")
		}
	}
	return out[:len(out)-pad], nil
}

func stream(b cipher.Block, m Mode, iv, input []byte, decrypt bool) ([]byte, error) {
	n := b.BlockSize()
	out := make([]byte, len(input))
	state := append([]byte(nil), iv...)
	keystream := make([]byte, n)
	for offset := 0; offset < len(input); offset += n {
		b.EncryptBlock(keystream, state)
		count := min(n, len(input)-offset)
		for j := 0; j < count; j++ {
			out[offset+j] = input[offset+j] ^ keystream[j]
		}
		switch m {
		case CFB:
			if decrypt {
				copy(state, input[offset:offset+count])
			} else {
				copy(state, out[offset:offset+count])
			}
		case OFB:
			copy(state, keystream)
		case CTR:
			if offset+count < len(input) && !increment(state) {
				return nil, errors.New("CTR counter exhausted")
			}
		}
	}
	return out, nil
}

func increment(counter []byte) bool {
	for i := len(counter) - 1; i >= 0; i-- {
		counter[i]++
		if counter[i] != 0 {
			return true
		}
	}
	return false
}
