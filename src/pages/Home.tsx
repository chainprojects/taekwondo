import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad,
  Users,
  Calendar,
  Gift,
  Coins,
  ArrowRight,
  Zap,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useNotification } from '../hooks/useNotification';
import { Notification } from '../components/Notification';

// Token Configuration
const TOKEN_ADDRESS = '0xeAab5F02FaB4288B6d025623BBb3d6094ad45fe7';
const TOKEN_SYMBOL = 'TKDC';
const TOKEN_DECIMALS = 18;

export function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Function to Add Token to Wallet
  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      showNotification('error', 'Please install MetaMask to add the token');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: 0xeAab5F02FaB4288B6d025623BBb3d6094ad45fe7,
            symbol: TKDC,
            decimals: 18,
            image: 'white-belt.png',
          },
        },
      });
      showNotification('success', 'Token added to wallet successfully!');
    } catch (error) {
      console.error('Error adding token to wallet:', error);
      showNotification('error', 'Failed to add token to wallet');
    }
  };

  // Features Data
  const features = [
    {
      icon: <Gamepad size={40} />,
      title: 'Kick & Earn',
      description: 'Earn 0.2 TKD tokens per Kick. Simple, fun, and rewarding!',
    },
    {
      icon: <Gift size={40} />,
      title: 'Free Airdrop',
      description: 'Claim 2000 TKD tokens for free! One-time airdrop for all users.',
    },
    {
      icon: <Users size={40} />,
      title: 'Refer Friends',
      description: 'Get 1000 TKD tokens for each friend you refer. Unlimited referrals!',
    },
    {
      icon: <Calendar size={40} />,
      title: 'Daily Rewards',
      description: 'Claim 1000 TKD tokens every 24 hours. Come back daily!',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <Header />
      <div> <h1 className="text-5xl font-bold mb-4 text-shadow">Welcome To </h1></div>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 shadow-3d">
       <div> <h1 className="text-5xl font-bold mb-4 text-shadow">Welcome To </h1></div>


        <h1 className="text-5xl font-bold mb-4 text-shadow">Taekwondo Coin</h1>
        <p className="text-xl mb-8 text-shadow-sm">The First Kick-to-Earn Meme Game on BSC</p>

        {/* Call to Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={addTokenToWallet}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-button"
          >
            Add TKD to Wallet
          </button>
          <Link
            to="/airdrop"
            className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-button"
          >
            Free Airdrop
          </Link>
        </div>
      </section>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-shadow">How to Earn TKD</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-gray-800 rounded-lg shadow-3d transform hover:scale-105 transition"
              >
                {feature.icon}
                <h3 className="text-2xl font-bold mt-4 text-shadow-sm">{feature.title}</h3>
                <p className="mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-shadow">Tokenomics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg shadow-3d transform hover:scale-105 transition">
              <h3 className="text-3xl font-bold mb-4 text-shadow-sm">Token Distribution</h3>
              <ul className="list-disc pl-6">
                <li>10% - Presale</li>
                <li>10% - Game Rewards</li>
                <li>20% - Development</li>
                <li>20% - Airdrop and Marketing</li>
                <li>40% - Liquidity</li>
              </ul>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-3d transform hover:scale-105 transition">
              <h3 className="text-3xl font-bold mb-4 text-shadow-sm">Token Details</h3>
              <ul className="list-disc pl-6">
                <li>Name: Taekwondo Coin (TKD)</li>
                <li>Total Supply: 2,000,000,000,000,000 TKD</li>
                <li>Network: BNB Smart Chain (BSC)</li>
                <li>Presale Rate: 6,500,000 TKD per BNB</li>
                <li>Presale Rate: 10,000 TKD per USDT</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 shadow-3d">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-shadow">Start Earning Now!</h2>
          <p className="text-xl mb-8 text-shadow-sm">
            Join Taekwondo Coin and start earning through multiple reward systems - Play, Refer, and Claim daily rewards!
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/play"
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-button"
            >
              Start Playing
            </Link>
            <Link
              to="/airdrop"
              className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-button"
            >
              Claim Airdrop
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
import {
  Gamepad,
  Users,
  Calendar,
  Gift
  // Remove: Coins, ArrowRight, Zap, DollarSign, Wallet if not used
} from 'lucide-react';