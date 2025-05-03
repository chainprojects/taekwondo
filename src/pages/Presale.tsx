import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useWallet } from '../context/WalletContext';

// Contract addresses
const PRESALE_CONTRACT_ADDRESS = '0x70256152c4e636f342D9B5EEC23dD3E200896b43';
const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'; // BSC USDT

// Token rates
const TOKENS_PER_BNB = 6500000;
const TOKENS_PER_USDT = 10000; // Assuming 1 USDT = 2000 tokens

// Gas settings
const GAS_PRICE_MULTIPLIER = 1.1; // 10% increase
const GAS_LIMIT_MULTIPLIER = 1.2;  // 20% buffer

const USDT_ABI = [
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const PRESALE_CONTRACT_ABI = [
  {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_usdtToken","type":"address"},{"internalType":"uint256","name":"_tokensPerBNB","type":"uint256"},{"internalType":"uint256","name":"_tokensPerUSDT","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"token","type":"string"}],"name":"FundsWithdrawn","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"paymentMethod","type":"string"}],"name":"TokensPurchased","type":"event"},
  {"inputs":[],"name":"bnbRaised","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"buyWithBNB","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"usdtAmount","type":"uint256"}],"name":"buyWithUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"bnbAmount","type":"uint256"}],"name":"calculateTokensForBNB","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"usdtAmount","type":"uint256"}],"name":"calculateTokensForUSDT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_tokensPerBNB","type":"uint256"},{"internalType":"uint256","name":"_tokensPerUSDT","type":"uint256"}],"name":"setTokenPrices","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"tokensPerBNB","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"tokensPerUSDT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"usdtRaised","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"usdtToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"withdrawBNB","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"withdrawUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"withdrawUnsoldTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const;

export function Presale() {
  const { notification, showNotification, hideNotification } = useNotification();
  const { walletState, checkAndSwitchNetwork } = useWallet();
  const [paymentMethod, setPaymentMethod] = useState<'BNB' | 'USDT'>('BNB');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [bucAmount, setBucAmount] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [presaleContract, setPresaleContract] = useState<any>(null);
  const [usdtContract, setUsdtContract] = useState<any>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');


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
            const usdtContractInstance = new web3Instance.eth.Contract(
              USDT_ABI,
              USDT_CONTRACT_ADDRESS
            );
            setPresaleContract(presaleContractInstance);
            setUsdtContract(usdtContractInstance);
            await updateBalanceAndGas(web3Instance);
          }
        } catch (error) {
          console.error('Error initializing Web3:', error);

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
    if (!walletState.address || !usdtContract) return;

    try {
      const [balance, usdtBal, currentGasPrice] = await Promise.all([
        web3Instance.eth.getBalance(walletState.address),
        usdtContract.methods.balanceOf(walletState.address).call(),
        web3Instance.eth.getGasPrice()
      ]);

      setUserBalance(web3Instance.utils.fromWei(balance, 'ether'));
      setUsdtBalance(web3Instance.utils.fromWei(usdtBal, 'ether'));
      setGasPrice(web3Instance.utils.fromWei(currentGasPrice, 'gwei'));

    } catch (error) {
      console.error('Error updating balance and gas:', error);

    }
  };

  const calculateBucAmount = (amount: string, method: 'BNB' | 'USDT'): string => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return '0';
    const rate = method === 'BNB' ? TOKENS_PER_BNB : TOKENS_PER_USDT;
    return (Number(amount) * rate).toLocaleString('fullwide', { useGrouping: false });
  };

  useEffect(() => {
    const newBucAmount = calculateBucAmount(inputAmount, paymentMethod);
    setBucAmount(newBucAmount);
  }, [inputAmount, paymentMethod]);

  const handleBuyWithUSDT = async () => {
    if (!web3 || !presaleContract || !usdtContract || !walletState.address) {
      throw new Error('web3_not_initialized');
    }

    const usdtAmount = web3.utils.toWei(inputAmount, 'ether');
    
    // Validate USDT balance and allowance first
    const [tokenBalance, currentAllowance] = await Promise.all([
      usdtContract.methods.balanceOf(walletState.address).call(),
      usdtContract.methods.allowance(walletState.address, PRESALE_CONTRACT_ADDRESS).call()
    ]);

    if (web3.utils.toBN(tokenBalance).lt(web3.utils.toBN(usdtAmount))) {
      throw new Error('insufficient_balance');
    }

    // Get current gas price with safety multiplier
    const currentGasPrice = await web3.eth.getGasPrice();
    const adjustedGasPrice = Math.floor(Number(currentGasPrice) * GAS_PRICE_MULTIPLIER).toString();

    // Approve USDT if needed
    if (web3.utils.toBN(currentAllowance).lt(web3.utils.toBN(usdtAmount))) {
      try {
        await usdtContract.methods.approve(PRESALE_CONTRACT_ADDRESS, usdtAmount).send({
          from: walletState.address,
          gasPrice: adjustedGasPrice
        });
      } catch (error) {
        console.error('USDT approval failed:', error);
        throw new Error('usdt_approval_failed');
      }
    }

    let gasEstimate;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        // Estimate gas with detailed error handling
        try {
          gasEstimate = await presaleContract.methods.buyWithUSDT(usdtAmount).estimateGas({
            from: walletState.address,
            gasPrice: adjustedGasPrice
          });
        } catch (estimateError: any) {
          if (estimateError.message.includes('execution reverted')) {
            throw new Error('contract_requirements_not_met');
          }
          throw estimateError;
        }

        const gasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER).toString();

        // Verify gas cost doesn't exceed BNB balance
        const gasCost = web3.utils.toBN(adjustedGasPrice).mul(web3.utils.toBN(gasLimit));
        const bnbBalance = web3.utils.toBN(await web3.eth.getBalance(walletState.address));
        
        if (bnbBalance.lt(gasCost)) {
          throw new Error('insufficient_bnb_for_gas');
        }

        // Execute transaction
        await presaleContract.methods.buyWithUSDT(usdtAmount).send({
          from: walletState.address,
          gas: gasLimit,
          gasPrice: adjustedGasPrice
        });
        break;
      } catch (error: any) {
        console.error(`USDT purchase attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (error.message === 'contract_requirements_not_met' ||
            error.message === 'insufficient_bnb_for_gas') {
          throw error;
        }
        
        if (retryCount === maxRetries) {
          throw new Error('gas_estimate_failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const handleBuyWithBNB = async () => {
    if (!web3 || !presaleContract || !walletState.address) {
      throw new Error('web3_not_initialized');
    }

    const bnbAmount = web3.utils.toWei(inputAmount, 'ether');
    const currentGasPrice = await web3.eth.getGasPrice();
    const adjustedGasPrice = Math.floor(Number(currentGasPrice) * GAS_PRICE_MULTIPLIER).toString();

    // Validate BNB balance before proceeding
    const balance = await web3.eth.getBalance(walletState.address);
    if (web3.utils.toBN(balance).lt(web3.utils.toBN(bnbAmount))) {
      throw new Error('insufficient_balance');
    }

    let gasEstimate;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        // Add buffer to value for price fluctuations
        const valueWithBuffer = web3.utils.toBN(bnbAmount).mul(web3.utils.toBN('102')).div(web3.utils.toBN('100'));
        
        // Estimate gas with detailed error handling
        try {
          gasEstimate = await presaleContract.methods.buyWithBNB().estimateGas({
            from: walletState.address,
            value: valueWithBuffer.toString(),
            gasPrice: adjustedGasPrice
          });
        } catch (estimateError: any) {
          if (estimateError.message.includes('execution reverted')) {
            throw new Error('contract_requirements_not_met');
          }
          throw estimateError;
        }

        const gasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER).toString();

        // Verify total cost including gas
        const totalCost = web3.utils.toBN(bnbAmount).add(
          web3.utils.toBN(adjustedGasPrice).mul(web3.utils.toBN(gasLimit))
        );
        
        if (web3.utils.toBN(balance).lt(totalCost)) {
          throw new Error('insufficient_funds_for_gas');
        }

        // Execute transaction
        await presaleContract.methods.buyWithBNB().send({
          from: walletState.address,
          value: bnbAmount,
          gas: gasLimit,
          gasPrice: adjustedGasPrice
        });
        break;
      } catch (error: any) {
        console.error(`BNB purchase attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (error.message === 'contract_requirements_not_met') {
          throw error;
        }
        if (error.message === 'insufficient_funds_for_gas') {
          throw error;
        }
        
        if (retryCount === maxRetries) {
          throw new Error('gas_estimate_failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const handleBuyTokens = async () => {
    if (!walletState.address) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    if (!inputAmount || isNaN(Number(inputAmount)) || Number(inputAmount) <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const networkOk = await checkAndSwitchNetwork();
      if (!networkOk) {
        throw new Error('network_error');
      }

      if (paymentMethod === 'USDT') {
        await handleBuyWithUSDT();
      } else {
        await handleBuyWithBNB();
      }

      showNotification('success', 'Purchase successful!');
      setInputAmount('');
      setBucAmount('0');
      await updateBalanceAndGas(web3!);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      let errorMessage = 'Transaction failed. ';

      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      } else if (error.message === 'network_error') {
        errorMessage = 'Please check your network connection.';
      } else if (error.message === 'insufficient_balance') {
        errorMessage = `Insufficient ${paymentMethod} balance.`;
      } else if (error.message === 'insufficient_allowance') {
        errorMessage = 'Please approve USDT spending first.';
      } else if (error.message === 'usdt_approval_failed') {
        errorMessage = 'Failed to approve USDT spending.';
      } else if (error.message === 'gas_estimate_failed') {
        errorMessage = 'Failed to estimate gas. Please try again with a different amount.';
      } else {
        errorMessage += 'Please try again.';
      }

      showNotification('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuy = async () => {
    if (!walletState.isConnected) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    const currentBalance = paymentMethod === 'BNB' ? userBalance : usdtBalance;
    if (Number(inputAmount) > Number(currentBalance)) {
      showNotification('error', `Insufficient ${paymentMethod} balance`);
      return;
    }

    setIsProcessing(true);

    try {
      // Validate web3 instance and contracts
      if (!web3 || !presaleContract || (paymentMethod === 'USDT' && !usdtContract)) {
        throw new Error('web3_not_initialized');
      }

      const networkOk = await checkAndSwitchNetwork();
      if (!networkOk) {
        throw new Error('network_error');
      }

      // Get current gas price and calculate adjustments
      const currentGasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(currentGasPrice) * GAS_PRICE_MULTIPLIER).toString();

      if (paymentMethod === 'BNB') {
        const bnbAmount = web3.utils.toWei(inputAmount, 'ether');

        // Estimate gas with adjusted parameters and retry logic
        let gasEstimate;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            // Add buffer to value to account for price fluctuations
            const valueWithBuffer = web3.utils.toBN(bnbAmount).mul(web3.utils.toBN('102')).div(web3.utils.toBN('100'));
            
            gasEstimate = await presaleContract.methods.buyWithBNB().estimateGas({
              from: walletState.address,
              value: valueWithBuffer.toString(),
              gasPrice: adjustedGasPrice
            });
            break; // If successful, exit the retry loop
          } catch (estimateError) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.error('Gas estimation failed after retries:', estimateError);
              throw new Error('gas_estimate_failed');
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const gasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER).toString();

        // Verify total transaction cost (amount + gas) doesn't exceed balance
        const totalCost = web3.utils.toBN(bnbAmount).add(
          web3.utils.toBN(adjustedGasPrice).mul(web3.utils.toBN(gasLimit))
        );
        const userBalanceWei = web3.utils.toBN(web3.utils.toWei(userBalance, 'ether'));
        
        if (totalCost.gt(userBalanceWei)) {
          throw new Error('insufficient_funds_for_gas');
        }

        await presaleContract.methods.buyWithBNB().send({
          from: walletState.address,
          value: bnbAmount,
          gas: gasLimit,
          gasPrice: adjustedGasPrice
        });
      } else {
        await handleBuyWithUSDT();
      }

      showNotification('success', 'Purchase successful!');
      setInputAmount('');
      setBucAmount('0');
      await updateBalanceAndGas(web3);
    } catch (error: any) {
      console.error('Error during purchase:', error);
      let errorMessage = 'An unexpected error occurred. ';

      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message === 'network_error') {
        errorMessage = 'Please check your network connection and try again.';
      } else if (error.message === 'web3_not_initialized') {
        errorMessage = 'Web3 initialization failed. Please refresh and try again.';
      } else if (error.message === 'gas_estimate_failed') {
        errorMessage = 'Failed to estimate gas. Please try a smaller amount or try again later.';
      } else if (error.message === 'insufficient_funds_for_gas') {
        errorMessage = `Insufficient ${paymentMethod} for transaction and gas fees.`;
      } else if (error.message === 'insufficient_bnb_for_gas') {
        errorMessage = 'Insufficient BNB for gas fees.';
      } else if (error.message === 'contract_requirements_not_met') {
        errorMessage = 'Transaction cannot be completed. Contract requirements not met.';
      } else if (error.message === 'usdt_approval_failed') {
        errorMessage = 'USDT approval failed. Please try again.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = `Insufficient ${paymentMethod} for transaction and gas fees.`;
      } else if (error.message.includes('gas required exceeds allowance')) {
        errorMessage = 'Transaction would exceed gas limits. Please try a smaller amount.';
      } else {
        errorMessage += 'Please try again later.';
      }

      showNotification('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141e30] to-[#243b55] text-white">
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
          <h2 className="text-xl font-bold mb-6 text-center">Best Universal Coin Presale</h2>
          
          <div className="space-y-6">
            {/* Balance and Gas Info */}
            <div className="bg-gray-800/50 p-3 rounded-lg text-sm">
              <p className="text-gray-300">
                Your BNB Balance: {Number(userBalance).toFixed(4)}
              </p>
              <p className="text-gray-300">
                Your USDT Balance: {Number(usdtBalance).toFixed(2)}
              </p>
              {gasPrice && (
                <p className="text-gray-300 mt-1">
                  Current Gas Price: {parseFloat(gasPrice).toFixed(2)} Gwei
                </p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('BNB')}
                className={`flex-1 py-2 px-4 rounded ${paymentMethod === 'BNB' ? 'bg-[#61dafb] text-gray-900' : 'bg-gray-700'}`}
              >
                Pay with BNB
              </button>
              <button
                onClick={() => setPaymentMethod('USDT')}
                className={`flex-1 py-2 px-4 rounded ${paymentMethod === 'USDT' ? 'bg-[#61dafb] text-gray-900' : 'bg-gray-700'}`}
              >
                Pay with USDT
              </button>
            </div>

            {/* Rate Display */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current Rate</h3>
              <p className="text-gray-300">
                1 BNB = {TOKENS_PER_BNB.toLocaleString()} BUC
              </p>
              <p className="text-gray-300 mt-1">
                1 USDT = {TOKENS_PER_USDT.toLocaleString()} BUC
              </p>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="input-amount" className="block text-sm font-medium mb-2">
                {paymentMethod} Amount
              </label>
              <input
                type="number"
                id="input-amount"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder={`Enter ${paymentMethod} amount`}
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:border-[#61dafb] focus:ring focus:ring-[#61dafb] focus:ring-opacity-50"
                disabled={isProcessing}
                min="0"
                step="any"
              />
            </div>

            {/* BUC Output */}
            <div>
              <label htmlFor="buc-amount" className="block text-sm font-medium mb-2">
                BUC Amount
              </label>
              <input
                id="buc-amount"
                value={Number(bucAmount).toLocaleString()}
                readOnly
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700"
              />
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={isProcessing || Number(inputAmount) <= 0 || Number(inputAmount) > Number(paymentMethod === 'BNB' ? userBalance : usdtBalance)}
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
              <p>Keep some extra {paymentMethod} for gas fees</p>
              <p>Gas prices are optimized for faster confirmation</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}