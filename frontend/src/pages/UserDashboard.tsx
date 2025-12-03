// User Dashboard - Fixed to show passes properly
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Ticket, Clock, CreditCard, Activity, Award, Download, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contract';
import { certificateService } from '../services/certificate';
import { CertificateCacheService } from '../services/certificateCache';
import { PassService } from '../services/passService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Tab = 'passes' | 'billing' | 'activity' | 'certificates';

interface Subscription {
  id: bigint;
  passId: bigint;
  status: string;
  expiryTime: number;
  pass?: any;
}

export const UserDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('passes');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      // In hackathon/demo mode there may be no on-chain subscriptions.
      // Instead, we'll treat all locally discoverable passes as "owned" for this address.
      try {
        const allPasses = await PassService.getAllPasses();
        console.log('Loaded all passes for dashboard:', allPasses.length);

        const subs: Subscription[] = allPasses.map((pass, index) => ({
          id: BigInt(index + 1),
          passId: pass.id,
          status: 'active',
          expiryTime: Date.now() + Number(pass.durationSeconds || 0n) * 1000,
          pass,
        }));

        setSubscriptions(subs);
      } catch (error) {
        console.error('Error loading subscriptions (demo mode):', error);
        setSubscriptions([]);
      }

      // Load certificates
      try {
        const cachedCerts = CertificateCacheService.getUserCertificates(address);
        setCertificates(cachedCerts);
      } catch (error) {
        console.error('Error loading certificates:', error);
        setCertificates([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleCancelAutoRenew = async (subId: bigint) => {
    try {
      await contractService.cancelAutoRenew(subId);
      toast.success('Auto-renewal cancelled');
      loadData();
    } catch (error) {
      console.error('Error cancelling auto-renew:', error);
      toast.error('Failed to cancel auto-renewal');
    }
  };

  const handleDownloadCertificate = async (cert: any) => {
    try {
      const certData = cert.id ? await contractService.getCertificate(cert.id) : cert;
      if (certData) {
        certificateService.downloadPDF({
          recipientName: certData.recipientName,
          organizationName: certData.organizationName,
          courseName: certData.courseName,
          issueDate: certData.issueDate,
          certificateType: certData.certificateType,
          certificateId: certData.id?.toString() || Date.now().toString(),
        });
        toast.success('Certificate downloaded');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const tabs = [
    { id: 'passes' as Tab, label: 'My Passes', icon: Ticket },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
    { id: 'activity' as Tab, label: 'Activity', icon: Activity },
    { id: 'certificates' as Tab, label: 'Certificates', icon: Award },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-8 rounded-xl">
          <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">Please connect your wallet to view your dashboard</p>
          <Link
            to="/discover"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold mt-4"
          >
            Browse Passes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gradient">My Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="glass rounded-xl p-4 space-y-2 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your dashboard...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'passes' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-8"
                  >
                    <h2 className="text-2xl font-bold mb-6">My Passes</h2>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-xl text-gray-400 mb-2">No active passes</p>
                        <p className="text-gray-500 mb-6">Start exploring and purchase your first pass!</p>
                        <Link
                          to="/discover"
                          className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg transition-all font-semibold shadow-lg"
                        >
                          Browse Passes
                          <ArrowRight className="w-5 h-5 inline ml-2" />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {subscriptions.map((sub) => (
                          <div key={Number(sub.id)} className="glass p-6 rounded-lg border border-white/10 hover:border-primary-500/50 transition-all card-3d">
                            {sub.pass ? (
                              <>
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{sub.pass.name}</h3>
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{sub.pass.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Expires: {format(new Date(sub.expiryTime), 'MMM dd, yyyy')}
                                      </div>
                                      <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-xs">
                                        {sub.pass.category}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gradient">
                                      {(Number(sub.pass.price) / 1e9).toFixed(2)} MAS
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      to={`/ticket/${Number(sub.passId)}`}
                                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      View Ticket
                                    </Link>
                                    {sub.status === 'active' && (
                                      <button
                                        onClick={() => handleCancelAutoRenew(sub.id)}
                                        className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg text-sm font-medium transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <h3 className="text-xl font-semibold mb-2">Pass #{Number(sub.passId)}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Expires: {format(new Date(sub.expiryTime), 'MMM dd, yyyy')}
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    sub.status === 'active'
                                      ? 'bg-green-600/20 text-green-400'
                                      : 'bg-gray-600/20 text-gray-400'
                                  }`}>
                                    {sub.status}
                                  </span>
                                </div>
                                <Link
                                  to={`/ticket/${Number(sub.passId)}`}
                                  className="w-full block text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                >
                                  View Ticket
                                </Link>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-8"
                  >
                    <h2 className="text-2xl font-bold mb-6">Billing & Payments</h2>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No payment history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map((sub) => (
                          <div key={Number(sub.id)} className="glass p-6 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">
                                  {sub.pass ? sub.pass.name : `Pass #${Number(sub.passId)}`}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Purchased on {format(new Date(sub.expiryTime - 86400000), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gradient">
                                  {sub.pass ? `${(Number(sub.pass.price) / 1e9).toFixed(2)} MAS` : 'N/A'}
                                </p>
                                <p className="text-xs text-gray-400">One-time payment</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-8"
                  >
                    <h2 className="text-2xl font-bold mb-6">Activity</h2>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map((sub) => (
                          <div key={Number(sub.id)} className="glass p-6 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">
                                  {sub.pass ? sub.pass.name : `Pass #${Number(sub.passId)}`} purchased
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {format(new Date(), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm font-medium">
                                Purchased
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'certificates' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">My Certificates</h2>
                      <Link
                        to="/certificates"
                        className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        View All
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                    {certificates.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-xl text-gray-400 mb-2">No certificates yet</p>
                        <p className="text-gray-500">Complete courses to earn certificates</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {certificates.map((cert) => (
                          <div key={Number(cert.id)} className="glass p-6 rounded-lg border border-white/10 hover:border-primary-500/50 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{cert.courseName}</h3>
                                <p className="text-gray-400 text-sm mb-3">
                                  Issued by {cert.organizationName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(cert.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDownloadCertificate(cert)}
                                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
