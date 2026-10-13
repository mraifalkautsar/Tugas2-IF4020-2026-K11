package controller

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

func ParseKeyOrIV(s string, expectedLen int) ([]byte, error) {
	if len(s) == expectedLen*2 {
		if b, err := hex.DecodeString(s); err == nil {
			return b, nil
		}
	}
	b := []byte(s)
	if len(b) == expectedLen {
		return b, nil
	}
	return nil, fmt.Errorf("must be %d bytes or %d hex characters", expectedLen, expectedLen*2)
}

func PadData(data []byte, blockSize int, scheme string) []byte {
	padLen := blockSize - (len(data) % blockSize)
	if padLen == 0 && strings.EqualFold(scheme, "Zero") {
		return data
	}
	if padLen == 0 {
		padLen = blockSize
	}
	padded := make([]byte, len(data)+padLen)
	copy(padded, data)

	switch strings.ToUpper(scheme) {
	case "ZERO":
	case "ANSI_X923":
		padded[len(padded)-1] = byte(padLen)
	default:
		for i := len(data); i < len(padded); i++ {
			padded[i] = byte(padLen)
		}
	}
	return padded
}

func UnpadData(data []byte, blockSize int, scheme string) ([]byte, error) {
	if len(data) == 0 || len(data)%blockSize != 0 {
		return nil, errors.New("invalid block size or empty ciphertext")
	}
	switch strings.ToUpper(scheme) {
	case "ZERO":
		i := len(data) - 1
		for i >= 0 && data[i] == 0 {
			i--
		}
		return data[:i+1], nil
	case "ANSI_X923":
		padLen := int(data[len(data)-1])
		if padLen <= 0 || padLen > blockSize {
			return nil, errors.New("invalid ANSI X9.23 padding length")
		}
		for i := len(data) - padLen; i < len(data)-1; i++ {
			if data[i] != 0 {
				return nil, errors.New("invalid ANSI X9.23 padding bytes")
			}
		}
		return data[:len(data)-padLen], nil
	default:
		padLen := int(data[len(data)-1])
		if padLen <= 0 || padLen > blockSize {
			return nil, errors.New("invalid PKCS#7 padding length")
		}
		for i := len(data) - padLen; i < len(data); i++ {
			if int(data[i]) != padLen {
				return nil, errors.New("invalid PKCS#7 padding bytes")
			}
		}
		return data[:len(data)-padLen], nil
	}
}

func BlockToMatrix(block []byte) Matrix4x4 {
	var m Matrix4x4
	for col := 0; col < 4; col++ {
		for row := 0; row < 4; row++ {
			if 4*col+row < len(block) {
				m[row][col] = int(block[4*col+row])
			}
		}
	}
	return m
}

func JSONResponse(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(data)
}

func JSONError(w http.ResponseWriter, code int, message string) {
	JSONResponse(w, code, ErrorResponse{
		Status:  "error",
		Message: message,
	})
}
