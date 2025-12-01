// Smart Contract Service - Updated with latest Massa Web3 API
import { 
  Account,
  SmartContract,
  JsonRpcProvider,
  Args,
  Mas,
  bytesToStr,
  U32,
} from '@massalabs/massa-web3';

// Deployed contract address on BUILDNET
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'AS1BDUyJj8K4wafPh4Gfz63uVKsoFjoKwLBZePiQKN1PrTcjHZYX';

export class AutopassContract {
  private provider: JsonRpcProvider | null = null;
  private account: Account | null = null;

  constructor() {
    // Provider will be set when account is connected
  }

  setAccount(account: Account) {
    this.account = account;
    // Provider with account for write operations
    const url = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
    this.provider = url
      ? JsonRpcProvider.fromRPCUrl(url, account)
      : JsonRpcProvider.buildnet(account);
  }

  async callContract(functionName: string, args: Args, coins: bigint = 0n): Promise<string> {
    if (!this.account || !this.provider) {
      throw new Error('Account not set. Please connect your wallet.');
    }

    const sc = new SmartContract(this.provider, CONTRACT_ADDRESS);
    const op = await sc.call(functionName, args, { coins: Mas.fromString(coins.toString()) });
    
    return op.id;
  }

  async readContract(functionName: string, args: Args): Promise<Uint8Array> {
    const url = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
    const publicProvider = url
      ? JsonRpcProvider.fromRPCUrl(url)
      : JsonRpcProvider.buildnet();
    const sc = new SmartContract(publicProvider, CONTRACT_ADDRESS);
    const result = await sc.read(functionName, args);
    return result.value;
  }

  // Helper to convert bytes to u64
  private bytesToU64(bytes: Uint8Array): bigint {
    const args = new Args(bytes);
    return args.nextU64();
  }

  // Creator Profile Methods
  async setCreatorProfile(profile: {
    name: string;
    description: string;
    logoCid: string;
    socialLinks: string;
  }): Promise<string> {
    const args = new Args();
    args.addString(profile.name);
    args.addString(profile.description);
    args.addString(profile.logoCid);
    args.addString(profile.socialLinks);

    return await this.callContract('setCreatorProfile', args);
  }

  async getCreatorProfile(creatorAddress: string): Promise<any> {
    const args = new Args();
    args.addString(creatorAddress);

    const result = await this.readContract('getCreatorProfile', args);
    if (!result || result.length === 0) return null;

    const profileArgs = new Args(result);
    return {
      name: profileArgs.nextString(),
      description: profileArgs.nextString(),
      logoCid: profileArgs.nextString(),
      socialLinks: profileArgs.nextString(),
    };
  }

  // Pass Methods
  async createPass(pass: {
    name: string;
    description: string;
    category: string;
    passType: string;
    price: bigint;
    tokenAddress: string;
    durationSeconds: bigint;
    autoRenewAllowed: boolean;
    maxSupply: number;
    metadataCid: string;
  }): Promise<string> {
    const args = new Args();
    args.addString(pass.name);
    args.addString(pass.description);
    args.addString(pass.category);
    args.addString(pass.passType);
    args.addU64(pass.price);
    args.addString(pass.tokenAddress);
    args.addU64(pass.durationSeconds);
    args.addBool(pass.autoRenewAllowed);
    args.addU32(U32.fromNumber(pass.maxSupply));
    args.addString(pass.metadataCid);

    console.log('Creating pass with args:', {
      name: pass.name,
      price: pass.price.toString(),
      category: pass.category,
    });

    try {
      const txId = await this.callContract('createPass', args);
      console.log('Pass creation transaction ID:', txId);
      return txId;
    } catch (error: any) {
      console.error('Error in createPass call:', error);
      throw error;
    }
  }

  async getPass(passId: bigint): Promise<any> {
    const args = new Args();
    args.addU64(passId);

    const result = await this.readContract('getPass', args);
    if (!result || result.length === 0) return null;

    const passArgs = new Args(result);
    return {
      id: passArgs.nextU64(),
      creator: passArgs.nextString(),
      name: passArgs.nextString(),
      description: passArgs.nextString(),
      category: passArgs.nextString(),
      passType: passArgs.nextString(),
      price: passArgs.nextU64(),
      tokenAddress: passArgs.nextString(),
      durationSeconds: passArgs.nextU64(),
      autoRenewAllowed: passArgs.nextBool(),
      maxSupply: passArgs.nextU32(),
      sold: passArgs.nextU32(),
      metadataCid: passArgs.nextString(),
      active: passArgs.nextBool(),
    };
  }

  // Subscription Methods
  async buyPass(passId: bigint, autoRenew: boolean, price: bigint): Promise<string> {
    const args = new Args();
    args.addU64(passId);
    args.addBool(autoRenew);

    return await this.callContract('buyPass', args, price);
  }

  async hasAccess(userAddress: string, passId: bigint): Promise<boolean> {
    const args = new Args();
    args.addString(userAddress);
    args.addU64(passId);

    const result = await this.readContract('hasAccess', args);
    const accessStr = bytesToStr(result);
    return accessStr === 'true';
  }

  async cancelAutoRenew(subId: bigint): Promise<string> {
    const args = new Args();
    args.addU64(subId);

    return await this.callContract('cancelAutoRenew', args);
  }

  async getUserSubscriptions(userAddress: string): Promise<bigint[]> {
    const args = new Args();
    args.addString(userAddress);

    const result = await this.readContract('getUserSubscriptions', args);
    if (!result || result.length === 0) return [];

    const subsArgs = new Args(result);
    // Read count first (stored as u64)
    const count = subsArgs.nextU64();
    const subs: bigint[] = [];
    for (let i = 0; i < Number(count); i++) {
      subs.push(subsArgs.nextU64());
    }
    return subs;
  }

  // Certificate Methods
  async issueCertificate(certificate: {
    recipientName: string;
    organizationName: string;
    courseName: string;
    issueDate: string;
    certificateType: string;
    metadataCid: string;
    passId: bigint;
  }): Promise<string> {
    const args = new Args();
    args.addString(certificate.recipientName);
    args.addString(certificate.organizationName);
    args.addString(certificate.courseName);
    args.addString(certificate.issueDate);
    args.addString(certificate.certificateType);
    args.addString(certificate.metadataCid);
    args.addU64(certificate.passId);

    return await this.callContract('issueCertificate', args);
  }

  async getCertificate(certId: bigint): Promise<any> {
    const args = new Args();
    args.addU64(certId);

    const result = await this.readContract('getCertificate', args);
    if (!result || result.length === 0) return null;

    const certArgs = new Args(result);
    return {
      id: certArgs.nextU64(),
      passId: certArgs.nextU64(),
      issuer: certArgs.nextString(),
      recipientName: certArgs.nextString(),
      organizationName: certArgs.nextString(),
      courseName: certArgs.nextString(),
      issueDate: certArgs.nextString(),
      certificateType: certArgs.nextString(),
      metadataCid: certArgs.nextString(),
    };
  }

  // Earnings Methods
  async getEarnings(): Promise<bigint> {
    const result = await this.readContract('getEarnings', new Args());
    return this.bytesToU64(result);
  }

  async withdrawEarnings(): Promise<string> {
    return await this.callContract('withdrawEarnings', new Args());
  }

  // Pass Management
  async togglePassActive(passId: bigint): Promise<string> {
    const args = new Args();
    args.addU64(passId);

    return await this.callContract('togglePassActive', args);
  }

  async getCreatorPasses(creatorAddress: string): Promise<bigint[]> {
    const args = new Args();
    args.addString(creatorAddress);

    try {
      const result = await this.readContract('getCreatorPasses', args);
      
      if (!result || result.length === 0) {
        console.log('getCreatorPasses: No result or empty result for address:', creatorAddress);
        return [];
      }

      console.log('getCreatorPasses: Raw result length:', result.length);
      
      try {
        const passesArgs = new Args(result);
        
        // Try to read as u32 first (contract stores count as u32)
        let count: number = 0;
        try {
          const u32Value = passesArgs.nextU32();
          count = Number(u32Value);
          console.log(`getCreatorPasses: Found ${count} passes (u32)`);
        } catch (e) {
          // Fallback: try u64
          try {
            count = Number(passesArgs.nextU64());
            console.log(`getCreatorPasses: Found ${count} passes (u64)`);
          } catch (e2) {
            console.error('Could not read count as u32 or u64');
            return [];
          }
        }
        
        const passes: bigint[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const passId = passesArgs.nextU64();
            passes.push(passId);
          } catch (e) {
            console.error(`Error reading pass ID ${i}:`, e);
            break;
          }
        }
        
        console.log(`getCreatorPasses: Successfully parsed ${passes.length} pass IDs:`, passes);
        return passes;
      } catch (error) {
        console.error('Error parsing creator passes:', error);
        console.log('Raw result bytes:', Array.from(result).slice(0, 50));
        return [];
      }
    } catch (error: any) {
      console.error('Error calling getCreatorPasses:', error);
      return [];
    }
  }
}

export const contractService = new AutopassContract();
