// Certificate Cache Service - Local storage cache for certificates

export interface CachedCertificate {
  id: bigint;
  passId: bigint;
  issuer: string;
  recipientName: string;
  organizationName: string;
  courseName: string;
  issueDate: string;
  certificateType: string;
  metadataCid: string;
  createdAt: number;
}

export class CertificateCacheService {
  private static readonly CERT_KEY = 'autopass_cert_';
  private static readonly USER_CERTS_KEY = 'autopass_user_certs_';
  private static readonly CREATOR_CERTS_KEY = 'autopass_creator_certs_';

  // Cache a certificate
  static cacheCertificate(cert: CachedCertificate, recipientAddress?: string): void {
    try {
      // Store individual certificate
      const certKey = `${this.CERT_KEY}${cert.id}`;
      localStorage.setItem(certKey, JSON.stringify({
        ...cert,
        id: cert.id.toString(),
        passId: cert.passId.toString(),
      }));

      // Store in issuer's list
      const creatorKey = `${this.CREATOR_CERTS_KEY}${cert.issuer}`;
      const creatorCerts = this.getCreatorCertificates(cert.issuer);
      if (!creatorCerts.find(c => Number(c.id) === Number(cert.id))) {
        creatorCerts.push(cert);
        localStorage.setItem(creatorKey, JSON.stringify(creatorCerts.map(c => ({
          ...c,
          id: c.id.toString(),
          passId: c.passId.toString(),
        }))));
      }

      // Store in recipient's list if address provided
      if (recipientAddress) {
        const userKey = `${this.USER_CERTS_KEY}${recipientAddress}`;
        const userCerts = this.getUserCertificates(recipientAddress);
        if (!userCerts.find(c => Number(c.id) === Number(cert.id))) {
          userCerts.push(cert);
          localStorage.setItem(userKey, JSON.stringify(userCerts.map(c => ({
            ...c,
            id: c.id.toString(),
            passId: c.passId.toString(),
          }))));
        }
      }
    } catch (error) {
      console.error('Error caching certificate:', error);
    }
  }

  // Get certificates for a user (recipient)
  static getUserCertificates(userAddress: string): CachedCertificate[] {
    try {
      const userKey = `${this.USER_CERTS_KEY}${userAddress}`;
      const data = localStorage.getItem(userKey);
      if (!data) return [];

      const certs = JSON.parse(data);
      return certs.map((c: any) => ({
        ...c,
        id: BigInt(c.id),
        passId: BigInt(c.passId),
        createdAt: c.createdAt || Date.now(),
      }));
    } catch (error) {
      console.error('Error getting user certificates:', error);
      return [];
    }
  }

  // Get certificates issued by a creator
  static getCreatorCertificates(creatorAddress: string): CachedCertificate[] {
    try {
      const creatorKey = `${this.CREATOR_CERTS_KEY}${creatorAddress}`;
      const data = localStorage.getItem(creatorKey);
      if (!data) return [];

      const certs = JSON.parse(data);
      return certs.map((c: any) => ({
        ...c,
        id: BigInt(c.id),
        passId: BigInt(c.passId),
        createdAt: c.createdAt || Date.now(),
      }));
    } catch (error) {
      console.error('Error getting creator certificates:', error);
      return [];
    }
  }

  // Get all certificates (for discovery)
  static getAllCertificates(): CachedCertificate[] {
    try {
      const keys = Object.keys(localStorage);
      const certKeys = keys.filter(k => k.startsWith(this.CERT_KEY));
      const certs: CachedCertificate[] = [];

      certKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const cert = JSON.parse(data);
            certs.push({
              ...cert,
              id: BigInt(cert.id),
              passId: BigInt(cert.passId),
            });
          }
        } catch (e) {
          console.error('Error parsing certificate:', e);
        }
      });

      return certs;
    } catch (error) {
      console.error('Error getting all certificates:', error);
      return [];
    }
  }

  // Get a single certificate
  static getCertificate(certId: bigint): CachedCertificate | null {
    try {
      const certKey = `${this.CERT_KEY}${certId}`;
      const data = localStorage.getItem(certKey);
      if (!data) return null;

      const cert = JSON.parse(data);
      return {
        ...cert,
        id: BigInt(cert.id),
        passId: BigInt(cert.passId),
      };
    } catch (error) {
      console.error('Error getting certificate:', error);
      return null;
    }
  }
}

