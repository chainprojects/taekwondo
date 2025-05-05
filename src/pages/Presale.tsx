import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useWallet } from '../context/WalletContext';

// Contract address
const PRESALE_CONTRACT_ADDRESS = '0x6c79c9217FD288a36Abed036319949c3A5396093';

// Token rate
const TOKENS_PER_BNB = 6500000;

// Gas settings
const GAS_PRICE_MULTIPLIER = 1.1; // 10% increase
const GAS_LIMIT_MULTIPLIER = 1.2;  // 20% buffer

const PRESALE_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "buyWithBNB",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export function Presale() {
  const { notification, showNotification, hideNotification } = useNotification();
  const { walletState, checkAndSwitchNetwork } = useWallet();
  const [inputAmount, setInputAmount] = useState<string>('');
  const [tkdAmount, setTkdAmount] = useState<string>('0');
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [presaleContract, setPresaleContract] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (window.ethereum && walletState.isConnected) {
      const initWeb3 = async () => {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          const networkOk = await checkAndSwitchNetwork();
          if (networkOk) {
            const presaleContractInstance = new web3Instance.eth.Contract(
              PRESALE_CONTRACT_ABI,
              PRESALE_CONTRACT_ADDRESS
            );
            setPresaleContract(presaleContractInstance);
            await updateBalanceAndGas(web3Instance);
          }
        } catch (error) {
          console.error('Error initializing Web3:', error);
          setNetworkError(true);
        }
      };

      initWeb3();
      const interval = setInterval(() => {
        if (web3) {
          updateBalanceAndGas(web3).catch(console.error);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [walletState.isConnected, walletState.address, checkAndSwitchNetwork]);

  const updateBalanceAndGas = async (web3Instance: Web3) => {
    if (!walletState.address) return;

    try {
      const balance = await web3Instance.eth.getBalance(walletState.address);
      setUserBalance(web3Instance.utils.fromWei(balance, 'ether'));

      const currentGasPrice = await web3Instance.eth.getGasPrice();
      setGasPrice(web3Instance.utils.fromWei(currentGasPrice, 'gwei'));
      setNetworkError(false);
    } catch (error) {
      console.error('Error updating balance and gas:', error);
      setNetworkError(true);
    }
  };

  const calculateTkdAmount = (amount: string): string => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return '0';
    return (Number(amount) * TOKENS_PER_BNB).toLocaleString('fullwide', { useGrouping: false });
  };

  useEffect(() => {
    const newTkdAmount = calculateTkdAmount(inputAmount);
    setTkdAmount(newTkdAmount);
  }, [inputAmount]);

  const handleBuy = async () => {
    if (!walletState.isConnected) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    if (Number(inputAmount) > Number(userBalance)) {
      showNotification('error', 'Insufficient BNB balance');
      return;
    }

    setIsProcessing(true);
    setRetryCount(0);

    try {
      if (!web3 || !presaleContract || !walletState.address) {
        throw new Error('Web3 not initialized');
      }

      const networkOk = await checkAndSwitchNetwork();
      if (!networkOk) {
        throw new Error('network_error');
      }

      const value = web3.utils.toWei(inputAmount, 'ether');
      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * GAS_PRICE_MULTIPLIER).toString();

      const gasEstimate = await presaleContract.methods.buyWithBNB().estimateGas({
        from: walletState.address,
        value
      });

      const gasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER);

      const tx = await presaleContract.methods.buyWithBNB().send({
        from: walletState.address,
        value,
        gas: gasLimit,
        gasPrice: adjustedGasPrice
      });

      console.log('Transaction successful:', tx.transactionHash);
      showNotification('success', 'Purchase successful!');
      setInputAmount('');
      setTkdAmount('0');
      
      await updateBalanceAndGas(web3);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      let errorMessage = 'Purchase failed. ';
      
      if (error.code === 4001 || error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient BNB balance for purchase and gas fees.';
      } else if (error.message === 'network_error') {
        errorMessage = 'Network connection error. Please check your connection and try again.';
      } else if (error.message.includes('execution reverted')) {
        const revertReason = error.message.match(/execution reverted: (.*?)(?:\"|$)/);
        errorMessage = revertReason ? revertReason[1] : 'Transaction failed. Please try again with a smaller amount.';
      } else {
        errorMessage = 'An unexpected error occurred. Please try again later.';
      }
      
      showNotification('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
    className="min-h-screen flex flex-col bg-gray-900 text-white relative"
    style={{
      backgroundImage: "url('https://smallseomachine.com/taek/tae1%20(1).png')",
      backgroundSize: 'auto',
      backgroundPosition: 'left',
      backgroundRepeat: 'no-repeat',
    }}
  > 
      <Header />
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
      
      <main className="pt-28 pb-24 px-4 max-w-lg mx-auto">
        <section className="bg-gradient-to-r from-[#3b4d61] to-[#2b3747] p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-center">Taekwondo Coin Presale</h2>
          
          <div className="space-y-6">
            {/* Balance and Gas Info */}
            <div className="bg-gray-800/50 p-3 rounded-lg text-sm">
              <p className="text-gray-300">
                Your BNB Balance: {Number(userBalance).toFixed(4)}
              </p>
              {gasPrice && (
                <p className="text-gray-300 mt-1">
                  Current Gas Price: {parseFloat(gasPrice).toFixed(2)} Gwei
                </p>
              )}
            </div>

            {/* Rate Display */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current Rate</h3>
              <p className="text-gray-300">
                1 BNB = {TOKENS_PER_BNB.toLocaleString()} TKD
              </p>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="input-amount" className="block text-sm font-medium mb-2">
                BNB Amount
              </label>
              <input
                type="number"
                id="input-amount"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="Enter BNB amount"
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:border-[#61dafb] focus:ring focus:ring-[#61dafb] focus:ring-opacity-50"
                disabled={isProcessing}
                min="0"
                step="any"
              />
            </div>

            {/* TKD Output */}
            <div>
              <label htmlFor="tkd-amount" className="block text-sm font-medium mb-2">
                Taekwondo Coin Amount
              </label>
              <input
                type="text"
                id="tkd-amount"
                value={Number(tkdAmount).toLocaleString()}
                readOnly
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
              />
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={isProcessing || Number(inputAmount) <= 0 || Number(inputAmount) > Number(userBalance)}
              className="w-full bg-gradient-to-r from-[#61dafb] to-[#42a4f5] text-gray-900 font-semibold py-2 rounded-lg
                       hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                walletState.isConnected ? 'Buy Now' : 'Connect Wallet to Buy'
              )}
            </button>

            {/* Notes */}
            <div className="space-y-2 text-sm text-gray-400 text-center">
              <p>Keep some extra BNB for gas fees</p>
              <p>Gas prices are optimized for faster confirmation</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}