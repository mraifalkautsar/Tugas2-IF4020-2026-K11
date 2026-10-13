package brainrot

import (
	"encoding/binary"
	"math/bits"
)

func bitPlaneTranspose(s *state) {
	var input, output [BlockSize]byte
	stateToBlock(input[:], s)
	for i, value := range input {
		for bit := 0; bit < 8; bit++ {
			destination := (3 * (16*bit + i)) % 128
			output[destination/8] |= ((value >> (7 - bit)) & 1) << (7 - destination%8)
		}
	}
	*s = stateFromBlock(output[:])
}

func inverseBitPlaneTranspose(s *state) {
	var input, output [BlockSize]byte
	stateToBlock(input[:], s)
	for position := 0; position < 128; position++ {
		q := (43 * position) % 128
		i, bit := q%16, q/16
		output[i] |= ((input[position/8] >> (7 - position%8)) & 1) << (7 - bit)
	}
	*s = stateFromBlock(output[:])
}

var feistelRotations = [4][3]int{
	{9, 21, 37}, {13, 29, 43}, {7, 17, 31}, {11, 23, 41},
}

func feistelFunction(x uint64, rotations [3]int) uint64 {
	return bits.RotateLeft64(x, rotations[0]) ^
		(x & bits.RotateLeft64(x, rotations[1])) ^
		bits.RotateLeft64(x, rotations[2])
}

func feistelCrossMix(s *state) {
	var data [BlockSize]byte
	stateToBlock(data[:], s)
	left, right := binary.BigEndian.Uint64(data[:8]), binary.BigEndian.Uint64(data[8:])
	for _, rotations := range feistelRotations {
		left, right = right, left^feistelFunction(right, rotations)
	}
	binary.BigEndian.PutUint64(data[:8], left)
	binary.BigEndian.PutUint64(data[8:], right)
	*s = stateFromBlock(data[:])
}

func inverseFeistelCrossMix(s *state) {
	var data [BlockSize]byte
	stateToBlock(data[:], s)
	left, right := binary.BigEndian.Uint64(data[:8]), binary.BigEndian.Uint64(data[8:])
	for step := len(feistelRotations) - 1; step >= 0; step-- {
		left, right = right^feistelFunction(left, feistelRotations[step]), left
	}
	binary.BigEndian.PutUint64(data[:8], left)
	binary.BigEndian.PutUint64(data[8:], right)
	*s = stateFromBlock(data[:])
}

func modularAddition(s *state, key [BlockSize]byte) {
	for column := 0; column < 4; column++ {
		for row := 0; row < 4; row++ {
			s[row][column] += key[4*column+row]
		}
	}
}

func inverseModularAddition(s *state, key [BlockSize]byte) {
	for column := 0; column < 4; column++ {
		for row := 0; row < 4; row++ {
			s[row][column] -= key[4*column+row]
		}
	}
}
