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
      // Return cached passes if still fresh
      if (
        this.cachedPasses.size > 0 &&
        Date.now() - this.lastFetch < this.CACHE_DURATION
      ) {
        return Array.from(this.cachedPasses.values()).filter((p) => p.active);
      }

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
      let consecutiveFailures = 0;
      for (let i = 1; i <= 100; i++) {
        try {
          const pass = await contractService.getPass(BigInt(i));
          if (pass && pass.active) {
            this.cachedPasses.set(i, pass);
            passes.push(pass);
            consecutiveFailures = 0; // reset on success
          } else {
            consecutiveFailures++;
          }
        } catch (error) {
          // Pass doesn't exist or other read error – keep going,
          // but stop after too many consecutive failures to avoid spamming the node
          consecutiveFailures++;
        }

        if (consecutiveFailures >= 10) {
          break;
        }
      }

      // Also merge in any locally cached passes from PassCacheService
      try {
        const allKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith('autopass_pass_')
        );

        const localPasses: PassData[] = [];
        for (const key of allKeys) {
          const data = localStorage.getItem(key);
          if (!data) continue;
          try {
            const parsed = JSON.parse(data) as any;
            const localPass: PassData = {
              id: BigInt(parsed.id),
              creator: parsed.creator || '',
              name: parsed.name || 'Untitled Pass',
              description: parsed.description || '',
              category: parsed.category || 'membership',
              passType: parsed.passType || 'subscription',
              price: BigInt(parsed.price || 0),
              durationSeconds: BigInt(parsed.durationSeconds || 0),
              sold: parsed.sold ?? 0,
              metadataCid: parsed.metadataCid || '',
              active: parsed.active ?? true,
            };
            this.cachedPasses.set(Number(localPass.id), localPass);
            localPasses.push(localPass);
          } catch (e) {
            console.warn('Error parsing local pass cache entry', key, e);
          }
        }

        if (localPasses.length > 0) {
          console.log(`Loaded ${localPasses.length} passes from local cache for discovery`);
          passes.push(
            ...localPasses.filter(
              (lp) => !passes.find((p) => Number(p.id) === Number(lp.id))
            )
          );
        }
      } catch (e) {
        console.warn('Error merging local cached passes into discovery list', e);
      }

      this.lastFetch = Date.now();

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

