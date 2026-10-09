import axios from 'axios';
import { 
  ProcessResponse, 
  TraceResponse, 
  AvalancheResponse, 
  CipherAction, 
  CipherMode, 
  PaddingScheme 
} from '../types/cipher';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
});

export const cipherApi = {
  async processData(payload: {
    action: CipherAction;
    mode: CipherMode;
    key: string;
    iv: string;
    padding: PaddingScheme;
    data_format: 'text' | 'file';
    payload?: string;
    file?: File;
  }): Promise<ProcessResponse> {
    if (payload.data_format === 'file' && payload.file) {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('action', payload.action);
      formData.append('mode', payload.mode);
      formData.append('key', payload.key);
      formData.append('iv', payload.iv);
      formData.append('padding', payload.padding);

      const res = await api.post<ProcessResponse>('/cipher/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }

    const res = await api.post<ProcessResponse>('/cipher/process', payload);
    return res.data;
  },

  async fetchTrace(params: {
    block_hex: string;
    key_hex: string;
    action: CipherAction;
  }): Promise<TraceResponse> {
    const res = await api.post<TraceResponse>('/cipher/trace', params);
    return res.data;
  },

  async testAvalanche(params: {
    target: 'plaintext' | 'key';
    block_hex: string;
    key_hex: string;
    flip_bit_index: number;
  }): Promise<AvalancheResponse> {
    const res = await api.post<AvalancheResponse>('/cipher/avalanche', params);
    return res.data;
  },
};
