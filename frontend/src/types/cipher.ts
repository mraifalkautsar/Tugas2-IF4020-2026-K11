export type Matrix4x4 = number[][];

export type CipherMode = 'ECB' | 'CBC' | 'CFB' | 'OFB' | 'CTR';
export type PaddingScheme = 'PKCS7' | 'Zero' | 'ANSI_X923';
export type CipherAction = 'encrypt' | 'decrypt';

export interface RoundTrace {
  round: number;
  start_state: Matrix4x4;
  after_sub_bytes: Matrix4x4;
  after_shift_rows: Matrix4x4;
  after_mix_columns: Matrix4x4;
  after_add_round_key: Matrix4x4;
}

export interface TraceResponse {
  sbox: number[][];
  round_keys: Matrix4x4[];
  rounds: RoundTrace[];
}

export interface ProcessResponse {
  status: 'success' | 'error';
  output_base64: string;
  output_hex: string;
  entropy: number;
  elapsed_ms: number;
  message?: string;
}

export interface AvalancheRoundProgression {
  round: number;
  bits_flipped: number;
  percentage: number;
}

export interface AvalancheResponse {
  flipped_bit: number;
  original_ciphertext_hex: string;
  modified_ciphertext_hex: string;
  total_avalanche_percentage: number;
  round_progression: AvalancheRoundProgression[];
}
