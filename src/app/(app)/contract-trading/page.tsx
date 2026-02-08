'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { X } from 'lucide-react';

export default function ContractTradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const symbol = searchParams.get('symbol') || '';
  const price = parseFloat(searchParams.get('price') || '0');
  const change24h = parseFloat(searchParams.get('change24h') || '0');

  const [leverage, setLeverage] = useState(500);
  const [limitOrder, setLimitOrder] = useState(false);
  const [buyPrice, setBuyPrice] = useState(price.toFixed(2));
  const [buyVolume, setBuyVolume] = useState('0');
  const [profitStopLoss, setProfitStopLoss] = useState(false);

  const calculateRequiredMargin = () => {
    const volume = parseFloat(buyVolume) || 0;
    const priceNum = parseFloat(buyPrice) || 0;
    return (volume * priceNum) / leverage;
  };

  const calculateCommissionFee = () => {
    const volume = parseFloat(buyVolume) || 0;
    const priceNum = parseFloat(buyPrice) || 0;
    return (volume * priceNum) * 0.001;
  };

  const handleVolumeChange = (delta: number) => {
    const current = parseFloat(buyVolume) || 0;
    const newValue = Math.max(0, current + delta);
    setBuyVolume(newValue.toString());
  };

  const handleConfirm = async () => {
    const volume = parseFloat(buyVolume);
    if (volume <= 0) {
      showToast('Please enter a valid volume', 'error');
      return;
    }

    try {
      const response = await api.post(API_ENDPOINTS.ORDERS.CONTRACT, {
        symbol,
        volume,
        leverage,
        buyPrice: parseFloat(buyPrice),
        isLimitOrder: limitOrder,
        hasProfitStopLoss: profitStopLoss,
      });

      if (response.success) {
        showToast('Contract order placed successfully!', 'success');
        router.back();
      } else {
        showToast(response.message || 'Failed to place order', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to place order', 'error');
    }
  };

  const requiredMargin = calculateRequiredMargin();
  const commissionFee = calculateCommissionFee();

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end justify-center">
      <div className="w-full max-h-[90%] overflow-y-auto">
        <div className="bg-card rounded-t-2xl p-5 pb-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 gap-1">
              <button
                className="px-5 py-2 rounded-md"
                onClick={() => {
                  const params = new URLSearchParams({ symbol, price: price.toString(), change24h: change24h.toString() });
                  router.replace(`/option-trading?${params.toString()}`);
                }}
              >
                <span className="text-sm font-semibold text-[#888]">Option</span>
              </button>
              <div className="px-5 py-2 rounded-md bg-[#2a2a2a]">
                <span className="text-sm font-semibold text-text-primary">Contract</span>
              </div>
            </div>
            <button
              className="w-8 h-8 bg-[#1a1a1a] rounded-md flex items-center justify-center"
              onClick={() => router.back()}
            >
              <X size={18} className="text-text-primary" />
            </button>
          </div>

          {/* Leverage Section */}
          <div className="mb-6">
            <p className="text-base font-semibold text-text-primary mb-3">
              Leverage: {leverage.toFixed(2)}X
            </p>
            <div className="relative mb-2">
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-2 bg-[#333] rounded-full appearance-none cursor-pointer accent-accent
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
              />
              {/* Markers */}
              <div className="absolute top-1 left-0 right-0 flex justify-between px-0.5 pointer-events-none">
                {[1, 125, 250, 375, 500].map((val) => (
                  <div
                    key={val}
                    className={`w-2 h-2 rounded-full ${leverage >= val ? 'bg-accent' : 'bg-[#333]'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between px-1">
              {['1X', '125X', '250X', '375X', '500X'].map((label) => (
                <span key={label} className="text-xs text-[#888]">{label}</span>
              ))}
            </div>
          </div>

          {/* Limit Order Toggle */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-semibold text-text-primary">Limit Order</span>
            <button
              className={`w-11 h-6 rounded-full transition-colors relative ${limitOrder ? 'bg-accent' : 'bg-[#333]'}`}
              onClick={() => setLimitOrder(!limitOrder)}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  limitOrder ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Buy Price Input */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-text-primary mb-2">Buy Price</p>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 bg-[#1a1a1a] rounded-lg p-4 text-text-primary text-base outline-none"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
              />
              <div className="bg-accent px-4 py-4 rounded-lg flex items-center">
                <span className="text-sm font-bold text-black">{symbol}</span>
              </div>
            </div>
          </div>

          {/* Buy Volume Input */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-text-primary mb-2">Buy Volume</p>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 bg-[#1a1a1a] rounded-lg p-4 text-text-primary text-base outline-none"
                value={buyVolume}
                onChange={(e) => setBuyVolume(e.target.value)}
                placeholder="0"
              />
              <div className="flex gap-2">
                <button
                  className="bg-[#1a1a1a] px-4 py-4 rounded-lg hover:opacity-80 active:opacity-60 transition"
                  onClick={() => handleVolumeChange(-10)}
                >
                  <span className="text-sm font-semibold text-text-primary">-10</span>
                </button>
                <button
                  className="bg-[#1a1a1a] px-4 py-4 rounded-lg hover:opacity-80 active:opacity-60 transition"
                  onClick={() => handleVolumeChange(10)}
                >
                  <span className="text-sm font-semibold text-text-primary">+10</span>
                </button>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="flex justify-between mb-6 py-3">
            <div className="flex-1">
              <p className="text-sm text-[#888] mb-1">Required Margin:</p>
              <p className="text-sm font-semibold text-text-primary">${requiredMargin.toFixed(2)}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#888] mb-1">Commission Fee:</p>
              <p className="text-sm font-semibold text-text-primary">${commissionFee.toFixed(2)}</p>
            </div>
          </div>

          {/* Set Profit and Stop Loss Toggle */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-semibold text-text-primary">Set Profit and Stop Loss</span>
            <button
              className={`w-11 h-6 rounded-full transition-colors relative ${profitStopLoss ? 'bg-accent' : 'bg-[#333]'}`}
              onClick={() => setProfitStopLoss(!profitStopLoss)}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  profitStopLoss ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            className="w-full bg-accent rounded-xl py-4 text-center hover:opacity-80 active:opacity-60 transition"
            onClick={handleConfirm}
          >
            <span className="text-base font-bold text-black tracking-wide">confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
