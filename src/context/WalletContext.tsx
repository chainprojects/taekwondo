import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAddress, useChainId, useConnectionStatus, useDisconnect } from "@thirdweb-dev/react";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  networkError: string | null;
}

interface WalletContextType {
  walletState: WalletState;
  checkAndSwitchNetwork: () => Promise<boolean>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const address = useAddress();
  const chainId = useChainId();
  const connectionStatus = useConnectionStatus();
  const disconnect = useDisconnect();
  
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    networkError: null
  });

  useEffect(() => {
    setWalletState({
      address: address || null,
      isConnected: connectionStatus === "connected",
      isConnecting: connectionStatus === "connecting",
      chainId: chainId || null,
      networkError: null
    });
  }, [address, chainId, connectionStatus]);

  const checkAndSwitchNetwork = async (): Promise<boolean> => {
    if (chainId === 56) return true;
    
    try {
      const provider = window.ethereum;
      if (!provider) {
        throw new Error('No provider found');
      }

      try {
        // First try to switch to the BSC network
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BSC chainId in hex
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]
            });
            return true;
          } catch (addError) {
            console.error('Failed to add BSC network:', addError);
            return false;
          }
        }
        // Other errors
        console.error('Failed to switch network:', switchError);
        return false;
      }
    } catch (error) {
      console.error('Failed to setup network:', error);
      return false;
    }
  };

  return (
    <WalletContext.Provider value={{ 
      walletState,
      checkAndSwitchNetwork,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}