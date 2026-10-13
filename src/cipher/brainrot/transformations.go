package brainrot

type state [4][4]byte

func stateFromBlock(block []byte) state {
	var s state
	for column := 0; column < 4; column++ {
		for row := 0; row < 4; row++ {
			s[row][column] = block[4*column+row]
		}
	}
	return s
}

func stateToBlock(dst []byte, s *state) {
	for column := 0; column < 4; column++ {
		for row := 0; row < 4; row++ {
			dst[4*column+row] = s[row][column]
		}
	}
}

func addRoundKey67(s *state, key [BlockSize]byte) {
	for row := 0; row < 4; row++ {
		for column := 0; column < 4; column++ {
			// 0x43 = 67 btw
			s[row][column] ^= key[4*column+row] ^ 0x43
		}
	}
}

func subBytes67(s *state) {
	for row := range s {
		for column := range s[row] {
			s[row][column] = sbox67[s[row][column]]
		}
	}
}

func inverseSubBytes67(s *state) {
	for row := range s {
		for column := range s[row] {
			s[row][column] = inverseSbox67[s[row][column]]
		}
	}
}

func shiftRows67(s *state) {
	for row := range s {
		original := s[row]
		offset := (6 + (row % 2)) % 4
		for column := range original {
			s[row][(column+offset)%4] = original[column]
		}
	}
}

func inverseShiftRows67(s *state) {
	for row := range s {
		original := s[row]
		offset := (6 + (row % 2)) % 4
		for column := range original {
			s[row][column] = original[(column+offset)%4]
		}
	}
}

func gfMul(a, b byte) byte {
	var result byte
	for bit := 0; bit < 8; bit++ {
		if b&1 != 0 {
			result ^= a
		}
		highBit := a & 0x80
		a <<= 1
		if highBit != 0 {
			a ^= 0x1b
		}
		b >>= 1
	}
	return result
}

func mixColumns67(s *state)        { multiplyColumns(s, mix67) }
func inverseMixColumns67(s *state) { multiplyColumns(s, inverseMix67) }

func multiplyColumns(s *state, matrix [4][4]byte) {
	for column := 0; column < 4; column++ {
		original := [4]byte{s[0][column], s[1][column], s[2][column], s[3][column]}
		for row := 0; row < 4; row++ {
			var value byte
			for k := 0; k < 4; k++ {
				value ^= gfMul(matrix[row][k], original[k])
			}
			s[row][column] = value
		}
	}
}

func keyExpansion67(masterKey [KeySize]byte) [Rounds + 1][BlockSize]byte {
	var words [4 * (Rounds + 1)][4]byte
	for i := 0; i < 4; i++ {
		copy(words[i][:], masterKey[4*i:4*i+4])
	}
	for i := 4; i < len(words); i++ {
		temp := words[i-1]
		if i%4 == 0 {
			// RotWord67, then SubWord67, then modified Rcon.
			temp = [4]byte{temp[1], temp[2], temp[3], temp[0]}
			for j := range temp {
				temp[j] = sbox67[temp[j]]
			}
			temp[0] ^= aesRcon[i/4-1] ^ 0x67
		}
		for j := range temp {
			words[i][j] = words[i-4][j] ^ temp[j]
		}
	}
	var keys [Rounds + 1][BlockSize]byte
	for round := range keys {
		for word := 0; word < 4; word++ {
			copy(keys[round][4*word:4*word+4], words[4*round+word][:])
		}
	}
	return keys
}
