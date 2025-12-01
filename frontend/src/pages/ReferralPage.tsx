// Referral System Page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Gift, Share2, Copy, Check, TrendingUp } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

export const ReferralPage: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      // Generate referral code from address
      setReferralCode(address.slice(0, 8).toUpperCase());
    }
  }, [address, isConnected]);

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Autopass',
          text: 'Check out this amazing platform for memberships and passes!',
          url: referralLink,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Please connect your wallet to access referrals</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 text-gradient">Referral Program</h1>
          <p className="text-gray-300">Invite friends and earn rewards!</p>
        </motion.div>

        <div className="glass rounded-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Gift className="w-12 h-12 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-semibold">Your Referral Code</h2>
              <p className="text-gray-400">Share this code and earn rewards</p>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-2xl font-mono font-bold">{referralCode}</code>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-400">Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none"
              />
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-xl text-center">
            <Users className="w-8 h-8 text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">0</div>
            <p className="text-sm text-gray-400">Total Referrals</p>
          </div>
          <div className="glass p-6 rounded-xl text-center">
            <Gift className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">0 MAS</div>
            <p className="text-sm text-gray-400">Earned Rewards</p>
          </div>
          <div className="glass p-6 rounded-xl text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">10%</div>
            <p className="text-sm text-gray-400">Commission Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

