'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { formatBalance } from '@/lib/utils';
import { ShieldCheck, Banknote, Code, ChevronDown, ChevronUp } from 'lucide-react';

type TermOption = {
  days: string;
  ror: string;
};

const TERM_OPTIONS: TermOption[] = [
  { days: '1 Days', ror: '0.65-0.80%' },
  { days: '5 Days', ror: '0.80-1.00%' },
  { days: '30 Days', ror: '1.00-1.50%' },
  { days: '90 Days', ror: '1.50-2.00%' },
  { days: '120 Days', ror: '2.00-3.50%' },
];

export default function AIQuantificationPage() {
  const { showToast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<TermOption>(TERM_OPTIONS[0]);
  const [amount, setAmount] = useState('0');
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        if (response.success && response.data?.user?.accountBalance !== undefined) {
          setBalance(parseFloat(response.data.user.accountBalance) || 0);
        }
      } catch {
        // Silently fail
      }
    };
    fetchBalance();
  }, []);

  const handleMaxAmount = () => {
    const maxAllowed = Math.min(balance, 18000);
    setAmount(maxAllowed.toFixed(2));
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);
    if (amountNum < 1000) {
      showToast('Minimum amount is $1000', 'error');
      return;
    }
    if (amountNum > 18000) {
      showToast('Maximum amount is $18000', 'error');
      return;
    }
    if (amountNum > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.ORDERS.AI_QUANTIFICATION, {
        amount: amountNum,
        termDays: parseInt(selectedTerm.days),
        ror: selectedTerm.ror,
      });

      if (response.success) {
        showToast('AI Quantification order created successfully!', 'success');
        setAmount('0');
        const balanceResponse = await api.get(API_ENDPOINTS.AUTH.ME);
        if (balanceResponse.success && balanceResponse.data?.user?.accountBalance !== undefined) {
          setBalance(parseFloat(balanceResponse.data.user.accountBalance) || 0);
        }
      } else {
        showToast(response.message || 'Failed to create order', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-y-auto">
      <div className="px-4 pt-4 pb-8">
        <h1 className="text-[28px] font-bold text-text-primary mb-6">AI Quantitative Trading</h1>

        {/* Amount Card */}
        <div className="bg-card rounded-2xl px-5 py-[18px] mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-[22px] h-4 rounded bg-[#202020] flex items-center px-1">
                <div className="h-0.5 rounded-sm bg-text-primary w-[60%]" />
              </div>
              <span className="text-base font-medium text-text-primary">AI Quantification Amount</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-1.5">
            <span className="text-3xl font-bold text-text-primary">${formatBalance(balance)}</span>
            <span className="text-base font-semibold text-accent">0.00%</span>
          </div>
          <div className="h-px bg-border my-3.5" />
          <div className="flex justify-between">
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">Today&apos;s Earnings</p>
              <p className="text-sm font-medium text-text-primary">$0.0000</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">Total revenue</p>
              <p className="text-sm font-medium text-text-primary">$0.0000</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 bg-card rounded-2xl py-5 px-3 flex flex-col items-center">
            <ShieldCheck size={32} className="text-accent mb-2" />
            <span className="text-xs font-medium text-text-primary text-center">Financial security</span>
          </div>
          <div className="flex-1 bg-card rounded-2xl py-5 px-3 flex flex-col items-center">
            <Banknote size={32} className="text-accent mb-2" />
            <span className="text-xs font-medium text-text-primary text-center">Stable income</span>
          </div>
          <div className="flex-1 bg-card rounded-2xl py-5 px-3 flex flex-col items-center">
            <Code size={32} className="text-accent mb-2" />
            <span className="text-xs font-medium text-text-primary text-center">Easy to use</span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-wrap mb-8">
          <span className="text-sm text-text-muted flex-1">
            Automated trading is a method of automatically executing trading strategi
          </span>
          <span className="text-sm font-medium text-accent">Explore more</span>
        </div>

        {/* Create Section */}
        <div className="bg-card rounded-2xl px-5 py-6 mt-6">
          <h2 className="text-[22px] font-bold text-text-primary mb-6">Create</h2>

          {/* Term Selection */}
          <div className="mb-5">
            <p className="text-sm text-text-muted mb-2">The term</p>
            <button
              className={`w-full flex items-center justify-between bg-[#1a1a1a] rounded-xl px-4 py-3.5 border ${
                showTermDropdown ? 'border-accent' : 'border-border'
              }`}
              onClick={() => setShowTermDropdown(!showTermDropdown)}
            >
              <span className="text-base font-medium text-text-primary">{selectedTerm.days}</span>
              {showTermDropdown ? (
                <ChevronUp size={20} className="text-text-primary" />
              ) : (
                <ChevronDown size={20} className="text-text-primary" />
              )}
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-5">
            <p className="text-sm text-text-muted mb-2">Amount</p>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 bg-[#1a1a1a] rounded-xl px-4 py-3.5 text-text-primary text-base font-medium outline-none border border-border"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              <button
                className="bg-[#1a1a1a] rounded-xl px-5 py-3.5 border border-border"
                onClick={handleMaxAmount}
              >
                <span className="text-sm font-semibold text-text-primary">MAX</span>
              </button>
            </div>
          </div>

          {/* ROR & Limited */}
          <div className="flex justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm text-text-muted mb-1">ROR</p>
              <p className="text-base font-semibold text-text-primary">{selectedTerm.ror}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-muted mb-1">Limited</p>
              <p className="text-base font-semibold text-text-primary">1000-18000</p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            className={`w-full bg-accent rounded-[18px] py-4 text-center hover:opacity-80 active:opacity-60 transition ${
              loading ? 'opacity-60' : ''
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            <span className="text-lg font-bold text-background">
              {loading ? 'Processing...' : 'Confirm'}
            </span>
          </button>
        </div>
      </div>

      {/* Term Dropdown Modal */}
      {showTermDropdown && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowTermDropdown(false)}
        >
          <div className="bg-card rounded-2xl py-2 min-w-[280px] max-h-[400px]" onClick={(e) => e.stopPropagation()}>
            {TERM_OPTIONS.map((option, index) => (
              <button
                key={index}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-border last:border-b-0 ${
                  selectedTerm.days === option.days ? 'bg-[#1a1a1a]' : ''
                }`}
                onClick={() => {
                  setSelectedTerm(option);
                  setShowTermDropdown(false);
                }}
              >
                <span className="text-base font-medium text-text-primary">{option.days}</span>
                <span className="text-sm font-medium text-accent">{option.ror}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
