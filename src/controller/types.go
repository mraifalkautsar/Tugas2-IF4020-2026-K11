package controller

type Matrix4x4 [4][4]int

type ProcessRequest struct {
	Action     string `json:"action"`
	Mode       string `json:"mode"`
	Key        string `json:"key"`
	IV         string `json:"iv"`
	Padding    string `json:"padding"`
	DataFormat string `json:"data_format"`
	Payload    string `json:"payload"`
}

type ProcessResponse struct {
	Status       string  `json:"status"`
	OutputBase64 string  `json:"output_base64"`
	OutputHex    string  `json:"output_hex"`
	Entropy      float64 `json:"entropy"`
	ElapsedMs    float64 `json:"elapsed_ms"`
	Message      string  `json:"message,omitempty"`
}

type RoundTrace struct {
	Round            int       `json:"round"`
	StartState       Matrix4x4 `json:"start_state"`
	AfterSubBytes    Matrix4x4 `json:"after_sub_bytes"`
	AfterShiftRows   Matrix4x4 `json:"after_shift_rows"`
	AfterMixColumns  Matrix4x4 `json:"after_mix_columns"`
	AfterAddRoundKey Matrix4x4 `json:"after_add_round_key"`
}

type TraceRequest struct {
	BlockHex string `json:"block_hex"`
	KeyHex   string `json:"key_hex"`
	Action   string `json:"action"`
}

type TraceResponse struct {
	Sbox      [16][16]int  `json:"sbox"`
	RoundKeys []Matrix4x4  `json:"round_keys"`
	Rounds    []RoundTrace `json:"rounds"`
}

type AvalancheRequest struct {
	Target       string `json:"target"`
	BlockHex     string `json:"block_hex"`
	KeyHex       string `json:"key_hex"`
	FlipBitIndex int    `json:"flip_bit_index"`
}

type AvalancheRoundProgression struct {
	Round       int     `json:"round"`
	BitsFlipped int     `json:"bits_flipped"`
	Percentage  float64 `json:"percentage"`
}

type AvalancheResponse struct {
	FlippedBit               int                         `json:"flipped_bit"`
	OriginalCiphertextHex    string                      `json:"original_ciphertext_hex"`
	ModifiedCiphertextHex    string                      `json:"modified_ciphertext_hex"`
	TotalAvalanchePercentage float64                     `json:"total_avalanche_percentage"`
	RoundProgression         []AvalancheRoundProgression `json:"round_progression"`
}

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
