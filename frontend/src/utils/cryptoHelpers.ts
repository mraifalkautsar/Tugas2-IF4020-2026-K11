export const getByteLength = (str: string): number => {
  return new TextEncoder().encode(str).length;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === 1) return '1 Byte';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return `${bytes} Bytes`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const calculateBlocks = (bytes: number, blockSize = 16): number => {
  if (bytes === 0) return 0;
  return Math.ceil(bytes / blockSize);
};

export const generateRandom16BytesKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint8Array(16);
    cryptoObj.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
};

export const generateRandom16BytesIV = (): string => {
  const chars = '0123456789ABCDEFabcdef';
  let result = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint8Array(16);
    cryptoObj.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
};

export const toHexString = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const simulateLocalCipher = (
  action: 'encrypt' | 'decrypt',
  inputData: Uint8Array,
  key: string,
  iv: string,
  mode: string
): { hex: string; base64: string; entropy: number; elapsedMs: number } => {
  const start = performance.now();
  const keyBytes = new TextEncoder().encode(key);
  const ivBytes = new TextEncoder().encode(iv || '0123456789abcdef');
  const out = new Uint8Array(inputData.length);

  for (let i = 0; i < inputData.length; i++) {
    const kByte = keyBytes[i % keyBytes.length] || 0x42;
    const ivByte = ivBytes[i % ivBytes.length] || 0x11;
    const roundOffset = (i * 7 + 13) % 256;
    
    if (action === 'encrypt') {
      out[i] = (inputData[i] ^ kByte ^ ivByte ^ roundOffset) & 0xff;
    } else {
      out[i] = (inputData[i] ^ kByte ^ ivByte ^ roundOffset) & 0xff;
    }
  }

  const freq: Record<number, number> = {};
  for (let i = 0; i < out.length; i++) {
    freq[out[i]] = (freq[out[i]] || 0) + 1;
  }
  let entropy = 0;
  if (out.length > 0) {
    for (const val in freq) {
      const p = freq[val] / out.length;
      entropy -= p * Math.log2(p);
    }
  }

  const end = performance.now();
  return {
    hex: toHexString(out),
    base64: bytesToBase64(out),
    entropy: parseFloat(entropy.toFixed(4)),
    elapsedMs: parseFloat((end - start + Math.random() * 8 + 3).toFixed(2)),
  };
};

export const hexToBytes = (hexStr: string): Uint8Array => {
  const clean = hexStr.replace(/\s+/g, '');
  if (clean.length === 0 || clean.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
};

export const base64ToBytes = (b64: string): Uint8Array => {
  try {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
};

export const calculateHistogram = (bytes: Uint8Array): number[] => {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    hist[bytes[i]]++;
  }
  return hist;
};

export interface DetailedEntropy {
  entropy: number;
  percentageOfMax: number;
  uniqueBytes: number;
  mean: number;
  stdDev: number;
  minFreq: number;
  maxFreq: number;
  chiSquare: number;
}

export const calculateDetailedEntropy = (bytes: Uint8Array): DetailedEntropy => {
  if (bytes.length === 0) {
    return {
      entropy: 0,
      percentageOfMax: 0,
      uniqueBytes: 0,
      mean: 0,
      stdDev: 0,
      minFreq: 0,
      maxFreq: 0,
      chiSquare: 0,
    };
  }

  const hist = calculateHistogram(bytes);
  let entropy = 0;
  let uniqueBytes = 0;
  let sum = 0;
  let minFreq = Infinity;
  let maxFreq = 0;

  for (let i = 0; i < 256; i++) {
    const count = hist[i];
    if (count > 0) {
      uniqueBytes++;
      const p = count / bytes.length;
      entropy -= p * Math.log2(p);
    }
    sum += i * count;
    if (count < minFreq) minFreq = count;
    if (count > maxFreq) maxFreq = count;
  }

  const mean = sum / bytes.length;
  let varianceSum = 0;
  for (let i = 0; i < bytes.length; i++) {
    varianceSum += Math.pow(bytes[i] - mean, 2);
  }
  const stdDev = Math.sqrt(varianceSum / bytes.length);

  const expected = bytes.length / 256;
  let chiSquare = 0;
  if (expected > 0) {
    for (let i = 0; i < 256; i++) {
      chiSquare += Math.pow(hist[i] - expected, 2) / expected;
    }
  }

  return {
    entropy: parseFloat(entropy.toFixed(4)),
    percentageOfMax: parseFloat(((entropy / 8.0) * 100).toFixed(2)),
    uniqueBytes,
    mean: parseFloat(mean.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    minFreq: minFreq === Infinity ? 0 : minFreq,
    maxFreq,
    chiSquare: parseFloat(chiSquare.toFixed(2)),
  };
};

export const formatDownloadFilename = (
  action: 'encrypt' | 'decrypt',
  isFromFile: boolean,
  originalFileName?: string
): string => {
  if (action === 'encrypt') {
    if (isFromFile && originalFileName) {
      return `${originalFileName}.enc`;
    }
    return 'enctext.enc';
  } else {
    if (isFromFile && originalFileName) {
      const nameWithoutEnc = originalFileName.replace(/\.enc$/i, '');
      const lastDot = nameWithoutEnc.lastIndexOf('.');
      if (lastDot > 0) {
        return nameWithoutEnc.substring(0, lastDot);
      }
      return nameWithoutEnc;
    }
    return 'DecryptedText';
  }
};

export const triggerFileDownload = (
  bytes: Uint8Array,
  filename: string,
  mimeType = 'application/octet-stream'
) => {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
