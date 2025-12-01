// Pass Detail Page - Fixed with cache fallback
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, CreditCard, ArrowLeft } from 'lucide-react';
import { contractService } from '../services/contract';
import { ipfsService } from '../services/ipfs';
import { PassCacheService } from '../services/passCache';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface Pass {
  id: bigint;
  creator: string;
  name: string;
  description: string;
  category: string;
  passType: string;
  price: bigint;
  durationSeconds: bigint;
  autoRenewAllowed: boolean;
  maxSupply: number;
  sold: number;
  metadataCid: string;
  active: boolean;
}

export const PassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [pass, setPass] = useState<Pass | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    if (id) {
      loadPass();
    }
  }, [id, address]);

  const loadPass = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const passId = BigInt(id);
      
      // Try to load from contract first
      let passData: Pass | null = null;
      try {
        passData = await contractService.getPass(passId);
        console.log('Loaded pass from contract:', passData);
      } catch (error) {
        console.log('Contract load failed, trying cache...');
        // Fallback to cache
        const cachedPass = PassCacheService.getPass(passId);
        if (cachedPass) {
          passData = cachedPass as any;
          console.log('Loaded pass from cache:', passData);
        }
      }
      
      if (passData) {
        setPass(passData);
        
        // Load metadata
        try {
          const meta = await ipfsService.fetchFromIPFS(passData.metadataCid);
          setMetadata(meta);
        } catch (error) {
          console.error('Error loading metadata:', error);
        }

        // Check access
        if (address) {
          try {
            const access = await contractService.hasAccess(address, passId);
            setHasAccess(access);
          } catch (error) {
            console.error('Error checking access:', error);
          }
        }
      } else {
        console.error('Pass not found in contract or cache');
        toast.error('Pass not found');
      }
    } catch (error) {
      console.error('Error loading pass:', error);
      toast.error('Failed to load pass details');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!pass) return;

    try {
      setBuying(true);
      const passId = BigInt(id || '0');
      await contractService.buyPass(passId, autoRenew, pass.price);
      toast.success('Pass purchased successfully!');
      setTimeout(() => {
        loadPass();
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error buying pass:', error);
      toast.error(error.message || 'Failed to purchase pass');
    } finally {
      setBuying(false);
    }
  };

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`;
    if (days >= 7) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''}`;
    return `${Math.floor(days)} day${Math.floor(days) > 1 ? 's' : ''}`;
  };

  const formatPrice = (price: bigint) => {
    return `${Number(price) / 1e9} MAS`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pass details...</p>
        </div>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center glass p-8 rounded-xl">
          <X className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">Pass not found</p>
          <Link
            to="/discover"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
          >
            Browse Passes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Discover
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div className="p-8 bg-gradient-to-r from-primary-900/50 to-purple-900/50 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm mb-3 inline-block font-medium">
                  {pass.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">{pass.name}</h1>
                <p className="text-gray-300 text-lg leading-relaxed">{pass.description}</p>
              </div>
              {hasAccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Active Access</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 p-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {metadata?.image && (
                <img
                  src={ipfsService.getGatewayURL(metadata.image)}
                  alt={pass.name}
                  className="w-full h-80 object-cover rounded-xl"
                />
              )}

              <div>
                <h2 className="text-2xl font-bold mb-4">About This Pass</h2>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {metadata?.fullDescription || pass.description}
                </p>
              </div>

              {metadata?.perks && metadata.perks.length > 0 && (
                <div className="glass p-6 rounded-xl">
                  <h2 className="text-2xl font-bold mb-4">Perks & Benefits</h2>
                  <ul className="space-y-3">
                    {metadata.perks.map((perk: string, index: number) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="glass p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Pass Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Type</span>
                    <p className="font-semibold capitalize">{pass.passType}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Duration</span>
                    <p className="font-semibold">{formatDuration(pass.durationSeconds)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Total Sold</span>
                    <p className="font-semibold">{pass.sold}</p>
                  </div>
                  {pass.maxSupply > 0 && (
                    <div>
                      <span className="text-gray-400 text-sm">Max Supply</span>
                      <p className="font-semibold">{pass.maxSupply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="glass p-6 rounded-xl sticky top-24 border border-white/10">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gradient mb-2">
                    {formatPrice(pass.price)}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {pass.passType === 'subscription' ? 'per period' : 'one-time payment'}
                  </p>
                </div>

                {hasAccess ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg text-center">
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-semibold">You have access!</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="w-full block text-center px-4 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg transition-all font-semibold shadow-lg"
                    >
                      View in Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pass.passType === 'subscription' && pass.autoRenewAllowed && (
                      <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={autoRenew}
                          onChange={(e) => setAutoRenew(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary-600"
                        />
                        <span className="text-sm text-gray-300">Enable auto-renewal</span>
                      </label>
                    )}
                    <button
                      onClick={handleBuy}
                      disabled={buying || !pass.active}
                      className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                    >
                      {buying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : !pass.active ? (
                        'Pass Inactive'
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {pass.passType === 'subscription' ? 'Subscribe Now' : 'Buy Pass'}
                        </>
                      )}
                    </button>
                    {!isConnected && (
                      <p className="text-sm text-gray-400 text-center">
                        Connect wallet to purchase
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
