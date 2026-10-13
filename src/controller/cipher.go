package controller

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"math"
	"math/bits"
	"net/http"
	"strings"
	"time"

	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/analysis"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/cipher/brainrot"
	"github.com/mraifalkautsar/Tugas2-IF4020-2026-K11/src/modes"
)

func Process(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var action, modeStr, keyStr, ivStr, paddingStr, dataFormat string
	var inputBytes []byte

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			JSONError(w, http.StatusBadRequest, "failed to parse multipart form: "+err.Error())
			return
		}
		action = r.FormValue("action")
		modeStr = r.FormValue("mode")
		keyStr = r.FormValue("key")
		ivStr = r.FormValue("iv")
		paddingStr = r.FormValue("padding")
		dataFormat = "file"

		file, _, err := r.FormFile("file")
		if err != nil {
			JSONError(w, http.StatusBadRequest, "file field is required in multipart form")
			return
		}
		defer file.Close()

		var readErr error
		inputBytes, readErr = io.ReadAll(file)
		if readErr != nil {
			JSONError(w, http.StatusBadRequest, "failed to read uploaded file")
			return
		}
	} else {
		var req ProcessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid JSON payload: "+err.Error())
			return
		}
		action = req.Action
		modeStr = req.Mode
		keyStr = req.Key
		ivStr = req.IV
		paddingStr = req.Padding
		dataFormat = req.DataFormat

		if strings.EqualFold(action, "decrypt") {
			trimmed := strings.TrimSpace(req.Payload)
			if decoded, err := hex.DecodeString(trimmed); err == nil && len(decoded) > 0 {
				inputBytes = decoded
			} else if decoded, err := base64.StdEncoding.DecodeString(trimmed); err == nil && len(decoded) > 0 {
				inputBytes = decoded
			} else {
				inputBytes = []byte(req.Payload)
			}
		} else {
			inputBytes = []byte(req.Payload)
		}
	}

	if action == "" {
		action = "encrypt"
	}
	if modeStr == "" {
		modeStr = "CBC"
	}
	if paddingStr == "" {
		paddingStr = "PKCS7"
	}

	key, err := ParseKeyOrIV(keyStr, brainrot.KeySize)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "invalid key: "+err.Error())
		return
	}

	b, err := brainrot.New(key)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "failed to initialize cipher: "+err.Error())
		return
	}

	mode := modes.Mode(strings.ToUpper(modeStr))
	var iv []byte
	if mode != modes.ECB {
		if ivStr != "" {
			iv, err = ParseKeyOrIV(ivStr, b.BlockSize())
			if err != nil {
				JSONError(w, http.StatusBadRequest, "invalid IV: "+err.Error())
				return
			}
		} else {
			iv = make([]byte, b.BlockSize())
			if _, err := rand.Read(iv); err != nil {
				JSONError(w, http.StatusInternalServerError, "failed to generate random IV")
				return
			}
		}
	}

	var output []byte
	if strings.EqualFold(action, "encrypt") {
		output, err = executeEncrypt(b, mode, iv, inputBytes, paddingStr)
		if err != nil {
			JSONError(w, http.StatusBadRequest, "encrypt error: "+err.Error())
			return
		}
	} else {
		output, err = executeDecrypt(b, mode, iv, inputBytes, paddingStr)
		if err != nil {
			JSONError(w, http.StatusBadRequest, "decrypt error: "+err.Error())
			return
		}
	}

	dist := analysis.Describe(output)
	elapsed := float64(time.Since(start).Microseconds()) / 1000.0

	_ = dataFormat
	JSONResponse(w, http.StatusOK, ProcessResponse{
		Status:       "success",
		OutputBase64: base64.StdEncoding.EncodeToString(output),
		OutputHex:    hex.EncodeToString(output),
		Entropy:      dist.Entropy,
		ElapsedMs:    elapsed,
	})
}

func Trace(w http.ResponseWriter, r *http.Request) {
	var req TraceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid JSON payload: "+err.Error())
		return
	}

	key, err := ParseKeyOrIV(req.KeyHex, brainrot.KeySize)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "invalid key: "+err.Error())
		return
	}

	block, err := ParseKeyOrIV(req.BlockHex, brainrot.BlockSize)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "invalid block: "+err.Error())
		return
	}

	b, err := brainrot.New(key)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "cipher init error: "+err.Error())
		return
	}

	snapshots, err := b.TraceEncryptBlock(block)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "trace error: "+err.Error())
		return
	}

	sboxArr := brainrot.SBoxTable()
	var sboxMatrix [16][16]int
	for row := 0; row < 16; row++ {
		for col := 0; col < 16; col++ {
			sboxMatrix[row][col] = int(sboxArr[row*16+col])
		}
	}

	roundKeysRaw := b.RoundKeys()
	roundKeysMatrix := make([]Matrix4x4, len(roundKeysRaw))
	for i := range roundKeysRaw {
		roundKeysMatrix[i] = BlockToMatrix(roundKeysRaw[i][:])
	}

	var round0AddRoundKey []byte
	roundSnapshots := make(map[int]map[string][]byte)
	for _, snap := range snapshots {
		if snap.Round == 0 && snap.Operation == "AddRoundKey67" {
			round0AddRoundKey = snap.State
			continue
		}
		if roundSnapshots[snap.Round] == nil {
			roundSnapshots[snap.Round] = make(map[string][]byte)
		}
		roundSnapshots[snap.Round][snap.Operation] = snap.State
	}

	rounds := make([]RoundTrace, 0, brainrot.Rounds)
	for round := 1; round <= brainrot.Rounds; round++ {
		m := roundSnapshots[round]
		var startState []byte
		if round == 1 {
			startState = round0AddRoundKey
		} else {
			startState = roundSnapshots[round-1]["AddRoundKey67"]
		}

		afterSubBytes := m["SubBytes67"]
		afterShiftRows := m["ShiftRows67"]
		afterMixColumns := m["MixColumns67"]
		if round == brainrot.Rounds && afterMixColumns == nil {
			afterMixColumns = afterShiftRows
		}
		afterAddRoundKey := m["AddRoundKey67"]

		rounds = append(rounds, RoundTrace{
			Round:            round,
			StartState:       BlockToMatrix(startState),
			AfterSubBytes:    BlockToMatrix(afterSubBytes),
			AfterShiftRows:   BlockToMatrix(afterShiftRows),
			AfterMixColumns:  BlockToMatrix(afterMixColumns),
			AfterAddRoundKey: BlockToMatrix(afterAddRoundKey),
		})
	}

	JSONResponse(w, http.StatusOK, TraceResponse{
		Sbox:      sboxMatrix,
		RoundKeys: roundKeysMatrix,
		Rounds:    rounds,
	})
}

func Avalanche(w http.ResponseWriter, r *http.Request) {
	var req AvalancheRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid JSON payload: "+err.Error())
		return
	}

	origKey, err := ParseKeyOrIV(req.KeyHex, brainrot.KeySize)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "invalid key: "+err.Error())
		return
	}

	origBlock, err := ParseKeyOrIV(req.BlockHex, brainrot.BlockSize)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "invalid block: "+err.Error())
		return
	}

	if req.FlipBitIndex < 0 || req.FlipBitIndex >= 128 {
		JSONError(w, http.StatusBadRequest, "flip_bit_index must be between 0 and 127")
		return
	}

	modKey := append([]byte(nil), origKey...)
	modBlock := append([]byte(nil), origBlock...)

	byteIdx := req.FlipBitIndex / 8
	bitOffset := uint(7 - (req.FlipBitIndex % 8))

	if strings.EqualFold(req.Target, "key") {
		modKey[byteIdx] ^= 1 << bitOffset
	} else {
		modBlock[byteIdx] ^= 1 << bitOffset
	}

	b1, err := brainrot.New(origKey)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "orig cipher init error: "+err.Error())
		return
	}
	b2, err := brainrot.New(modKey)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "mod cipher init error: "+err.Error())
		return
	}

	snaps1, err := b1.TraceEncryptBlock(origBlock)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "trace orig error: "+err.Error())
		return
	}
	snaps2, err := b2.TraceEncryptBlock(modBlock)
	if err != nil {
		JSONError(w, http.StatusBadRequest, "trace mod error: "+err.Error())
		return
	}

	addRoundKeyStates1 := make(map[int][]byte)
	addRoundKeyStates2 := make(map[int][]byte)
	for _, s := range snaps1 {
		if s.Operation == "AddRoundKey67" {
			addRoundKeyStates1[s.Round] = s.State
		}
	}
	for _, s := range snaps2 {
		if s.Operation == "AddRoundKey67" {
			addRoundKeyStates2[s.Round] = s.State
		}
	}

	progression := make([]AvalancheRoundProgression, 0, brainrot.Rounds)
	for r := 1; r <= brainrot.Rounds; r++ {
		s1 := addRoundKeyStates1[r]
		s2 := addRoundKeyStates2[r]
		flippedCount := 0
		for i := range s1 {
			flippedCount += bits.OnesCount8(s1[i] ^ s2[i])
		}
		pct := math.Round((float64(flippedCount)/128.0)*10000.0) / 100.0
		progression = append(progression, AvalancheRoundProgression{
			Round:       r,
			BitsFlipped: flippedCount,
			Percentage:  pct,
		})
	}

	totalPct := 0.0
	if len(progression) > 0 {
		totalPct = progression[len(progression)-1].Percentage
	}

	JSONResponse(w, http.StatusOK, AvalancheResponse{
		FlippedBit:               req.FlipBitIndex,
		OriginalCiphertextHex:    hex.EncodeToString(addRoundKeyStates1[brainrot.Rounds]),
		ModifiedCiphertextHex:    hex.EncodeToString(addRoundKeyStates2[brainrot.Rounds]),
		TotalAvalanchePercentage: totalPct,
		RoundProgression:         progression,
	})
}

func executeEncrypt(b *brainrot.Block, mode modes.Mode, iv, plaintext []byte, paddingStr string) ([]byte, error) {
	if mode == modes.ECB || mode == modes.CBC {
		padded := PadData(plaintext, b.BlockSize(), paddingStr)
		out := make([]byte, len(padded))
		prev := append([]byte(nil), iv...)
		n := b.BlockSize()
		for offset := 0; offset < len(padded); offset += n {
			block := make([]byte, n)
			copy(block, padded[offset:offset+n])
			if mode == modes.CBC {
				for j := 0; j < n; j++ {
					block[j] ^= prev[j]
				}
			}
			b.EncryptBlock(out[offset:offset+n], block)
			if mode == modes.CBC {
				prev = out[offset : offset+n]
			}
		}
		return out, nil
	}
	return modes.Encrypt(b, mode, iv, plaintext)
}

func executeDecrypt(b *brainrot.Block, mode modes.Mode, iv, ciphertext []byte, paddingStr string) ([]byte, error) {
	if mode == modes.ECB || mode == modes.CBC {
		if len(ciphertext) == 0 || len(ciphertext)%b.BlockSize() != 0 {
			return nil, errors.New("invalid ciphertext length for block mode")
		}
		out := make([]byte, len(ciphertext))
		prev := append([]byte(nil), iv...)
		n := b.BlockSize()
		for offset := 0; offset < len(ciphertext); offset += n {
			b.DecryptBlock(out[offset:offset+n], ciphertext[offset:offset+n])
			if mode == modes.CBC {
				for j := 0; j < n; j++ {
					out[offset+j] ^= prev[j]
				}
				prev = ciphertext[offset : offset+n]
			}
		}
		return UnpadData(out, b.BlockSize(), paddingStr)
	}
	return modes.Decrypt(b, mode, iv, ciphertext)
}
