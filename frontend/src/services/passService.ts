// Pass Service - Helper to fetch and manage passes
import { contractService } from './contract';

export interface PassData {
  id: bigint;
  creator: string;
  name: string;
  description: string;
  category: string;
  passType: string;
  price: bigint;
  durationSeconds: bigint;
  sold: number;
  metadataCid: string;
  active: boolean;
}

export class PassService {
  private static cachedPasses: Map<number, PassData> = new Map();
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 60000; // 1 minute

  // Fetch passes from events (PassCreated events)
  static async getAllPasses(): Promise<PassData[]> {
    try {
      // Get events from contract (for future use when events are properly indexed)
      // const provider = JsonRpcProvider.buildnet();
      // const events = await provider.getEvents({
      //   smartContractAddress: CONTRACT_ADDRESS,
      // });

      // For now, we'll try to fetch passes by trying IDs sequentially
      // In production, you'd parse events properly to get pass IDs
      const passes: PassData[] = [];
      
      // Try to fetch passes from ID 1 to 100 (reasonable limit)
      // In production, track pass IDs from events
      for (let i = 1; i <= 100; i++) {
        try {
          const pass = await contractService.getPass(BigInt(i));
          if (pass && pass.active) {
            passes.push(pass);
          }
        } catch (error) {
          // Pass doesn't exist, continue
          break;
        }
      }

      return passes;
    } catch (error) {
      console.error('Error fetching passes:', error);
      return [];
    }
  }

  // Get a single pass by ID
  static async getPass(passId: bigint): Promise<PassData | null> {
    // Check cache first
    const cached = this.cachedPasses.get(Number(passId));
    if (cached && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const pass = await contractService.getPass(passId);
      if (pass) {
        this.cachedPasses.set(Number(passId), pass);
        this.lastFetch = Date.now();
        return pass;
      }
    } catch (error) {
      console.error('Error fetching pass:', error);
    }

    return null;
  }

  // Clear cache
  static clearCache() {
    this.cachedPasses.clear();
    this.lastFetch = 0;
  }
}

