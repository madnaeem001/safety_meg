/**
 * Encryption Service
 * Provides AES-GCM encryption for sensitive data using Web Crypto API
 */

class EncryptionService {
  private key: CryptoKey | null = null;
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this.key) return;
    this.key = await this.getOrCreateKey();
  }

  private async getOrCreateKey(): Promise<CryptoKey> {
    // In a real app, this key should be derived from user credentials or stored securely
    // For this demo, we'll use a stored key or generate one
    const storedKey = localStorage.getItem('safetymeg_encryption_key');
    
    if (storedKey) {
      const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      return await window.crypto.subtle.importKey(
        'raw',
        keyData,
        this.ALGORITHM,
        true,
        this.KEY_USAGE
      );
    } else {
      const key = await window.crypto.subtle.generateKey(
        { name: this.ALGORITHM, length: 256 },
        true,
        this.KEY_USAGE
      );
      
      const exportedKey = await window.crypto.subtle.exportKey('raw', key);
      const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
      localStorage.setItem('safetymeg_encryption_key', keyString);
      
      return key;
    }
  }

  async encrypt(data: string): Promise<{ cipherText: string; iv: string }> {
    if (!this.key) await this.initialize();
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      this.key!,
      encodedData
    );
    
    return {
      cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async decrypt(cipherText: string, iv: string): Promise<string> {
    if (!this.key) await this.initialize();
    
    const encryptedData = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: ivData },
        this.key!,
        encryptedData
      );
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

export const encryptionService = new EncryptionService();
