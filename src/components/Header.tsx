import { ConnectWallet } from "@thirdweb-dev/react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 w-full bg-gradient-to-r from-[#1da0f7] to-[#2b3747] text-white p-4 flex justify-between items-center z-50">
      <h1 className="flex items-center text-xl">
        <img 
          src="https://smallseomachine.com/taek/tae1%20(1).png" 
          alt="Taekwondo Coin Logo" 
          className="w-10 h-10 mr-2 rounded-full"
        />
        Taekwondo Coin 
      </h1>
      
      <div className="flex items-center gap-4">
        <ConnectWallet 
          theme="dark"
          btnTitle="Connect Wallet"
          modalTitle="Connect Your Wallet"
          auth={{
            loginOptional: false
          }}
          switchToActiveChain={true}
          modalSize="wide"
        />
      </div>
    </header>
  );
}