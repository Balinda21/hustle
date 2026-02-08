'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { chatService } from '@/services/chatService';
import BrandHeader from '@/components/layout/BrandHeader';
import { formatBalance } from '@/lib/utils';
import {
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Copy,
  Check,
  Link,
  Upload,
} from 'lucide-react';

const WALLET_ADDRESSES: Record<string, Record<string, string>> = {
  USDT: {
    ERC20: '0x2760D44F65d61ba07e1E66D145D83129D4782e50',
    TRC20: 'TAUMpB2wAj9zBszktzHWwWsUWhgrnXPzzw',
  },
  ETH: {
    ERC20: '0x2760D44F65d61ba07e1E66D145D83129D4782e50',
  },
  BTC: {
    BTC: 'bc1ppl97muupgydnuq4e27ylkd3l750mma8402y05h6d7d68xqzqanmq7jv8x9',
  },
};

interface MenuItem {
  id: string;
  label: string;
  route?: string;
}

const menuItems: MenuItem[] = [
  { id: '1', label: 'Option Order' },
  { id: '2', label: 'Contract order' },
  { id: '3', label: 'AI Quantification Order' },
  { id: '4', label: 'History Record' },
  { id: '5', label: 'Invite friends', route: '/invite-friends' },
  { id: '6', label: 'FAQ', route: '/faq' },
  { id: '7', label: 'Chat', route: '/chat' },
  { id: '8', label: 'Contact to us', route: '/contact' },
  { id: '9', label: 'About Us', route: '/about' },
  { id: '10', label: 'Language' },
  { id: '11', label: 'Logout' },
];

export default function AccountPage() {
  const router = useRouter();
  const { logout, updateUserBalance } = useAuth();
  const { showToast } = useToast();

  const [activeAction, setActiveAction] = useState<'Deposit' | 'Wire Transfer' | 'Withdraw'>('Deposit');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [depositNetwork, setDepositNetwork] = useState<'ERC20' | 'TRC20'>('ERC20');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'ERC20' | 'TRC20'>('TRC20');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [accountBalance, setAccountBalance] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencies = ['USDT', 'ETH', 'BTC'];

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        if (response.success && response.data?.user?.accountBalance !== undefined) {
          const balance = parseFloat(response.data.user.accountBalance) || 0;
          setAccountBalance(balance);
          updateUserBalance(balance);
        }
      } catch {
        // Silently fail
      }
    };
    fetchBalance();
  }, [updateUserBalance]);

  // Listen for real-time balance updates
  useEffect(() => {
    const unsubscribe = chatService.onBalanceUpdated((data) => {
      const newBalance = parseFloat(data.accountBalance) || 0;
      setAccountBalance(newBalance);
      updateUserBalance(newBalance);
    });
    return () => { unsubscribe(); };
  }, [updateUserBalance]);

  const getWalletAddress = (): string => {
    const currencyAddresses = WALLET_ADDRESSES[selectedCurrency];
    if (!currencyAddresses) return '';
    if (selectedCurrency === 'BTC') return currencyAddresses['BTC'] || '';
    return currencyAddresses[depositNetwork] || '';
  };

  const getAvailableNetworks = (): string[] => {
    if (selectedCurrency === 'BTC') return [];
    if (selectedCurrency === 'ETH') return ['ERC20'];
    return ['ERC20', 'TRC20'];
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    if (currency === 'ETH') setDepositNetwork('ERC20');
    if (currency === 'USDT') setDepositNetwork('ERC20');
    setShowCurrencyDropdown(false);
  };

  const handleCopyAddress = async () => {
    const address = getWalletAddress();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      showToast('Failed to copy address', 'error');
    }
  };

  const handleUploadProof = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Navigate to chat with the proof image
      router.push('/chat');
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.label === 'Logout') {
      setShowLogoutConfirm(true);
      return;
    }
    if (item.route) {
      router.push(item.route);
      return;
    }
    showToast(`${item.label} feature will be available soon.`, 'info');
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <div className="overflow-y-auto">
      <BrandHeader />

      {/* Hidden file input for upload proof */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="px-4 pb-8">
        {/* Balance Card */}
        <div className="bg-card rounded-2xl px-5 py-[18px] mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-text-primary" />
              <span className="text-base font-medium text-text-primary">Account Balance</span>
            </div>
            <div className="w-0.5 h-5 bg-border rounded-sm" />
          </div>
          <div className="flex items-end justify-between mt-1.5">
            <span className="text-3xl font-bold text-text-primary">${formatBalance(accountBalance)}</span>
            <span className="text-base font-semibold text-accent">0.00%</span>
          </div>
          <div className="h-px bg-border my-3.5" />
          <div className="flex justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">Today&apos;s Earnings</p>
              <p className="text-sm font-medium text-text-primary">$0.0000</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">AI Quantification</p>
              <p className="text-sm font-medium text-text-primary">$ 0.0000</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">ROR</p>
              <p className="text-sm font-medium text-text-primary">0.00%</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 px-1">Menu</h2>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const isLogout = item.label === 'Logout';
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center justify-between bg-card rounded-xl py-4 px-4 hover:opacity-80 active:opacity-60 transition ${
                    isLogout ? 'border-t border-border mt-2 pt-5' : ''
                  }`}
                  onClick={() => handleMenuItemPress(item)}
                >
                  <div className="flex items-center">
                    {!isLogout && (
                      <div className="w-[3px] h-5 bg-accent rounded-sm mr-3" />
                    )}
                    {isLogout && (
                      <LogOut size={20} className="text-danger mr-3" />
                    )}
                    <span className={`text-[15px] font-medium ${isLogout ? 'text-danger font-semibold' : 'text-text-primary'}`}>
                      {item.label}
                    </span>
                  </div>
                  {!isLogout && (
                    <ChevronRight size={20} className="text-text-secondary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {(['Deposit', 'Wire Transfer', 'Withdraw'] as const).map((action) => (
            <button
              key={action}
              className={`flex-1 py-3 px-4 rounded-lg text-center text-sm font-medium transition ${
                activeAction === action
                  ? 'bg-card text-text-primary font-semibold'
                  : 'text-text-secondary'
              }`}
              onClick={() => setActiveAction(action)}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Deposit Section */}
        {activeAction === 'Deposit' && (
          <div className="bg-card rounded-2xl px-5 py-5 mb-6">
            <div className="flex items-center mb-5">
              <div className="w-[3px] h-5 bg-accent rounded-sm mr-3" />
              <h3 className="text-lg font-semibold text-text-primary">Deposit</h3>
            </div>

            {/* Currency Selector */}
            <button
              className="w-full flex items-center justify-between bg-[#1C1C1C] rounded-xl py-4 px-4 mb-4"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            >
              <span className="text-[15px] font-medium text-text-primary">{selectedCurrency}</span>
              {showCurrencyDropdown ? (
                <ChevronUp size={20} className="text-text-primary" />
              ) : (
                <ChevronDown size={20} className="text-text-primary" />
              )}
            </button>

            {/* Network Selection */}
            {getAvailableNetworks().length > 0 && (
              <div className="flex gap-4 mb-5">
                {getAvailableNetworks().map((network) => (
                  <button
                    key={network}
                    className="flex items-center"
                    onClick={() => setDepositNetwork(network as 'ERC20' | 'TRC20')}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-accent mr-2 flex items-center justify-center">
                      {depositNetwork === network && (
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <span className="text-[15px] font-medium text-text-primary">{network}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bitcoin Network Badge */}
            {selectedCurrency === 'BTC' && (
              <div className="flex items-center gap-1.5 bg-[#1C1C1C] rounded-lg py-2.5 px-3.5 mb-4 self-start w-fit">
                <Link size={14} className="text-accent" />
                <span className="text-[13px] font-medium text-accent">Bitcoin Network</span>
              </div>
            )}

            {/* Wallet Address */}
            <div className="mb-4">
              <p className="text-sm text-text-muted mb-2">
                {selectedCurrency} {selectedCurrency !== 'BTC' ? `(${depositNetwork})` : ''} Wallet Address
              </p>
              <div className="flex items-center justify-between bg-[#1C1C1C] rounded-xl py-3.5 px-4">
                <span className="text-sm text-text-primary truncate flex-1 mr-3">
                  {getWalletAddress()}
                </span>
                <button
                  className={`rounded-lg py-2 px-3 flex items-center gap-1 transition ${
                    copiedAddress
                      ? 'bg-[rgba(76,175,80,0.15)] border border-[rgba(76,175,80,0.3)]'
                      : 'bg-accent'
                  }`}
                  onClick={handleCopyAddress}
                >
                  {copiedAddress ? (
                    <Check size={14} className="text-[#4CAF50]" />
                  ) : (
                    <Copy size={14} className="text-background" />
                  )}
                  <span className={`text-sm font-semibold ${copiedAddress ? 'text-[#4CAF50]' : 'text-background'}`}>
                    {copiedAddress ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Full Address Display */}
            <div className="bg-[#111] rounded-[10px] p-3.5 mb-4 border border-[#222]">
              <p className="text-xs text-text-secondary font-mono leading-[18px] tracking-wide break-all select-all">
                {getWalletAddress()}
              </p>
            </div>

            {/* Upload Proof */}
            <button
              className="w-full bg-accent rounded-xl py-4 text-center mb-4 hover:opacity-80 active:opacity-60 transition"
              onClick={handleUploadProof}
            >
              <span className="text-base font-semibold text-background">Upload Proof</span>
            </button>

            {/* Warning */}
            <p className="text-xs text-text-muted leading-[18px]">
              Please do not send other types of assets to the above address. This action may result in the loss of your assets. After the transmission is successful, the network node needs to confirm receipt of the corresponding assets. After the transfer is successful, please contact online customer service for confirmation.
            </p>
          </div>
        )}

        {/* Wire Transfer Section */}
        {activeAction === 'Wire Transfer' && (
          <div className="bg-card rounded-2xl px-5 py-5 mb-6">
            <div className="flex items-center mb-5">
              <div className="w-[3px] h-5 bg-accent rounded-sm mr-3" />
              <h3 className="text-lg font-semibold text-text-primary">Wire Transfer</h3>
            </div>

            <div className="mb-5">
              <h4 className="text-base font-semibold text-text-primary mt-4 mb-2">Before Initiating the Wire Transfer:</h4>
              <p className="text-sm text-text-muted leading-5 mb-4">
                Prior to initiating a wire transfer, please contact our customer service team to obtain the accurate wire transfer account information. This step ensures the security and safe arrival of your funds.
              </p>

              <h4 className="text-base font-semibold text-text-primary mt-4 mb-2">Processing Time for Wire Transfer:</h4>
              <p className="text-sm text-text-muted leading-5 mb-4">
                Prior to initiating a wire transfer, please contact our customer service team to obtain the accurate wire transfer account information. This step ensures the security and safe arrival of your funds.
              </p>

              <h4 className="text-base font-semibold text-text-primary mt-4 mb-2">Assistance During Wire Transfer:</h4>
              <p className="text-sm text-text-muted leading-5 mb-4">
                Should you encounter any issues or have questions during the wire transfer process, please feel free to reach out to our customer service team. We are committed to providing assistance and support to ensure a smooth transaction experience for you.
              </p>
            </div>

            <button
              className="w-full bg-accent rounded-xl py-4 text-center hover:opacity-80 active:opacity-60 transition"
              onClick={handleUploadProof}
            >
              <span className="text-base font-semibold text-background">Upload Proof</span>
            </button>
          </div>
        )}

        {/* Withdraw Section */}
        {activeAction === 'Withdraw' && (
          <div className="bg-card rounded-2xl px-5 py-5 mb-6">
            <div className="flex items-center mb-5">
              <div className="w-[3px] h-5 bg-accent rounded-sm mr-3" />
              <h3 className="text-lg font-semibold text-text-primary">Withdraw</h3>
            </div>

            {/* Currency Selector */}
            <button
              className="w-full flex items-center justify-between bg-[#1C1C1C] rounded-xl py-4 px-4 mb-4"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            >
              <span className="text-[15px] font-medium text-text-primary">{selectedCurrency}</span>
              {showCurrencyDropdown ? (
                <ChevronUp size={20} className="text-text-primary" />
              ) : (
                <ChevronDown size={20} className="text-text-primary" />
              )}
            </button>

            {/* Network Selection */}
            <div className="flex gap-4 mb-5">
              <button className="flex items-center" onClick={() => setWithdrawNetwork('TRC20')}>
                <div className="w-5 h-5 rounded-full border-2 border-accent mr-2 flex items-center justify-center">
                  {withdrawNetwork === 'TRC20' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <span className="text-[15px] font-medium text-text-primary">TRC20</span>
              </button>
              <button className="flex items-center" onClick={() => setWithdrawNetwork('ERC20')}>
                <div className="w-5 h-5 rounded-full border-2 border-accent mr-2 flex items-center justify-center">
                  {withdrawNetwork === 'ERC20' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <span className="text-[15px] font-medium text-text-primary">ERC20</span>
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <p className="text-sm text-text-muted mb-2">Amount</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  className="flex-1 bg-[#1C1C1C] rounded-xl py-4 px-4 text-text-primary text-[15px] outline-none"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                />
                <button className="bg-[#1C1C1C] rounded-xl py-4 px-5">
                  <span className="text-sm font-semibold text-text-primary">MAX</span>
                </button>
              </div>
            </div>

            {/* Withdrawal Currency Display */}
            <div className="mb-4">
              <p className="text-sm text-text-muted mb-2">withdrawal currency</p>
              <div className="bg-[#1C1C1C] rounded-xl py-4 px-4">
                <span className="text-[15px] font-medium text-text-primary">
                  {withdrawAmount || '0'} {selectedCurrency}
                </span>
              </div>
            </div>

            {/* Wallet Address Input */}
            <div className="mb-4">
              <p className="text-sm text-text-muted mb-2">Wallet Address</p>
              <input
                type="text"
                className="w-full bg-[#1C1C1C] rounded-xl py-4 px-4 text-text-primary text-[15px] outline-none"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
              />
            </div>

            {/* Confirm Button */}
            <button className="w-full bg-accent rounded-xl py-4 text-center mb-4 hover:opacity-80 active:opacity-60 transition">
              <span className="text-base font-semibold text-background">confirm</span>
            </button>

            {/* Info */}
            <p className="text-sm text-text-primary leading-5 mb-2">
              Your withdrawal will be sent to your wallet address within the next 24 hours, please be patient and wait for the review to arrive.
            </p>
            <p className="text-sm text-text-muted">
              The currency withdrawal fee is 2%
            </p>
          </div>
        )}
      </div>

      {/* Currency Dropdown Modal */}
      {showCurrencyDropdown && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowCurrencyDropdown(false)}
        >
          <div className="bg-card rounded-xl py-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
            {currencies.map((currency) => (
              <button
                key={currency}
                className="w-full flex items-center py-3 px-4 hover:bg-[#2a2a2a] transition"
                onClick={() => handleCurrencyChange(currency)}
              >
                <div className="w-5 h-5 rounded-full border-2 border-accent mr-3 flex items-center justify-center">
                  {selectedCurrency === currency && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </div>
                <span className="text-[15px] font-medium text-text-primary">{currency}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 mx-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Logout</h3>
            <p className="text-sm text-text-muted mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-border text-text-primary font-medium"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-danger text-white font-medium"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
