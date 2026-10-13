package brainrot

import (
	"math/bits"
	"testing"
)

type binaryVector [2]uint64

func (v binaryVector) bit(index int) uint64 { return (v[index/64] >> uint(index%64)) & 1 }

func dependent(columns []binaryVector, keep binaryVector) bool {
	var pivots [128]binaryVector
	for _, column := range columns {
		v := binaryVector{column[0] & keep[0], column[1] & keep[1]}
		for v != (binaryVector{}) {
			pivot := bits.Len64(v[0]) - 1
			if v[1] != 0 {
				pivot = 64 + bits.Len64(v[1]) - 1
			}
			if pivots[pivot] == (binaryVector{}) {
				pivots[pivot] = v
				break
			}
			v[0] ^= pivots[pivot][0]
			v[1] ^= pivots[pivot][1]
		}
		if v == (binaryVector{}) {
			return true
		}
	}
	return false
}

func byteSupports(size int) [][]int {
	var result [][]int
	var visit func([]int, int)
	visit = func(current []int, start int) {
		if len(current) == size {
			result = append(result, append([]int(nil), current...))
			return
		}
		for i := start; i < 16; i++ {
			visit(append(current, i), i+1)
		}
	}
	visit(nil, 0)
	return result
}

func TestLinearLayerBranchBounds(t *testing.T) {
	var matrix, transpose [128]binaryVector
	for inputBit := range matrix {
		var input, output [16]byte
		input[inputBit/8] = 1 << uint(inputBit%8)
		s := stateFromBlock(input[:])
		shiftRows67(&s)
		mixColumns67(&s)
		bitPlaneTranspose(&s)
		stateToBlock(output[:], &s)
		for i, v := range output {
			matrix[inputBit][i/8] |= uint64(v) << uint(8*(i%8))
		}
	}
	for row := range transpose {
		for column := range matrix {
			transpose[row][column/64] |= matrix[column].bit(row) << uint(column%64)
		}
	}
	var supports [4][][]int
	for size := 1; size <= 3; size++ {
		supports[size] = byteSupports(size)
	}
	for _, tc := range []struct {
		name    string
		columns [128]binaryVector
	}{{"differential", matrix}, {"linear masks", transpose}} {
		t.Run(tc.name, func(t *testing.T) {
			checked := 0
			for inputSize := 1; inputSize <= 3; inputSize++ {
				for outputSize := 1; inputSize+outputSize <= 4; outputSize++ {
					for _, inputSupport := range supports[inputSize] {
						columns := make([]binaryVector, 0, 8*inputSize)
						for _, i := range inputSupport {
							columns = append(columns, tc.columns[8*i:8*i+8]...)
						}
						for _, outputSupport := range supports[outputSize] {
							keep := binaryVector{^uint64(0), ^uint64(0)}
							for _, i := range outputSupport {
								keep[i/8] &^= uint64(255) << uint(8*(i%8))
							}
							if dependent(columns, keep) {
								t.Fatalf("branch number <5: input %v, output %v", inputSupport, outputSupport)
							}
							checked++
						}
					}
				}
			}
			if checked != 36416 {
				t.Fatalf("incomplete support enumeration: %d", checked)
			}
			t.Logf("all %d supports exclude branch weights below 5", checked)
		})
	}
}
