import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, ArrowLeft, Ticket } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { PassService, PassData } from '../services/passService';
import { PassCacheService } from '../services/passCache';
import { ipfsService } from '../services/ipfs';
import toast from 'react-hot-toast';

interface TicketInfo {
  pass: PassData;
  purchaseTime: number;
  expiryTime: number;
  metadata?: any;
}

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, address]);

  const loadTicket = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const passId = BigInt(id);

      // Try to load pass via PassService first
      let pass = await PassService.getPass(passId);

      // Fallback to local pass cache if needed
      if (!pass) {
        const cached = PassCacheService.getPass(passId);
        if (cached) {
          pass = {
            id: cached.id,
            creator: cached.creator,
            name: cached.name,
            description: cached.description,
            category: cached.category,
            passType: cached.passType,
            price: cached.price,
            durationSeconds: cached.durationSeconds,
            sold: cached.sold,
            metadataCid: cached.metadataCid,
            active: cached.active,
          };
        }
      }

      if (!pass) {
        toast.error('Ticket not found');
        setTicket(null);
        return;
      }

      // Compute purchase/expiry times for demo (not persisted on-chain here)
      const now = Date.now();
      const expiryTime = now + Number(pass.durationSeconds || 0n) * 1000;

      let metadata: any = null;
      try {
        metadata = await ipfsService.fetchFromIPFS(pass.metadataCid);
      } catch (e) {
        console.warn('Failed to load ticket metadata', e);
      }

      setTicket({
        pass,
        purchaseTime: now,
        expiryTime,
        metadata,
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket details');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center glass p-8 rounded-xl">
          <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">Ticket not found</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pass, purchaseTime, expiryTime, metadata } = ticket;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Passes
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden border border-white/10"
        >
          <div className="p-8 bg-gradient-to-r from-primary-900/60 to-purple-900/60 border-b border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                {pass.name}
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                Your active ticket for this {pass.category} pass.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 p-8">
            {/* Left: ticket core info */}
            <div className="md:col-span-2 space-y-6">
              {metadata?.image && (
                <img
                  src={ipfsService.getGatewayURL(metadata.image)}
                  alt={pass.name}
                  className="w-full h-64 object-cover rounded-xl"
                />
              )}

              <div className="glass p-5 rounded-xl">
                <h2 className="text-xl font-semibold mb-3">Ticket Details</h2>
                <p className="text-gray-300 mb-3">
                  {metadata?.fullDescription || pass.description}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full">
                    {pass.passType}
                  </span>
                  <span className="px-3 py-1 bg-white/5 rounded-full">
                    Category: {pass.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: holder + timing */}
            <div className="space-y-5">
              <div className="glass p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-3">Ticket Holder</h3>
                <div className="flex items-center gap-3 text-gray-300">
                  <User className="w-5 h-5 text-primary-400" />
                  <span className="text-sm break-all">
                    {address || 'Connected wallet address'}
                  </span>
                </div>
              </div>

              <div className="glass p-5 rounded-xl space-y-3">
                <h3 className="text-lg font-semibold mb-3">Validity</h3>
                <div className="flex items-start gap-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-primary-400 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Purchased</p>
                    <p className="text-sm">{formatDateTime(purchaseTime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <Clock className="w-5 h-5 text-primary-400 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Expires</p>
                    <p className="text-sm">{formatDateTime(expiryTime)}</p>
                  </div>
                </div>
              </div>

              <div className="glass p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Price Paid</h3>
                <p className="text-2xl font-bold text-gradient mb-1">
                  {Number(pass.price) / 1e9} MAS
                </p>
                <p className="text-xs text-gray-400">
                  This is a demo ticket; on mainnet, payment and validity would be fully on-chain.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


