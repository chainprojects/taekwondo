import { Calendar } from 'lucide-react';
import Web3 from 'web3';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useWallet } from '../context/WalletContext';

const DAILY_CLAIM_CONTRACT_ADDRESS = '0x355831d96298a26d1C782c42a7737c51F1FD49eb';
const DAILY_CLAIM_ABI = [
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newAmount","type":"uint256"}],"name":"ClaimAmountUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"time","type":"uint256"}],"name":"Claimed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"FeeUpdated","type":"event"},
  {"inputs":[],"name":"claimAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"claimTokens","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"fee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"lastClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;

export function DailyClaim() {
  const { walletState } = useWallet();
  const { notification, showNotification, hideNotification } = useNotification();

  const handleDailyClaim = async () => {
    if (!walletState.address) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(
        DAILY_CLAIM_ABI,
        DAILY_CLAIM_CONTRACT_ADDRESS
      );

      const fee = await contract.methods.fee().call();
      await contract.methods.claimTokens().send({
        from: walletState.address,
        value: fee,
      });

      showNotification('success', 'Daily tokens claimed successfully!');
    } catch (error) {
      console.error('Error claiming daily tokens:', error);
      showNotification('error', 'Failed to claim tokens. Please try again.');
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
        
        <section className="bg-gradient-to-r from-[#3b4d61] to-[#2b3747] p-6 rounded-xl shadow-xl text-center">
          <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
            <Calendar className="text-[#61dafb]" />
            Daily Claim
          </h2>
          {/* Image */}
  <img
    src="https://smallseomachine.com/taek/tae1%20(6).png" // Replace with your image URL
    alt="Daily Claim Illustration"
    className="w-48 h-auto mx-auto mb-6 rounded-lg shadow-md"
  />
          <p className="mb-6 text-gray-300">
            You can claim Daily reward only one time in every 24 hours
          </p>
          
          <button
            onClick={handleDailyClaim}
            disabled={!walletState.isConnected}
            className="w-full bg-gradient-to-r from-[#61dafb] to-[#42a4f5] text-gray-900 font-semibold py-2 rounded-lg
                     hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Claim Daily Tokens
          </button>
         
        </section>
      </main>
      
      <Footer />
    </div>
  );
}