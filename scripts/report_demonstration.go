// Run from the repository root:
// go -C src run ../scripts/report_demonstration.go
// Uses the real HTTP controller in a temporary local server, without UI fallback.
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher/brainrot"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/controller"
)

const keyHex = "00112233445566778899aabbccddeeff"
const ivHex = "000102030405060708090a0b0c0d0e0f"

type recovery struct {
	Mode            string `json:"mode"`
	Fixture         string `json:"fixture"`
	PlaintextBytes  int    `json:"plaintext_bytes"`
	CiphertextBytes int    `json:"ciphertext_bytes"`
	EncryptStatus   int    `json:"encrypt_status"`
	DecryptStatus   int    `json:"decrypt_status"`
	BytesEqual      bool   `json:"bytes_equal"`
	PlainSHA256     string `json:"plaintext_sha256"`
	RecoveredSHA256 string `json:"recovered_sha256"`
}

type failureCase struct {
	Mode       string `json:"mode"`
	Case       string `json:"case"`
	Status     int    `json:"http_status"`
	BytesEqual bool   `json:"bytes_equal"`
	Message    string `json:"message,omitempty"`
}

func digest(data []byte) string { return fmt.Sprintf("%x", sha256.Sum256(data)) }

func process(url, action, mode, key, iv, padding string, data []byte) ([]byte, int, string, bool) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for name, value := range map[string]string{
		"action": action, "mode": mode, "key": key, "iv": iv, "padding": padding,
	} {
		if err := w.WriteField(name, value); err != nil {
			panic(err)
		}
	}
	file, err := w.CreateFormFile("file", "sample.bin")
	if err != nil {
		panic(err)
	}
	if _, err := file.Write(data); err != nil {
		panic(err)
	}
	if err := w.Close(); err != nil {
		panic(err)
	}
	response, err := http.Post(url, w.FormDataContentType(), &body)
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(response.Body)
	if err != nil {
		panic(err)
	}
	var result struct {
		Output  string `json:"output_hex"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		panic(err)
	}
	output, err := hex.DecodeString(result.Output)
	if err != nil {
		panic(err)
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		panic(err)
	}
	_, hasIV := fields["iv"]
	_, hasIVHex := fields["iv_hex"]
	return output, response.StatusCode, result.Message, hasIV || hasIVHex
}

func main() {
	outputPath := flag.String("output", "../reports/brainrot/document-demo.json", "recorded demonstration output")
	flag.Parse()
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/cipher/process", controller.Process)
	server := httptest.NewServer(controller.SecurityMiddleware(mux))
	defer server.Close()
	url := server.URL + "/api/cipher/process"
	var recoveries []recovery
	var failures []failureCase
	for _, mode := range []string{"ECB", "CBC", "CFB", "OFB", "CTR"} {
		iv := ivHex
		if mode == "ECB" {
			iv = ""
		}
		for _, name := range []string{"repeated-text.txt", "byte-pattern.bin"} {
			plain, err := os.ReadFile(filepath.Join("testdata/fixtures", name))
			if err != nil {
				panic(err)
			}
			ciphertext, encStatus, _, _ := process(url, "encrypt", mode, keyHex, iv, "PKCS7", plain)
			recovered, decStatus, _, _ := process(url, "decrypt", mode, keyHex, iv, "PKCS7", ciphertext)
			equal := bytes.Equal(plain, recovered)
			if encStatus != 200 || decStatus != 200 || !equal {
				panic(fmt.Sprintf("round-trip failed: %s %s", mode, name))
			}
			recoveries = append(recoveries, recovery{
				mode, name, len(plain), len(ciphertext), encStatus, decStatus,
				equal, digest(plain), digest(recovered),
			})
			if name != "repeated-text.txt" {
				continue
			}
			modified := append([]byte(nil), ciphertext...)
			modified[0] ^= 1 // Does not affect the last padded block in ECB/CBC.
			for _, tc := range []struct {
				name, key, iv string
				data          []byte
			}{
				{"ciphertext_changed", keyHex, iv, modified},
				{"ciphertext_truncated", keyHex, iv, ciphertext[:len(ciphertext)-1]},
				{"wrong_key", "01112233445566778899aabbccddeeff", iv, ciphertext},
			} {
				got, status, message, _ := process(url, "decrypt", mode, tc.key, tc.iv, "PKCS7", tc.data)
				failures = append(failures, failureCase{mode, tc.name, status, bytes.Equal(plain, got), message})
			}
			if mode != "ECB" {
				got, status, message, _ := process(url, "decrypt", mode, keyHex,
					"010102030405060708090a0b0c0d0e0f", "PKCS7", ciphertext)
				failures = append(failures, failureCase{mode, "iv_changed", status, bytes.Equal(plain, got), message})
			}
		}
	}
	var paddingChecks []map[string]any
	for _, size := range []int{0, 1, 15, 16, 17, 32} {
		plain := make([]byte, size)
		for i := range plain {
			plain[i] = byte(i)
		}
		ciphertext, _, _, _ := process(url, "encrypt", "CBC", keyHex, ivHex, "PKCS7", plain)
		recovered, status, _, _ := process(url, "decrypt", "CBC", keyHex, ivHex, "PKCS7", ciphertext)
		if status != 200 || !bytes.Equal(plain, recovered) {
			panic("padding round-trip failed")
		}
		paddingChecks = append(paddingChecks, map[string]any{
			"plaintext_bytes": size, "padding_bytes": 16 - size%16,
			"ciphertext_bytes": len(ciphertext), "bytes_equal": true,
		})
	}
	plain := []byte("Halo Brainrot")
	ciphertext, _, _, _ := process(url, "encrypt", "CBC", keyHex, ivHex, "PKCS7", plain)
	recovered, _, _, _ := process(url, "decrypt", "CBC", keyHex, ivHex, "PKCS7", ciphertext)
	zeroInput := []byte{1, 0}
	zeroRecovered, _ := controller.UnpadData(controller.PadData(zeroInput, 16, "Zero"), 16, "Zero")
	autoCiphertext, _, _, autoIVReturned := process(url, "encrypt", "OFB", keyHex, "", "PKCS7", plain)
	autoRecovered, _, _, _ := process(url, "decrypt", "OFB", keyHex, "", "PKCS7", autoCiphertext)
	_, badKeyStatus, badKeyMessage, _ := process(url, "encrypt", "CBC", "short", ivHex, "PKCS7", plain)
	key, _ := hex.DecodeString(keyHex)
	iv, _ := hex.DecodeString(ivHex)
	block, _ := brainrot.New(key)
	badPadding, encryptedBadPadding := make([]byte, 16), make([]byte, 16)
	for i := range badPadding {
		badPadding[i] ^= iv[i]
	}
	block.EncryptBlock(encryptedBadPadding, badPadding)
	_, badPaddingStatus, badPaddingMessage, _ := process(url, "decrypt", "CBC", keyHex, ivHex, "PKCS7", encryptedBadPadding)
	result := map[string]any{
		"cipher": (brainrot.Factory{}).Name(), "generated_utc": time.Now().UTC().Format(time.RFC3339),
		"go_version": runtime.Version(), "key_hex": keyHex, "iv_hex": ivHex,
		"method":     "HTTP multipart requests to the real controller; no browser fallback",
		"recoveries": recoveries, "modification_checks": failures, "padding_checks": paddingChecks,
		"cbc_example": map[string]string{"plaintext": string(plain), "ciphertext_hex": hex.EncodeToString(ciphertext), "recovered": string(recovered)},
		"limitations": map[string]any{
			"zero_input_hex": hex.EncodeToString(zeroInput), "zero_recovered_hex": hex.EncodeToString(zeroRecovered),
			"automatic_iv_returned": autoIVReturned, "automatic_iv_roundtrip_equal": bytes.Equal(plain, autoRecovered),
			"invalid_key_status": badKeyStatus, "invalid_key_message": badKeyMessage,
			"invalid_padding_status": badPaddingStatus, "invalid_padding_message": badPaddingMessage,
		},
	}
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		panic(err)
	}
	if err := os.MkdirAll(filepath.Dir(*outputPath), 0755); err != nil {
		panic(err)
	}
	if err := os.WriteFile(*outputPath, append(data, '\n'), 0644); err != nil {
		panic(err)
	}
	fmt.Printf("Recorded %d successful file recoveries and %d modification checks in %s\n", len(recoveries), len(failures), *outputPath)
}
