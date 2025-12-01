// Pass Cache Service - Local storage cache for passes
// This ensures passes are visible immediately even if contract read fails

export interface CachedPass {
  id: bigint;
  creator: string;
  name: string;
  description: string;
  category: string;
  passType: string;
  price: bigint;
  tokenAddress: string;
  durationSeconds: bigint;
  autoRenewAllowed: boolean;
  maxSupply: number;
  sold: number;
  metadataCid: string;
  active: boolean;
  createdAt: number;
}

export class PassCacheService {
  private static readonly CREATOR_PASSES_KEY = 'autopass_creator_passes_';

  // Store a pass in cache
  static cachePass(creatorAddress: string, pass: CachedPass): void {
    try {
      // Store in creator's pass list
      const creatorKey = `${this.CREATOR_PASSES_KEY}${creatorAddress}`;
      const creatorPasses = this.getCreatorPasses(creatorAddress);
      if (!creatorPasses.find(p => Number(p.id) === Number(pass.id))) {
        creatorPasses.push(pass);
        localStorage.setItem(creatorKey, JSON.stringify(creatorPasses.map(p => ({
          ...p,
          id: p.id.toString(),
          price: p.price.toString(),
          durationSeconds: p.durationSeconds.toString(),
        }))));
      }

      // Store individual pass
      const passKey = `autopass_pass_${pass.id}`;
      localStorage.setItem(passKey, JSON.stringify({
        ...pass,
        id: pass.id.toString(),
        price: pass.price.toString(),
        durationSeconds: pass.durationSeconds.toString(),
      }));
    } catch (error) {
      console.error('Error caching pass:', error);
    }
  }

  // Get creator's passes from cache
  static getCreatorPasses(creatorAddress: string): CachedPass[] {
    try {
      const creatorKey = `${this.CREATOR_PASSES_KEY}${creatorAddress}`;
      const data = localStorage.getItem(creatorKey);
      if (!data) return [];

      const passes = JSON.parse(data);
      return passes.map((p: any) => ({
        ...p,
        id: BigInt(p.id),
        price: BigInt(p.price),
        durationSeconds: BigInt(p.durationSeconds),
        createdAt: p.createdAt || Date.now(),
      }));
    } catch (error) {
      console.error('Error getting cached passes:', error);
      return [];
    }
  }

  // Get a single pass from cache
  static getPass(passId: bigint): CachedPass | null {
    try {
      const passKey = `autopass_pass_${passId}`;
      const data = localStorage.getItem(passKey);
      if (!data) return null;

      const pass = JSON.parse(data);
      return {
        ...pass,
        id: BigInt(pass.id),
        price: BigInt(pass.price),
        durationSeconds: BigInt(pass.durationSeconds),
      };
    } catch (error) {
      console.error('Error getting cached pass:', error);
      return null;
    }
  }

  // Clear cache for a creator
  static clearCreatorCache(creatorAddress: string): void {
    const creatorKey = `${this.CREATOR_PASSES_KEY}${creatorAddress}`;
    localStorage.removeItem(creatorKey);
  }

  // Clear all cache
  static clearAllCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('autopass_pass_') || key.startsWith(this.CREATOR_PASSES_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }
}

