// Access Check Widget - Embeddable component
import React, { useState, useEffect } from 'react';
import { Check, X, Lock } from 'lucide-react';
import { contractService } from '../services/contract';
import { useWallet } from '../contexts/WalletContext';

interface AccessCheckWidgetProps {
  passId: bigint;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessCheckWidget: React.FC<AccessCheckWidgetProps> = ({
  passId,
  children,
  fallback,
}) => {
  const { address, isConnected } = useWallet();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [address, passId, isConnected]);

  const checkAccess = async () => {
    if (!isConnected || !address) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      const access = await contractService.hasAccess(address, passId);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="glass p-6 rounded-lg text-center">
        <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">Please connect your wallet to access this content</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="glass p-6 rounded-lg text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">You don't have access to this content</p>
          <p className="text-sm text-gray-500">Purchase a pass to unlock this feature</p>
        </div>
      )
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-green-400">
        <Check className="w-5 h-5" />
        <span className="text-sm font-medium">Access Granted</span>
      </div>
      {children}
    </div>
  );
};


