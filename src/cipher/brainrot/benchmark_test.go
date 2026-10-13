package brainrot

import "testing"

func BenchmarkEncryptBlock(b *testing.B) {
	block, err := New(make([]byte, KeySize))
	if err != nil {
		b.Fatal(err)
	}
	data := make([]byte, BlockSize)
	b.SetBytes(BlockSize)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		block.EncryptBlock(data, data)
	}
}

func BenchmarkDecryptBlock(b *testing.B) {
	block, err := New(make([]byte, KeySize))
	if err != nil {
		b.Fatal(err)
	}
	data := make([]byte, BlockSize)
	block.EncryptBlock(data, data)
	b.SetBytes(BlockSize)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		block.DecryptBlock(data, data)
	}
}
