'use client';

import { useState } from 'react';
import BrandHeader from '@/components/layout/BrandHeader';
import { CreditCard, ChevronDown, ChevronUp, FileText } from 'lucide-react';

type LoanTermOption = {
  days: string;
  range: string;
};

const LOAN_TERM_OPTIONS: LoanTermOption[] = [
  { days: '15 Days', range: '50000-1000000' },
  { days: '30 Days', range: '50000-1000000' },
  { days: '45 Days', range: '50000-1000000' },
  { days: '60 Days', range: '50000-1000000' },
  { days: '90 Days', range: '50000-1000000' },
];

export default function LoanPage() {
  const [amount, setAmount] = useState('0');
  const [selectedTerm, setSelectedTerm] = useState<LoanTermOption>(LOAN_TERM_OPTIONS[0]);
  const [showTermDropdown, setShowTermDropdown] = useState(false);

  const dailyInterestRate = 0.359;
  const totalInterest = parseFloat(amount) * (dailyInterestRate / 100) * parseInt(selectedTerm.days);

  const handleMaxAmount = () => {
    setAmount('1000000');
  };

  return (
    <div className="overflow-y-auto">
      <BrandHeader />

      <div className="px-4 pb-8">
        {/* Available Amount Card */}
        <div className="bg-card rounded-2xl px-5 py-[18px] mt-2 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-text-primary" />
              <span className="text-base font-medium text-text-primary">Available amount</span>
            </div>
            <div className="w-0.5 h-5 bg-border rounded-sm" />
          </div>
          <div className="flex items-end justify-between mt-1.5">
            <span className="text-3xl font-bold text-text-primary">$10,000.0000</span>
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

        {/* Loan Term */}
        <div className="mb-5">
          <p className="text-sm text-text-muted mb-2">Loan term (Days)</p>
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

        {/* Interest Card */}
        <div className="bg-card rounded-2xl px-5 py-6 mb-6">
          <div className="flex justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm text-text-muted mb-2">Daily interest rate</p>
              <p className="text-lg font-semibold text-text-primary">{dailyInterestRate}%</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-muted mb-2">Total interest amount</p>
              <p className="text-lg font-semibold text-text-primary">${totalInterest.toFixed(2)}</p>
            </div>
          </div>
          <button className="w-full bg-accent rounded-[18px] py-4 text-center hover:opacity-80 active:opacity-60 transition">
            <span className="text-lg font-bold text-background">Borrow now</span>
          </button>
        </div>

        {/* Loan Record */}
        <div className="mt-2">
          <h2 className="text-[22px] font-bold text-text-primary mb-5">Loan record</h2>
          <div className="bg-card rounded-2xl py-16 px-5 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center mb-5">
              <FileText size={40} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No loan yet</h3>
            <p className="text-sm text-text-muted">Could not find your loan information</p>
          </div>
        </div>
      </div>

      {/* Term Dropdown Modal */}
      {showTermDropdown && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowTermDropdown(false)}
        >
          <div className="bg-card rounded-2xl py-2 min-w-[280px] max-h-[400px]" onClick={(e) => e.stopPropagation()}>
            {LOAN_TERM_OPTIONS.map((option, index) => (
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
                <span className="text-sm font-medium text-accent">{option.range}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
