export type CipherMode = 'ECB' | 'CBC' | 'CFB' | 'OFB' | 'CTR';
export type PaddingScheme = 'PKCS7' | 'Zero' | 'ANSI_X923';
export type CipherAction = 'encrypt' | 'decrypt';

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
