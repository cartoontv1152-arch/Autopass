// Creator Dashboard
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Plus,
  Ticket,
  Users,
  DollarSign,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contract';
import { ipfsService } from '../services/ipfs';
import { PassCacheService, CachedPass } from '../services/passCache';
import { CertificateCacheService } from '../services/certificateCache';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'create' | 'passes' | 'subscribers' | 'earnings' | 'certificates';

export const CreatorDashboard: React.FC = () => {
  const { address, isConnected, isDemoMode } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [passes, setPasses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<bigint>(0n);

  // Create Pass Form
  const [passForm, setPassForm] = useState({
    name: '',
    description: '',
    category: 'gym',
    passType: 'subscription',
    price: '',
    durationDays: '30',
    autoRenewAllowed: true,
    maxSupply: '',
    image: null as File | null,
  });

  // Certificate Form
  const [certForm, setCertForm] = useState({
    recipientName: '',
    organizationName: '',
    courseName: '',
    issueDate: new Date().toISOString().split('T')[0],
    certificateType: 'completion',
    passId: '',
  });

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    }
  }, [isConnected, address]);

  const loadData = async () => {
    if (!address) return;

    try {
      // Load profile
      try {
        const prof = await contractService.getCreatorProfile(address);
        setProfile(prof);
      } catch (error) {
        console.log('No profile set yet');
      }

      // First, try to load from cache (immediate)
      const cachedPasses = PassCacheService.getCreatorPasses(address);
      if (cachedPasses.length > 0) {
        console.log(`Loaded ${cachedPasses.length} passes from cache`);
        setPasses(cachedPasses as any);
      }

      // Then try to load from contract (async)
      try {
        const passIds = await contractService.getCreatorPasses(address);
        console.log('Loaded pass IDs from contract:', passIds);
        
        if (passIds.length > 0) {
          const passPromises = passIds.map(async (id) => {
            try {
              const pass = await contractService.getPass(id);
              if (pass) {
                // Cache the pass
                PassCacheService.cachePass(address, {
                  ...pass,
                  createdAt: Date.now(),
                } as CachedPass);
              }
              return pass;
            } catch (error) {
              console.error(`Error loading pass ${id}:`, error);
              // Try cache as fallback
              return PassCacheService.getPass(id);
            }
          });
          const passData = await Promise.all(passPromises);
          const validPasses = passData.filter((p) => p !== null);
          console.log('Valid passes loaded from contract:', validPasses.length);
          
          // Merge with cached passes (avoid duplicates)
          const allPasses = [...cachedPasses, ...validPasses];
          const uniquePasses = allPasses.filter((pass, index, self) =>
            index === self.findIndex((p) => Number(p.id) === Number(pass.id))
          );
          setPasses(uniquePasses as any);
        } else {
          console.log('No passes found in contract, using cache only');
          // Keep cached passes if contract returns empty
          if (cachedPasses.length === 0) {
            setPasses([]);
          }
        }
      } catch (error) {
        console.error('Error loading passes from contract:', error);
        // Keep cached passes on error
        if (cachedPasses.length === 0) {
          setPasses([]);
        }
      }

      // Load earnings
      try {
        const earn = await contractService.getEarnings();
        setEarnings(earn);
      } catch (error) {
        console.log('Error loading earnings:', error);
        setEarnings(0n);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data. Please try again.');
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Creating pass...', { id: 'create-pass' });
      
      // Upload image to IPFS (with fallback)
      let imageCid = '';
      if (passForm.image) {
        try {
          imageCid = await ipfsService.uploadFile(passForm.image);
        } catch (error) {
          console.warn('Image upload failed, continuing without image');
        }
      }

      // Create metadata (with fallback)
      const metadata = {
        name: passForm.name,
        description: passForm.description,
        image: imageCid,
        perks: [],
      };

      const metadataCid = await ipfsService.uploadJSON(metadata);

      // Create pass
      const price = BigInt(parseFloat(passForm.price) * 1e9);
      const durationSeconds = BigInt(parseInt(passForm.durationDays) * 86400);
      const maxSupply = passForm.maxSupply ? parseInt(passForm.maxSupply) : 0;

      // Create pass object for caching
      const newPass: CachedPass = {
        id: BigInt(0), // Will be updated after creation
        creator: address || '',
        name: passForm.name,
        description: passForm.description,
        category: passForm.category,
        passType: passForm.passType,
        price,
        tokenAddress: 'MAS',
        durationSeconds,
        autoRenewAllowed: passForm.autoRenewAllowed,
        maxSupply,
        sold: 0,
        metadataCid,
        active: true,
        createdAt: Date.now(),
      };

      if (isDemoMode) {
        // Pure local creation for demo
        newPass.id = BigInt(Date.now()); // Unique local ID
        PassCacheService.cachePass(address || '', newPass);
        setPasses([...passes, newPass as any]);
        toast.success('Pass created locally for demo!', { id: 'create-pass' });
      } else {
        try {
          // Try to create pass on-chain
          const txId = await contractService.createPass({
            name: passForm.name,
            description: passForm.description,
            category: passForm.category,
            passType: passForm.passType,
            price,
            tokenAddress: 'MAS',
            durationSeconds,
            autoRenewAllowed: passForm.autoRenewAllowed,
            maxSupply,
            metadataCid,
          });

          console.log('Pass creation transaction ID:', txId);
          toast.success('Transaction submitted!', { id: 'create-pass' });
          
          // Estimate ID for now
          let estimatedPassId = BigInt(1);
          try {
            const existingPasses = PassCacheService.getCreatorPasses(address || '');
            estimatedPassId = BigInt(existingPasses.length + 1);
          } catch (e) {
            console.log('Could not estimate pass ID');
          }

          newPass.id = estimatedPassId;
          
          PassCacheService.cachePass(address || '', newPass);
          setPasses([...passes, newPass as any]);
          
          toast.success('Pass created! It may take a moment to appear on-chain.', { id: 'create-pass' });
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          await loadData();
        } catch (error: any) {
          console.error('Error creating pass on-chain:', error);
          newPass.id = BigInt(Date.now());
          PassCacheService.cachePass(address || '', newPass);
          setPasses([...passes, newPass as any]);
          toast.error('Pass created locally. On-chain creation may have failed.', { id: 'create-pass' });
        }
      }
      
      setPassForm({
        name: '',
        description: '',
        category: 'gym',
        passType: 'subscription',
        price: '',
        durationDays: '30',
        autoRenewAllowed: true,
        maxSupply: '',
        image: null,
      });
      
      setActiveTab('passes');
    } catch (error: any) {
      console.error('Error creating pass:', error);
      toast.error(error.message || 'Failed to create pass', { id: 'create-pass' });
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const metadata = {
        recipientName: certForm.recipientName,
        organizationName: certForm.organizationName,
        courseName: certForm.courseName,
        issueDate: certForm.issueDate,
        certificateType: certForm.certificateType,
      };

      const metadataCid = await ipfsService.uploadJSON(metadata);

      const newCert = {
        id: BigInt(Date.now()),
        passId: BigInt(certForm.passId),
        issuer: address || '',
        recipientName: certForm.recipientName,
        organizationName: certForm.organizationName,
        courseName: certForm.courseName,
        issueDate: certForm.issueDate,
        certificateType: certForm.certificateType,
        metadataCid,
        createdAt: Date.now(),
      };

      if (isDemoMode) {
        // Purely local certificate issue
        CertificateCacheService.cacheCertificate(newCert as any, address || undefined);
        toast.success('Certificate issued locally for demo!');
      } else {
        try {
          await contractService.issueCertificate({
            recipientName: certForm.recipientName,
            organizationName: certForm.organizationName,
            courseName: certForm.courseName,
            issueDate: certForm.issueDate,
            certificateType: certForm.certificateType,
            metadataCid,
            passId: BigInt(certForm.passId),
          });
          CertificateCacheService.cacheCertificate(newCert as any, address || undefined);
          toast.success('Certificate issued successfully!');
        } catch (error: any) {
          console.error('Error issuing certificate:', error);
          CertificateCacheService.cacheCertificate(newCert as any, address || undefined);
          toast.error('Certificate stored locally. On-chain issue may have failed.');
        }
      }
      setCertForm({
        recipientName: '',
        organizationName: '',
        courseName: '',
        issueDate: new Date().toISOString().split('T')[0],
        certificateType: 'completion',
        passId: '',
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate');
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'create' as Tab, label: 'Create Pass', icon: Plus },
    { id: 'passes' as Tab, label: 'My Passes', icon: Ticket },
    { id: 'subscribers' as Tab, label: 'Subscribers', icon: Users },
    { id: 'earnings' as Tab, label: 'Earnings', icon: DollarSign },
    { id: 'certificates' as Tab, label: 'Certificates', icon: Award },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Please connect your wallet to access the creator dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Creator Dashboard</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64">
            <div className="glass rounded-xl p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Creator Profile</h2>
                {profile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400">Name</label>
                      <p className="text-lg">{profile.name}</p>
                    </div>
                    <div>
                      <label className="text-gray-400">Description</label>
                      <p className="text-lg">{profile.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No profile set yet</p>
                )}
              </motion.div>
            )}

            {activeTab === 'create' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Create New Pass</h2>
                <form onSubmit={handleCreatePass} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pass Name</label>
                    <input
                      type="text"
                      value={passForm.name}
                      onChange={(e) => setPassForm({ ...passForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={passForm.description}
                      onChange={(e) => setPassForm({ ...passForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={passForm.category}
                        onChange={(e) => setPassForm({ ...passForm, category: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="gym">Gym</option>
                        <option value="event">Event</option>
                        <option value="course">Course</option>
                        <option value="membership">Membership</option>
                        <option value="community">Community</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={passForm.passType}
                        onChange={(e) => setPassForm({ ...passForm, passType: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="subscription">Subscription</option>
                        <option value="one-time">One-Time</option>
                        <option value="timed">Time-Limited</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price (MAS)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={passForm.price}
                        onChange={(e) => setPassForm({ ...passForm, price: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration (Days)</label>
                      <input
                        type="number"
                        value={passForm.durationDays}
                        onChange={(e) => setPassForm({ ...passForm, durationDays: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={passForm.autoRenewAllowed}
                      onChange={(e) => setPassForm({ ...passForm, autoRenewAllowed: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label>Allow auto-renewal</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Supply (0 = unlimited)</label>
                    <input
                      type="number"
                      value={passForm.maxSupply}
                      onChange={(e) => setPassForm({ ...passForm, maxSupply: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPassForm({ ...passForm, image: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
                  >
                    Create Pass
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'passes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">My Passes</h2>
                  <button
                    onClick={loadData}
                    className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                {passes.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-400 mb-2">No passes created yet</p>
                    <p className="text-gray-500 mb-4">Create your first pass to get started!</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
                    >
                      Create Pass
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {passes.map((pass) => (
                      <div key={Number(pass.id)} className="glass p-6 rounded-lg border border-white/10 hover:border-primary-500/50 transition-all card-3d">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{pass.name}</h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pass.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {pass.sold} sold
                              </span>
                              <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-xs">
                                {pass.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gradient">
                              {(Number(pass.price) / 1e9).toFixed(2)} MAS
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await contractService.togglePassActive(pass.id);
                                  toast.success(`Pass ${pass.active ? 'paused' : 'activated'}!`);
                                  await loadData();
                                } catch (error) {
                                  toast.error('Failed to toggle pass status');
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pass.active
                                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                  : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                              }`}
                            >
                              {pass.active ? '✓ Active' : '⏸ Paused'}
                            </button>
                            <Link
                              to={`/pass/${Number(pass.id)}`}
                              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Earnings</h2>
                <div className="text-4xl font-bold text-gradient mb-4">
                  {(Number(earnings) / 1e9).toFixed(4)} MAS
                </div>
                <button
                  onClick={async () => {
                    await contractService.withdrawEarnings();
                    toast.success('Earnings withdrawn');
                    loadData();
                  }}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
                >
                  Withdraw Earnings
                </button>
              </motion.div>
            )}

            {activeTab === 'certificates' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-8"
              >
                <h2 className="text-2xl font-semibold mb-6">Issue Certificate</h2>
                <form onSubmit={handleIssueCertificate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipient Name</label>
                    <input
                      type="text"
                      value={certForm.recipientName}
                      onChange={(e) => setCertForm({ ...certForm, recipientName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Name</label>
                    <input
                      type="text"
                      value={certForm.organizationName}
                      onChange={(e) => setCertForm({ ...certForm, organizationName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Course Name</label>
                    <input
                      type="text"
                      value={certForm.courseName}
                      onChange={(e) => setCertForm({ ...certForm, courseName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Issue Date</label>
                      <input
                        type="date"
                        value={certForm.issueDate}
                        onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Certificate Type</label>
                      <select
                        value={certForm.certificateType}
                        onChange={(e) => setCertForm({ ...certForm, certificateType: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="completion">Completion</option>
                        <option value="achievement">Achievement</option>
                        <option value="participation">Participation</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pass ID</label>
                    <input
                      type="number"
                      value={certForm.passId}
                      onChange={(e) => setCertForm({ ...certForm, passId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
                  >
                    Issue Certificate
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


