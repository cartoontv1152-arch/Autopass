// Local Storage Service - Fallback for IPFS
// Stores images and metadata locally when IPFS is not available

// this is just for teh backup till not working for testing this is created 
export class LocalStorageService {
  private static readonly STORAGE_PREFIX = 'autopass_';
  private static readonly IMAGE_PREFIX = 'autopass_image_';
  private static readonly METADATA_PREFIX = 'autopass_metadata_';

  // Store image as base64
  static async storeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const storageKey = `${this.IMAGE_PREFIX}${Date.now()}_${file.name}`;
        localStorage.setItem(storageKey, base64);
        resolve(storageKey);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Store metadata as JSON
  static storeMetadata(data: any): string {
    const storageKey = `${this.METADATA_PREFIX}${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return storageKey;
  }

  // Get image from storage
  static getImage(storageKey: string): string | null {
    return localStorage.getItem(storageKey);
  }

  // Get metadata from storage
  static getMetadata(storageKey: string): any | null {
    const data = localStorage.getItem(storageKey);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Check if key is a local storage key
  static isLocalStorageKey(key: string): boolean {
    return key.startsWith(this.IMAGE_PREFIX) || key.startsWith(this.METADATA_PREFIX);
  }

  // Get URL for image (base64 data URL)
  static getImageURL(storageKey: string): string {
    const image = this.getImage(storageKey);
    return image || 'https://via.placeholder.com/400?text=Image';
  }

  // Clean up old items (optional - for maintenance)
  static cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        const timestamp = parseInt(key.split('_').pop() || '0');
        if (now - timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

