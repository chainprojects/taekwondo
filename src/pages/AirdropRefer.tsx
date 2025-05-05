import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Users, Gift, Copy, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { AIRDROP_REFER_ADDRESS, AIRDROP_REFER_ABI } from '../config/contracts';
import { useWallet } from '../context/WalletContext';

export function AirdropRefer() {
  const { walletState, checkAndSwitchNetwork } = useWallet();
  const { notification, showNotification, hideNotification } = useNotification();
  const [uplinerAddress, setUplinerAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralStats, setReferralStats] = useState({
    count: 0,
    income: 0,
  });

  const [contract, setContract] = useState<any>(null);
  const [referralFee, setReferralFee] = useState<string>('0');
  const [airdropFee, setAirdropFee] = useState<string>('0');

  useEffect(() => {
    if (window.ethereum && walletState.isConnected) {
      const initContract = async () => {
        try {
          const web3 = new Web3(window.ethereum);
          const networkOk = await checkAndSwitchNetwork();
          
          if (networkOk) {
            const contractInstance = new web3.eth.Contract(
              AIRDROP_REFER_ABI,
              AIRDROP_REFER_ADDRESS
            );
            setContract(contractInstance);

            const [refFee, airFee] = await Promise.all([
              contractInstance.methods.referralFee().call(),
              contractInstance.methods.airdropFee().call()
            ]);

            setReferralFee(refFee);
            setAirdropFee(airFee);
          }
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      };

      initContract();
    }
  }, [walletState.isConnected, checkAndSwitchNetwork]);

  const registerReferral = async () => {
    if (!walletState.address || !uplinerAddress) {
      showNotification('error', 'Please connect your wallet and enter an upliner address');
      return;
    }

    if (!Web3.utils.isAddress(uplinerAddress)) {
      showNotification('error', 'Please enter a valid wallet address');
      return;
    }

    setIsProcessing(true);

    try {
      const web3 = new Web3(window.ethereum);
      const networkOk = await checkAndSwitchNetwork();
      
      if (!networkOk) {
        throw new Error('network_error');
      }

      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.1).toString();

      const gasEstimate = await contract.methods
        .registerReferral(uplinerAddress)
        .estimateGas({
          from: walletState.address,
          value: referralFee,
          gasPrice: adjustedGasPrice
        });

      const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

      await contract.methods.registerReferral(uplinerAddress).send({
        from: walletState.address,
        gas: gasLimit,
        gasPrice: adjustedGasPrice,
        value: referralFee,
      });

      showNotification('success', 'Referral registered successfully!');
      setUplinerAddress('');
    } catch (error: any) {
      console.error('Error registering referral:', error);
      
      let errorMessage = 'Failed to register referral. ';
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      } else if (error.message === 'network_error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient BNB for fees and gas.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      showNotification('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const claimAirdrop = async () => {
    if (!walletState.address) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    setIsProcessing(true);

    try {
      const web3 = new Web3(window.ethereum);
      const networkOk = await checkAndSwitchNetwork();
      
      if (!networkOk) {
        throw new Error('network_error');
      }

      const hasClaimed = await contract. methods
        .hasClaimed(walletState.address)
        .call();

      if (hasClaimed) {
        showNotification('error', 'You have already claimed the airdrop');
        return;
      }

      const referrer = await contract.methods
        .referrer(walletState.address)
        .call();

      if (referrer === '0x0000000000000000000000000000000000000000') {
        showNotification('error', 'Please register a referral before claiming the airdrop');
        return;
      }

      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.1).toString();

      const gasEstimate = await contract.methods.claimAirdrop().estimateGas({
        from: walletState.address,
        value: airdropFee,
        gasPrice: adjustedGasPrice
      });

      const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

      await contract.methods.claimAirdrop().send({
        from: walletState.address,
        gas: gasLimit,
        gasPrice: adjustedGasPrice,
        value: airdropFee,
      });

      showNotification('success', 'Airdrop claimed successfully!');
    } catch (error: any) {
      console.error('Error claiming airdrop:', error);
      
      let errorMessage = 'Failed to claim airdrop. ';
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      } else if (error.message === 'network_error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient BNB for fees and gas.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      showNotification('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyReferralLink = async () => {
    if (!walletState.address) return;
    
    try {
      await navigator.clipboard.writeText(walletState.address);
      showNotification('success', 'Referral link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      showNotification('error', 'Failed to copy referral link');
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

   <div
    
    style={{
      backgroundImage: "url('https://smallseomachine.com/taek/tae1%20(2).png')",
      backgroundSize: 'auto',
      backgroundPosition: 'right',
      backgroundRepeat: 'no-repeat',
    }}
  >  
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
      
      <main className="pt-28 pb-24 px-4 max-w-lg mx-auto space-y-6">
        {/* Referral Section */}
        <section className="bg-gradient-to-r from-[#3b4d61] to-[#2b3747] p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-[#61dafb]" />
            Referral Rewards
          </h2>
          
          <div className="space-y-3">
            <p>Your Referral Count: {referralStats.count}</p>
            <p>Total Referral Income: {referralStats.income}</p>
            
            <div className="relative">
              <input
                type="text"
                value={walletState.address || ''}
                readOnly
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200"
              />
              <button
                onClick={copyReferralLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Airdrop Section */}
        <section className="bg-gradient-to-r from-[#3b4d61] to-[#2b3747] p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="text-[#61dafb]" />
            Airdrop Claim
          </h2>
          <img
    src="https://smallseomachine.com/taek/tae1%20(7).png" // Replace with your image URL
    alt="Daily Claim Illustration"
    className="w-48 h-auto mx-auto mb-6 rounded-lg shadow-md"
  />
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your upliner's address"
                value={uplinerAddress}
                onChange={(e) => setUplinerAddress(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-800 text-gray-200 placeholder-gray-500"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={registerReferral}
              disabled={!walletState.isConnected || isProcessing}
              className="w-full bg-gradient-to-r from-[#61dafb] to-[#42a4f5] text-gray-900 font-semibold py-2 rounded-lg
                       hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Register Referral'
              )}
            </button>
            
            <button
              onClick={claimAirdrop}
              disabled={!walletState.isConnected || isProcessing}
              className="w-full bg-gradient-to-r from-[#61dafb] to-[#42a4f5] text-gray-900 font-semibold py-2 rounded-lg
                       hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Claim Airdrop'
              )}
            </button>

            <div className="mt-4 text-sm text-gray-400">
              <p>Note: You need to register a referral before claiming the airdrop</p>
              <p>Keep some BNB for gas fees</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div></div>
  );
}