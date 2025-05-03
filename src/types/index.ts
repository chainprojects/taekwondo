export interface ClickData {
  earnedTokens: number;
  totalEarned: number;
  totalClicks: number;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  networkError: string | null;
}

export interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  id: number;
}