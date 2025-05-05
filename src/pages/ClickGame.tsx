import { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { CLICK_GAME_ADDRESS, CLICK_GAME_ABI } from '../config/contracts';
import { useWallet } from '../context/WalletContext';
import type { ClickData } from '../types';

const BASE_TOKENS_PER_CLICK = 0.2;
const ANIMATION_DURATION = 300; // Reduced from 600ms to 300ms

// Level configuration
const MAX_LEVEL = 50;
const BASE_DAILY_LIMIT = 100000;
const BASE_UPGRADE_COST = 20000;
const LEVELS_PER_BELT = 8;

// Belt configuration with action images
const BELT_IMAGES = [
  { name: 'White Belt', image: '/white-belt.png', actionImage: '/white-action.png' },
  { name: 'Yellow Belt', image: '/yellow-belt.png', actionImage: '/yellow-action.png' },
  { name: 'Green Belt', image: '/green-belt.png', actionImage: '/green-action.png' },
  { name: 'Blue Belt', image: '/blue-belt.png', actionImage: '/blue-action.png' },
  { name: 'Red Belt', image: '/red-belt.png', actionImage: '/red-action.png' },
  { name: 'Black Belt', image: '/black-belt.png', actionImage: '/black-action.png' }
];

// Fallback images if belt images are not available
const imageUrls = [
  '/white-belt.png',
  '/white-belt.png',
  '/white-action.png',
  '/white-action.png'
];

const sounds = [
  '/tae sound (1).mp3',
  '/tae sound (2).mp3',
  '/tae sound (3).mp3',
  '/tae sound (4).mp3',
  '/tae sound (5).mp3',
  '/tae sound (6).mp3',
  '/tae sound (7).mp3',
  '/tae sound (8).mp3',
  // ... Add more sound files here up to 68
];

// Helper function to get current belt based on level

// Helper function to get current belt based on level
const getCurrentBelt = (level: number) => {
  const beltIndex = Math.min(Math.floor((level - 1) / LEVELS_PER_BELT), BELT_IMAGES.length - 1);
  return BELT_IMAGES[beltIndex];
};

// Helper function to calculate tokens per click based on level
const getTokensPerClick = (level: number) => {
  return BASE_TOKENS_PER_CLICK * Math.pow(2, level - 1);
};

export function ClickGame() {
  const { notification, showNotification, hideNotification } = useNotification();
  const { walletState } = useWallet();
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const clickTimeoutRef = useRef(null); // Remove if not used
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('soundMuted', isSoundMuted.toString());
  }, [isSoundMuted]);

  // Level and daily limit state
  const [currentLevel, setCurrentLevel] = useState(() => {
    return parseInt(localStorage.getItem('currentLevel') || '1');
  });
  const [dailyTokensEarned, setDailyTokensEarned] = useState(() => {
    const today = new Date().toDateString();
    const savedData = localStorage.getItem('dailyTokensEarned');
    if (savedData) {
      const { date, amount } = JSON.parse(savedData);
      return date === today ? amount : 0;
    }
    return 0;
  });

  const [clickData, setClickData] = useState(() => {
    const savedData = localStorage.getItem('clickData');
    return savedData ? JSON.parse(savedData) : {
      earnedTokens: 0,
      totalEarned: 0,
      totalClicks: 0
    };
  });

  const [currentImage, setCurrentImage] = useState(imageUrls[0]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [animatingImages, setAnimatingImages] = useState(new Set());
  const nextImageIdRef = useRef(0);

  // Calculate daily limit and upgrade cost based on level
  const dailyLimit = BASE_DAILY_LIMIT * Math.pow(2, currentLevel - 1);
  const upgradeCost = BASE_UPGRADE_COST * Math.pow(2, currentLevel - 1);

  // Reset daily tokens at midnight
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toDateString();
      const savedData = localStorage.getItem('dailyTokensEarned');
      if (savedData) {
        const { date } = JSON.parse(savedData);
        if (date !== today) {
          setDailyTokensEarned(0);
          localStorage.setItem('dailyTokensEarned', JSON.stringify({
            date: today,
            amount: 0
          }));
        }
      }
    };

    checkDate();
    const interval = setInterval(checkDate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleLevelUpgrade = () => {
    if (currentLevel >= MAX_LEVEL) {
      showNotification('error', 'Maximum level reached!');
      return;
    }

    if (clickData.earnedTokens < upgradeCost) {
      showNotification('error', `Insufficient tokens. Need ${upgradeCost} tokens to upgrade`);
      return;
    }

    setIsUpgrading(true);
    try {
      // Deduct upgrade cost
      setClickData((prev: ClickData) => ({
        ...prev,
        earnedTokens: prev.earnedTokens - upgradeCost
      }));

      // Increase level
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      localStorage.setItem('currentLevel', newLevel.toString());

      showNotification('success', `Successfully upgraded to level ${newLevel}!`);
    } catch (error) {
      console.error('Upgrade failed:', error);
      showNotification('error', 'Failed to upgrade level');
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CLICK_GAME_ABI, CLICK_GAME_ADDRESS);
        setContract(contractInstance);
        try {
          const feeAmount = await contractInstance.methods.withdrawalFee().call();
          setFee(feeAmount);
        } catch (error) {
          console.error('Error fetching fee:', error);
        }
      }
    };
    initWeb3();
  }, []);

  const handleImageClick = async () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    if (timeSinceLastClick < 50) return;
    
    lastClickTimeRef.current = now;

    // Check daily limit
    if (dailyTokensEarned >= dailyLimit) {
      showNotification('error', 'Daily token limit reached!');
      return;
    }

    // Calculate tokens earned for this click
    const tokensEarned = getTokensPerClick(currentLevel);

    // Update daily tokens earned
    const newDailyTokens = dailyTokensEarned + tokensEarned;
    setDailyTokensEarned(newDailyTokens);
    localStorage.setItem('dailyTokensEarned', JSON.stringify({
      date: new Date().toDateString(),
      amount: newDailyTokens
    }));

    // Update click data
    setClickData(prev => ({
      earnedTokens: prev.earnedTokens + tokensEarned,
      totalEarned: prev.totalEarned + tokensEarned,
      totalClicks: prev.totalClicks + 1
    }));

    // Play sound and animate
    await playRandomSound();

    const imageId = nextImageIdRef.current++;
    const currentBelt = getCurrentBelt(currentLevel);
    
    // Switch to action image
    setCurrentImage(currentBelt.actionImage);
    setAnimatingImages(prev => new Set(prev).add(imageId));
    
    // Reset image after animation
    setTimeout(() => {
      setCurrentImage(currentBelt.image);
      setAnimatingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }, ANIMATION_DURATION);

    // Save updated click data to localStorage
    localStorage.setItem('clickData', JSON.stringify(clickData));
  };

  // Handle withdrawal of tokens
  const handleWithdraw = async () => {
    if (!web3 || !contract || !walletState.address) {
      showNotification('error', 'Please connect your wallet first');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    if (amount > clickData.earnedTokens) {
      showNotification('error', 'Insufficient tokens');
      return;
    }

    if (amount < 100) {
      showNotification('error', 'Minimum withdrawal is 100 tokens');
      return;
    }

    setIsWithdrawing(true);
    try {
      const tx = await contract.methods.withdraw(web3.utils.toWei(amount.toString(), 'ether')).send({
        from: walletState.address
      });

      setClickData(prev => ({
        ...prev,
        earnedTokens: prev.earnedTokens - amount
      }));

      setWithdrawAmount('');
      showNotification('success', 'Withdrawal successful!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      showNotification('error', 'Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const playRandomSound = async () => {
    if (isSoundMuted || !audioRef.current) return;
    try {
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      audioRef.current.src = randomSound;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white pt-24 pb-32">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
        {/* Game Stats Section */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 md:p-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 backdrop-blur-lg bg-opacity-90">
            <h3 className="text-xl md:text-2xl font-bold text-blue-100 mb-2">Level {currentLevel}</h3>
            <p className="text-blue-200 text-lg">{getCurrentBelt(currentLevel).name}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 md:p-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 backdrop-blur-lg bg-opacity-90">
            <h3 className="text-xl md:text-2xl font-bold text-purple-100 mb-2">Tokens Earned</h3>
            <p className="text-purple-200 text-lg">{clickData.earnedTokens.toFixed(2)} TKDC</p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 md:p-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 backdrop-blur-lg bg-opacity-90 sm:col-span-2 md:col-span-1">
            <h3 className="text-xl md:text-2xl font-bold text-green-100 mb-2">Daily Progress</h3>
            <p className="text-green-200 text-lg">{dailyTokensEarned.toFixed(2)} / {dailyLimit} TKDC</p>
          </div>
        </div>

        {/* Game Image Section */}
        <div className="relative w-full max-w-xl mx-auto aspect-square p-4">
          <img
            src={currentImage}
            alt="Game Character"
            className={`w-full h-full object-contain cursor-pointer transform transition-all duration-300 ${animatingImages.size > 0 ? 'scale-110' : 'hover:scale-105'} rounded-3xl shadow-[0_15px_30px_rgba(0,0,0,0.4)]`}
            onClick={handleImageClick}
          />
        </div>

        {/* Controls Section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Upgrade Section */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-4 md:p-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 backdrop-blur-lg bg-opacity-90">
            <h3 className="text-xl md:text-2xl font-bold text-amber-100 mb-3">Level Up</h3>
            <p className="text-amber-200 text-lg mb-4">Cost: {upgradeCost} TKDC</p>
            <button
              onClick={handleLevelUpgrade}
              disabled={isUpgrading || clickData.earnedTokens < upgradeCost}
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-6 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              {isUpgrading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                'Upgrade Level'
              )}
            </button>
          </div>

          {/* Withdraw Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 md:p-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 backdrop-blur-lg bg-opacity-90">
            <h3 className="text-xl md:text-2xl font-bold text-indigo-100 mb-3">Withdraw Tokens</h3>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full mb-4 bg-indigo-700 text-white placeholder-indigo-300 border border-indigo-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300"
            />
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              {isWithdrawing ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                'Withdraw'
              )}
            </button>
          </div>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            setIsSoundMuted(!isSoundMuted);
            localStorage.setItem('soundMuted', (!isSoundMuted).toString());
          }}
          className="fixed bottom-24 right-4 bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all transform hover:scale-110 duration-300 z-50"
        >
          {isSoundMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <Footer />
    </div>
  );
}