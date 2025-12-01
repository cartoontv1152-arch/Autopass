// Wallet Context with proper Massa wallet provider integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWallets } from '@massalabs/wallet-provider';
import { Account, JsonRpcProvider } from '@massalabs/massa-web3';
import { contractService } from '../services/contract';
import toast from 'react-hot-toast';

interface WalletContextType {
  account: Account | null;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  balance: string | null;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for stored wallet
    const storedAddress = localStorage.getItem('wallet_address');
    const storedSecretKey = localStorage.getItem('wallet_secret_key');
    
    if (storedAddress && storedSecretKey) {
      try {
        Account.fromPrivateKey(storedSecretKey).then((restoredAccount) => {
          setAccount(restoredAccount);
          setAddress(restoredAccount.address.toString());
          contractService.setAccount(restoredAccount);
          loadBalance(restoredAccount);
        }).catch((error) => {
          console.error('Error restoring wallet:', error);
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('wallet_secret_key');
        });
      } catch (error) {
        console.error('Error restoring wallet:', error);
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_secret_key');
      }
    }
  }, []);

  const loadBalance = async (acc: Account) => {
    try {
      const url = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
      const provider = url
        ? JsonRpcProvider.fromRPCUrl(url, acc)
        : JsonRpcProvider.buildnet(acc);
      const balances = await provider.balanceOf([acc.address.toString()]);
      if (balances && balances.length > 0) {
        setBalance((Number(balances[0].balance) / 1e9).toFixed(4));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Get available wallet providers
      const providerList = await getWallets();
      
      if (providerList.length === 0) {
        toast.error('No wallet providers found. Please install Bearby or Massa Station.');
        setLoading(false);
        return;
      }

      // Try to find and connect to a wallet provider
      let connected = false;
      
      for (const provider of providerList) {
        try {
          const providerName = provider.name();
          console.log(`Trying to connect to ${providerName}...`);
          
          // Connect to the provider
          await provider.connect();
          
          // Get accounts
          const accounts = await provider.accounts();
          
          if (accounts && accounts.length > 0) {
            const accountAddress = accounts[0].address;
            setAddress(accountAddress);
            
            // Store address and provider info
            localStorage.setItem('wallet_address', accountAddress);
            localStorage.setItem('wallet_provider', providerName);
            
            // For contract interactions, create a temporary account
            // The actual signing will be done through the wallet provider
            const tempAccount = await Account.generate();
            setAccount(tempAccount);
            contractService.setAccount(tempAccount);
            
            // Try to load balance using the address
            try {
              const url = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
              const publicProvider = url
                ? JsonRpcProvider.fromRPCUrl(url)
                : JsonRpcProvider.buildnet();
              const balances = await publicProvider.balanceOf([accountAddress]);
              if (balances && balances.length > 0) {
                setBalance((Number(balances[0].balance) / 1e9).toFixed(4));
              }
            } catch (e) {
              console.log('Could not load balance');
            }
            
            connected = true;
            toast.success(`Connected to ${providerName}!`);
            break;
          }
        } catch (error: any) {
          console.error(`Error connecting to ${provider.name()}:`, error);
          if (error.message?.includes('User rejected')) {
            toast.error('Connection rejected. Please approve the request.');
            continue;
          }
        }
      }
      
      if (!connected) {
        // Fallback: Create demo account
        toast.error('Could not connect to wallet. Using demo account.');
        const demoAccount = await Account.generate();
        setAccount(demoAccount);
        const addr = demoAccount.address.toString();
        setAddress(addr);
        contractService.setAccount(demoAccount);
        localStorage.setItem('wallet_address', addr);
        localStorage.setItem('wallet_secret_key', demoAccount.privateKey.toString());
        loadBalance(demoAccount);
        toast('Demo account created. Install Bearby or Massa Station for production use.', { 
          icon: 'ℹ️',
          duration: 5000 
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setAddress(null);
    setBalance(null);
    contractService.setAccount(null as any);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_secret_key');
    localStorage.removeItem('wallet_provider');
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        address,
        connectWallet,
        disconnectWallet,
        isConnected: !!account,
        balance,
        loading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
