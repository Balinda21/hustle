'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import CountdownModal from '@/components/trading/CountdownModal';
import { chatService } from '@/services/chatService';
import { X } from 'lucide-react';

type OptionPeriod = {
  seconds: number;
  label: string;
  ror: number;
  minAmount: number;
  maxAmount: number;
};

const OPTION_PERIODS: OptionPeriod[] = [
  { seconds: 60,    label: '60 s',    ror: 20.0, minAmount: 100,        maxAmount: 1_000_000   },
  { seconds: 120,   label: '120 s',   ror: 30.0, minAmount: 10_000,     maxAmount: 1_500_000   },
  { seconds: 180,   label: '180 s',   ror: 40.0, minAmount: 50_000,     maxAmount: 3_000_000   },
  { seconds: 360,   label: '360 s',   ror: 50.0, minAmount: 1_000_000,  maxAmount: 60_000_000  },
  { seconds: 7200,  label: '7200 s',  ror: 60.0, minAmount: 5_000_000,  maxAmount: 100_000_000 },
  { seconds: 21600, label: '21600 s', ror: 80.0, minAmount: 10_000_000, maxAmount: 500_000_000 },
];

export default function OptionTradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const symbol = searchParams.get('symbol') || '';
  const price = parseFloat(searchParams.get('price') || '0');
  const change24h = parseFloat(searchParams.get('change24h') || '0');

  const [selectedPeriod, setSelectedPeriod] = useState<OptionPeriod>(OPTION_PERIODS[0]);
  const [amount, setAmount] = useState('0');
  const [balance, setBalance] = useState(0.0);

  // Countdown modal state
  const [showCountdown, setShowCountdown] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState(0);
  const [orderExpectedProfit, setOrderExpectedProfit] = useState(0);

  // Success modal state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successNewBalance, setSuccessNewBalance] = useState(0);
  const [tradeWon, setTradeWon] = useState(false);
  const [tradeProfit, setTradeProfit] = useState(0);

  // Prevent double-completion
  const isCompletingRef = useRef(false);

  const isNegative = change24h < 0;

  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        if (response.success && response.data?.user?.accountBalance !== undefined) {
          setBalance(parseFloat(response.data.user.accountBalance) || 0);
        }
      } catch {}

      // Check for any active order (handles page refresh mid-countdown)
      try {
        const res = await api.get(API_ENDPOINTS.ORDERS.ACTIVE);
        const order = res?.data?.order;
        if (order) {
          const endDate = new Date(order.endDate).getTime();
          const now = Date.now();
          if (now < endDate) {
            // Countdown still running — resume it
            setCurrentOrderId(order.id);
            setOrderAmount(parseFloat(order.amount));
            setOrderExpectedProfit((parseFloat(order.amount) * parseFloat(order.ror)) / 100);
            setShowCountdown(true);
          }
          // If endDate already passed, backend scheduler will complete it and emit socket event
        }
      } catch {}
    };
    init();

    // Listen for backend auto-completion (handles refresh/disconnect case)
    const unsubscribe = chatService.onOrderCompleted((data) => {
      setBalance(data.newBalance);
      setTradeWon(data.isWon);
      setTradeProfit(data.profit);
      setSuccessNewBalance(data.newBalance);
      setShowCountdown(false);
      setCurrentOrderId(null);
      setShowSuccess(true);
    });
    return () => unsubscribe();
  }, []);

  const handleMax = () => {
    const max = Math.min(balance, selectedPeriod.maxAmount);
    setAmount(max.toFixed(2));
  };

  const calculateExpected = () => {
    const amountNum = parseFloat(amount) || 0;
    return (amountNum * selectedPeriod.ror) / 100;
  };

  const calculateFee = () => {
    const amountNum = parseFloat(amount) || 0;
    return amountNum * 0.002;
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (amountNum < selectedPeriod.minAmount) {
      showToast('Amount is insufficient to purchase', 'error');
      return;
    }
    if (amountNum > selectedPeriod.maxAmount) {
      showToast(`Amount exceeds the maximum of ${selectedPeriod.maxAmount.toLocaleString()} for this option`, 'error');
      return;
    }
    if (amountNum > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    try {
      const response = await api.post(API_ENDPOINTS.ORDERS.OPTION, {
        symbol,
        amount: amountNum,
        duration: selectedPeriod.seconds,
        ror: selectedPeriod.ror,
        entryPrice: price,
      });

      if (response.success && response.data?.order?.id) {
        isCompletingRef.current = false;
        setCurrentOrderId(response.data.order.id);
        setOrderAmount(amountNum);
        setOrderExpectedProfit(response.data.order.expectedProfit || calculateExpected());
        setBalance(prev => prev - amountNum);
        setShowCountdown(true);
      } else {
        showToast(response.message || 'Failed to place order', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to place order', 'error');
    }
  };

  const handleCountdownComplete = useCallback(async () => {
    if (!currentOrderId || isCompletingRef.current) return;
    isCompletingRef.current = true;

    try {
      const response = await api.post(API_ENDPOINTS.ORDERS.COMPLETE(currentOrderId));

      const newBalance = response?.data?.newBalance ?? balance;
      const profit = response?.data?.order?.profit ?? 0;
      const won = profit > 0;
      setBalance(newBalance);
      setTradeWon(won);
      setTradeProfit(profit);
      setShowCountdown(false);
      setCurrentOrderId(null);
      setSuccessNewBalance(newBalance);
      setShowSuccess(true);
    } catch {
      setShowCountdown(false);
      setCurrentOrderId(null);
      setSuccessNewBalance(balance);
      setShowSuccess(true);
    }
  }, [currentOrderId, orderExpectedProfit, balance]);

  const handleSuccessDone = () => {
    setShowSuccess(false);
    setShowCountdown(false);
    setCurrentOrderId(null);
    setTimeout(() => {
      router.back();
    }, 150);
  };

  const expectedProfit = calculateExpected();
  const fee = calculateFee();

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end justify-center">
      <div className="w-full max-h-[92%] bg-card rounded-t-2xl pt-5 px-5 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex bg-[#1a1a1a] rounded-lg p-1 gap-1">
            <div className="px-5 py-2 rounded-md bg-[#2a2a2a]">
              <span className="text-sm font-semibold text-text-primary">Option</span>
            </div>
            <button
              className="px-5 py-2 rounded-md"
              onClick={() => {
                const params = new URLSearchParams({ symbol, price: price.toString(), change24h: change24h.toString() });
                router.replace(`/contract-trading?${params.toString()}`);
              }}
            >
              <span className="text-sm font-semibold text-[#888]">Contract</span>
            </button>
          </div>
          <button
            className="w-8 h-8 bg-[#1a1a1a] rounded-md flex items-center justify-center"
            onClick={() => router.back()}
          >
            <X size={18} className="text-text-primary" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pb-10">
          {/* Trading Pair Info */}
          <div className="flex justify-between items-center mb-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-[18px] bg-accent rounded-sm" />
              <span className="text-base font-semibold text-accent">{symbol}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#ff8800]">{price.toFixed(2)}</span>
              <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[#888]">
                  {isNegative ? '\u2193' : '\u2191'}
                </span>
              </div>
            </div>
          </div>

          {/* ROR Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {OPTION_PERIODS.map((period) => {
                const isActive = selectedPeriod.seconds === period.seconds;
                return (
                  <button
                    key={period.seconds}
                    className={`py-4 px-3 rounded-lg bg-[#1a1a1a] text-center border-2 transition ${
                      isActive ? 'border-accent' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    <p className={`text-sm font-semibold mb-1.5 ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                      {period.label}
                    </p>
                    <p className={`text-xs font-medium ${isActive ? 'text-accent' : 'text-[#888]'}`}>
                      ROR:{period.ror.toFixed(2)}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-text-primary mb-2">Amount</p>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 bg-[#1a1a1a] rounded-lg p-4 text-text-primary text-base font-medium outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              <button
                className="bg-[#1a1a1a] px-5 py-4 rounded-lg"
                onClick={handleMax}
              >
                <span className="text-sm font-semibold text-accent">MAX</span>
              </button>
            </div>
            {/* Amount Range */}
            <p className="text-xs text-[#888] mt-2">
              Amount Range:{' '}
              <span className="text-text-primary font-medium">
                {selectedPeriod.minAmount.toLocaleString()} – {selectedPeriod.maxAmount.toLocaleString()}
              </span>
            </p>
            {/* Inline insufficient warning */}
            {parseFloat(amount) > 0 && parseFloat(amount) < selectedPeriod.minAmount && (
              <p className="text-xs text-[#ff4d4d] mt-1">
                Amount is insufficient to purchase. Minimum is {selectedPeriod.minAmount.toLocaleString()}.
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Balance:</span>
              <span className="text-sm font-semibold text-text-primary">{balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Expected:</span>
              <span className="text-sm font-semibold text-accent">+${expectedProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#888]">Fee(Usd):</span>
              <span className="text-sm font-semibold text-text-primary">${fee.toFixed(3)}</span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            className="w-full bg-accent rounded-xl py-4 text-center mt-2 hover:opacity-80 active:opacity-60 transition"
            onClick={handleConfirm}
          >
            <span className="text-base font-bold text-black tracking-wide">confirm</span>
          </button>
        </div>
      </div>

      {/* Countdown Modal */}
      <CountdownModal
        visible={showCountdown}
        duration={selectedPeriod.seconds}
        symbol={symbol}
        amount={orderAmount}
        expectedProfit={orderExpectedProfit}
        ror={selectedPeriod.ror}
        onComplete={handleCountdownComplete}
      />

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/[0.92] z-50 flex items-center justify-center p-5">
          <div className="w-full max-w-[360px] bg-card rounded-3xl p-7 flex flex-col items-center animate-slideUp">
            {/* Checkmark */}
            <div className="w-[88px] h-[88px] rounded-full bg-[rgba(76,175,80,0.15)] flex items-center justify-center mb-5 animate-scaleIn">
              <div className="w-[68px] h-[68px] rounded-full bg-[#4CAF50] flex items-center justify-center">
                <span className="text-white text-4xl font-bold">{'\u2713'}</span>
              </div>
            </div>

            <h3 className="text-[22px] font-bold text-text-primary mb-1">
              {tradeWon ? 'Trade Won!' : 'Trade Complete'}
            </h3>
            <p className="text-base font-semibold text-accent mb-6">{symbol}</p>

            {/* Profit / Loss Card */}
            {tradeWon ? (
              <div className="w-full bg-[rgba(76,175,80,0.1)] rounded-2xl py-[18px] px-5 text-center mb-4 border border-[rgba(76,175,80,0.2)]">
                <p className="text-[13px] text-[#888] mb-1.5">Profit Earned</p>
                <p className="text-[32px] font-bold text-[#4CAF50]">+${tradeProfit.toFixed(2)}</p>
              </div>
            ) : (
              <div className="w-full bg-[rgba(255,77,77,0.1)] rounded-2xl py-[18px] px-5 text-center mb-4 border border-[rgba(255,77,77,0.2)]">
                <p className="text-[13px] text-[#888] mb-1.5">Amount Lost</p>
                <p className="text-[32px] font-bold text-[#ff4d4d]">-${orderAmount.toFixed(2)}</p>
              </div>
            )}

            {/* New Balance */}
            <div className="w-full flex justify-between items-center py-3 px-1">
              <span className="text-sm text-[#888]">New Balance</span>
              <span className="text-lg font-bold text-text-primary">
                ${successNewBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="w-full h-px bg-[#2a2a2a] my-3" />

            {/* Details */}
            <div className="w-full space-y-2.5 mb-6">
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] text-[#666]">Amount Traded</span>
                <span className="text-[13px] font-semibold text-text-primary">${orderAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] text-[#666]">ROR</span>
                <span className="text-[13px] font-semibold text-accent">{selectedPeriod.ror}%</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] text-[#666]">Duration</span>
                <span className="text-[13px] font-semibold text-text-primary">{selectedPeriod.label}</span>
              </div>
            </div>

            {/* Done Button */}
            <button
              className="w-full bg-accent rounded-[14px] py-4 text-center hover:opacity-80 active:opacity-60 transition"
              onClick={handleSuccessDone}
            >
              <span className="text-base font-bold text-black tracking-wide">Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
