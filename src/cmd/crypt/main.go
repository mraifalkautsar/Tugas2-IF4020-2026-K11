package main

import (
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher/brainrot"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "crypt:", err)
		os.Exit(1)
	}
}

func run() error {
	op := flag.String("op", "encrypt", "operasi: encrypt atau decrypt")
	keyHex := flag.String("key-hex", "", "kunci berupa 32 karakter heksadesimal")
	input := flag.String("input", "", "teks untuk encrypt, hex hasil encrypt untuk decrypt")
	modeName := flag.String("mode", "CBC", "mode: ECB, CBC, CFB, OFB, atau CTR")
	flag.Parse()
	if *op != "encrypt" && *op != "decrypt" {
		return fmt.Errorf("operasi harus encrypt atau decrypt")
	}
	key, err := hex.DecodeString(*keyHex)
	if err != nil {
		return fmt.Errorf("kunci hex tidak valid: %w", err)
	}
	b, err := brainrot.New(key)
	if err != nil {
		return err
	}
	mode := modes.Mode(strings.ToUpper(*modeName))
	var iv []byte
	data := []byte(*input)
	if *op == "encrypt" {
		if mode != modes.ECB {
			iv = make([]byte, b.BlockSize())
			if _, err := rand.Read(iv); err != nil {
				return err
			}
		}
		data, err = modes.Encrypt(b, mode, iv, data)
		if err != nil {
			return err
		}
		// IV disertakan di depan ciphertext agar tidak perlu parameter terpisah.
		fmt.Println(hex.EncodeToString(append(iv, data...)))
	} else {
		data, err = hex.DecodeString(*input)
		if err != nil {
			return fmt.Errorf("ciphertext hex tidak valid: %w", err)
		}
		if mode != modes.ECB {
			if len(data) < b.BlockSize() {
				return fmt.Errorf("ciphertext harus memuat IV %d byte", b.BlockSize())
			}
			iv, data = data[:b.BlockSize()], data[b.BlockSize():]
		}
		data, err = modes.Decrypt(b, mode, iv, data)
		if err != nil {
			return err
		}
		fmt.Println(string(data))
	}
	return nil
}
