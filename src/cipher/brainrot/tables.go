package brainrot

var mix67 = [4][4]byte{
	{0x0c, 0x0a, 0x06, 0x06},
	{0x07, 0x0e, 0x09, 0x07},
	{0x06, 0x06, 0x0c, 0x0a},
	{0x09, 0x07, 0x07, 0x0e},
}

var inverseMix67 = [4][4]byte{
	{0xf4, 0xba, 0x79, 0x03},
	{0x8e, 0x02, 0x78, 0x6a},
	{0x79, 0x03, 0xf4, 0xba},
	{0x78, 0x6a, 0x8e, 0x02},
}

var sbox67 = generateSbox67()
var inverseSbox67 = generateInverseSbox67(sbox67)

// generateSbox67 permutes a row-major 16x16 matrix of bytes 0..255.
// Row/column indices are zero-based; each round swaps axis 6 before axis 7.
func generateSbox67() [256]byte {
	var table [256]byte
	for x := range table {
		table[x] = byte(x)
	}
	for round := 0; round < 67; round++ {
		for _, axis := range []int{6, 7} {
			for i := 0; i < 16; i++ {
				a, b := 16*axis+i, 16*i+axis
				table[a], table[b] = table[b], table[a]
			}
		}
		// All rows shift right by 6, then all columns shift down by 7.
		// A separate buffer combines both circular shifts without overwriting.
		var shifted [256]byte
		for row := 0; row < 16; row++ {
			for col := 0; col < 16; col++ {
				shifted[16*((row+7)%16)+(col+6)%16] = table[16*row+col]
			}
		}
		table = shifted
	}
	return table
}

func generateInverseSbox67(table [256]byte) [256]byte {
	var inverse [256]byte
	for x, value := range table {
		inverse[value] = byte(x)
	}
	return inverse
}
