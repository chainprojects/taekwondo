import { ThirdwebProvider, coinbaseWallet, metamaskWallet, walletConnect } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { Home } from './pages/Home';
import { ClickGame } from './pages/ClickGame';
import { AirdropRefer } from './pages/AirdropRefer';
import { DailyClaim } from './pages/DailyClaim';
import { Presale } from './pages/Presale';
import { Binance } from "@thirdweb-dev/chains";

function App() {
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

  return (
    <ThirdwebProvider 
      clientId={clientId}
      activeChain={Binance}
      supportedWallets={[
        metamaskWallet({ recommended: true }),
        coinbaseWallet(),
        walletConnect()
      ]}
      autoConnect={true}
      dAppMeta={{
        name: "Taekwondo Coin",
        description: "Click and Earn Crypto Game",
        logoUrl: "https://smallseomachine.com/taek/tae1%20(1).png",
        url: window.location.origin,
        isDarkMode: true
      }}
    >
      <WalletProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<ClickGame />} />
            <Route path="/airdrop-refer" element={<AirdropRefer />} />
            <Route path="/daily-claim" element={<DailyClaim />} />
            <Route path="/presale" element={<Presale />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WalletProvider>
    </ThirdwebProvider>
  );
}

export default App;