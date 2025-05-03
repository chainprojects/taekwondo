import { Home, Gamepad, Users, Calendar, Gift } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Footer() {
  const location = useLocation();
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Gamepad, label: 'Game', path: '/game' },
    { icon: Users, label: 'Airdrop & Refer', path: '/airdrop-refer' },
    { icon: Calendar, label: 'Daily Claim', path: '/daily-claim' },
    { icon: Gift, label: 'Presale', path: '/presale' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#1a2537] to-[#2d4663] text-white shadow-lg backdrop-blur-lg bg-opacity-95">
      <nav className="flex justify-around items-center p-3 max-w-6xl mx-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-sm transition-all transform hover:scale-110 ${
                isActive 
                  ? 'text-[#61dafb] scale-105' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}