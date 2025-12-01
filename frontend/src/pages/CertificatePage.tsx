// Certificate Page - View and Download Certificates
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Search, Calendar, User, Building2, RefreshCw } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contract';
import { certificateService, CertificateData } from '../services/certificate';
import { CertificateCacheService } from '../services/certificateCache';
import toast from 'react-hot-toast';

interface Certificate {
  id: bigint;
  passId: bigint;
  issuer: string;
  recipientName: string;
  organizationName: string;
  courseName: string;
  issueDate: string;
  certificateType: string;
  metadataCid: string;
}

export const CertificatePage: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadCertificates();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadCertificates = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      
      // First, load from cache (immediate)
      const cachedCerts = CertificateCacheService.getUserCertificates(address);
      if (cachedCerts.length > 0) {
        console.log(`Loaded ${cachedCerts.length} certificates from cache`);
        setCertificates(cachedCerts as any);
      }

      // Then try to load from contract
      const certs: Certificate[] = [];
      
      // Try to fetch certificates by checking IDs (1-200 for more coverage)
      for (let i = 1; i <= 200; i++) {
        try {
          const cert = await contractService.getCertificate(BigInt(i));
          if (cert) {
            // Filter certificates for this user
            if (cert.issuer.toLowerCase() === address.toLowerCase() || 
                cert.recipientName.toLowerCase().includes(address.toLowerCase())) {
              certs.push(cert);
              // Cache it
              CertificateCacheService.cacheCertificate({
                ...cert,
                createdAt: Date.now(),
              } as any, address);
            }
          }
        } catch (error) {
          // Certificate doesn't exist, continue
          continue;
        }
      }
      
      // Merge cached and contract certificates
      const allCerts = [...cachedCerts, ...certs];
      const uniqueCerts = allCerts.filter((cert, index, self) =>
        index === self.findIndex((c) => Number(c.id) === Number(cert.id))
      );
      
      console.log(`Loaded ${uniqueCerts.length} total certificates`);
      setCertificates(uniqueCerts as any);
    } catch (error) {
      console.error('Error loading certificates:', error);
      // Keep cached certificates on error
      const cachedCerts = CertificateCacheService.getUserCertificates(address);
      if (cachedCerts.length > 0) {
        setCertificates(cachedCerts as any);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCertificates();
    setRefreshing(false);
    toast.success('Certificates refreshed!');
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      const certData: CertificateData = {
        recipientName: cert.recipientName,
        organizationName: cert.organizationName,
        courseName: cert.courseName,
        issueDate: cert.issueDate,
        certificateType: cert.certificateType,
        certificateId: cert.id.toString(),
      };
      certificateService.downloadPDF(certData);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const filteredCerts = certificates.filter(
    (cert) =>
      cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-8 rounded-xl">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">Please connect your wallet to view certificates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-4 text-gradient">My Certificates</h1>
            <p className="text-gray-300">View and download your earned certificates</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </motion.div>

        {/* Search */}
        <div className="glass p-4 rounded-xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            />
          </div>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading certificates from blockchain...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl p-8">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">No certificates found</p>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Complete courses to earn certificates'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert, index) => (
              <motion.div
                key={Number(cert.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl overflow-hidden card-3d hover:scale-105 transition-transform border border-white/10"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-xs font-medium">
                      {cert.certificateType}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{cert.courseName}</h3>
                  <div className="space-y-2 text-sm text-gray-300 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{cert.recipientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{cert.organizationName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-primary-500/50"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
