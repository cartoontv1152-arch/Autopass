// IPFS Service - Using Local Storage Only
// All images and metadata are stored in browser localStorage

import { LocalStorageService } from './localStorage';

export class IPFSService {
  async uploadJSON(data: any): Promise<string> {
    // Always use local storage
    console.log('Storing metadata in local storage');
    return LocalStorageService.storeMetadata(data);
  }

  async uploadFile(file: File): Promise<string> {
    // Always use local storage
    console.log('Storing image in local storage');
    return await LocalStorageService.storeImage(file);
  }

  getGatewayURL(cid: string): string {
    // If it's a local storage key, get the image URL
    if (LocalStorageService.isLocalStorageKey(cid)) {
      return LocalStorageService.getImageURL(cid);
    }
    // Fallback placeholder
    return 'https://via.placeholder.com/400?text=Image';
  }

  async fetchFromIPFS(cid: string): Promise<any> {
    // If it's a local storage key, get from local storage
    if (LocalStorageService.isLocalStorageKey(cid)) {
      const metadata = LocalStorageService.getMetadata(cid);
      if (metadata) {
        return metadata;
      }
      // If it's an image key, return image data
      const image = LocalStorageService.getImage(cid);
      if (image) {
        return {
          name: 'Stored Image',
          description: 'Image stored locally',
          image: image,
          perks: [],
        };
      }
    }

    // Return default data
    return {
      name: 'Pass Metadata',
      description: 'Metadata stored locally',
      image: this.getGatewayURL(cid),
      perks: [],
    };
  }
}

export const ipfsService = new IPFSService();
