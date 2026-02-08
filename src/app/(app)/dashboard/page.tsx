'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { chatService } from '@/services/chatService';
import BrandHeader from '@/components/layout/BrandHeader';
import Sparkline from '@/components/charts/Sparkline';
import { CreditCard, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import { formatBalance } from '@/lib/utils';

type PairRow = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image: string;
};

type MiniAsset = {
  id: string;
  symbol: string;
  label: string;
  subtitle: string;
  change24h: number;
  image: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { updateUserBalance } = useAuth();
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [miniAssets, setMiniAssets] = useState<MiniAsset[]>([]);
  const [pairHistory, setPairHistory] = useState<Record<string, number[]>>({});
  const [accountBalance, setAccountBalance] = useState(0);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
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
  }, [updateUserBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Listen for real-time balance updates
  useEffect(() => {
    const unsubscribe = chatService.onBalanceUpdated((data) => {
      const newBalance = parseFloat(data.accountBalance) || 0;
      setAccountBalance(newBalance);
      updateUserBalance(newBalance);
    });
    return () => { unsubscribe(); };
  }, [updateUserBalance]);

  // Fetch market data
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,filecoin,litecoin,polkadot,dogecoin,ripple,tron&price_change_percentage=24h&sparkline=true'
        );
        const json = await res.json();
        if (Array.isArray(json)) {
          const byId: Record<string, any> = {};
          json.forEach((item: any) => { if (item?.id) byId[item.id] = item; });

          const miniIds = ['bitcoin', 'ethereum', 'filecoin'];
          setMiniAssets(miniIds.map((id) => {
            const item = byId[id];
            if (!item) return null;
            return {
              id: item.id,
              symbol: `${item.symbol.toUpperCase()}/USD`,
              label: `${item.symbol.toUpperCase()}/USD`,
              subtitle: item.name,
              change24h: item.price_change_percentage_24h_in_currency ?? 0,
              image: item.image || '',
            };
          }).filter(Boolean) as MiniAsset[]);

          const desiredOrder = ['litecoin', 'polkadot', 'dogecoin', 'ripple', 'tron'];
          setPairs(desiredOrder.map((id) => {
            const item = byId[id];
            if (!item) return null;
            return {
              id: item.id,
              symbol: `${item.symbol.toUpperCase()}/USD`,
              name: item.name,
              price: item.current_price ?? 0,
              change24h: item.price_change_percentage_24h_in_currency ?? 0,
              image: item.image || '',
            };
          }).filter(Boolean) as PairRow[]);

          const newHistory: Record<string, number[]> = {};
          [...miniIds, ...desiredOrder].forEach((id) => {
            const item = byId[id];
            if (item?.sparkline_in_7d?.price) {
              newHistory[id] = item.sparkline_in_7d.price.slice(-50);
            }
          });
          setPairHistory(newHistory);
        }
      } catch {
        // Ignore
      }
    };

    fetchMarket();
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-y-auto">
      <BrandHeader />

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

        {/* Mini Cards */}
        <div className="flex gap-2 mt-4">
          {miniAssets.map((asset) => {
            const isPositive = asset.change24h >= 0;
            const history = pairHistory[asset.id] || [];
            return (
              <div key={asset.id} className="flex-1 bg-card-alt rounded-2xl py-3.5 px-3">
                <p className="text-sm font-semibold text-text-primary mb-1">{asset.label}</p>
                <p className="text-xs text-text-muted mb-1">{asset.subtitle}</p>
                <div className="flex justify-center my-1.5">
                  <Sparkline data={history} width={60} height={24} isPositive={isPositive} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-sm font-semibold ${isPositive ? 'text-accent' : 'text-[#E57373]'}`}>
                    {asset.change24h.toFixed(2)}%
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPositive ? 'bg-accent/10' : 'bg-[#E57373]/10'}`}>
                    {isPositive ? <TrendingUp size={14} className="text-accent" /> : <TrendingDown size={14} className="text-[#E57373]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Market Section */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Market</h2>
          <button className="text-sm text-text-secondary" onClick={() => router.push('/market')}>See more</button>
        </div>

        <div className="bg-card rounded-2xl px-4 py-3">
          {pairs.map((item, index) => {
            const isNegative = item.change24h < 0;
            const changeColor = isNegative ? 'text-[#E57373]' : 'text-[#81C784]';
            const history = pairHistory[item.id] || [];
            return (
              <div key={item.id}>
                <div className="flex items-center py-2.5">
                  <div className="flex items-center flex-[1.2]">
                    {item.image && (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-card mr-3">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.symbol}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <Sparkline data={history} width={80} height={32} isPositive={!isNegative} />
                  </div>
                  <div className="flex-[0.7] text-right">
                    <p className="text-sm font-semibold text-text-primary">{item.price.toFixed(4)}</p>
                    <p className={`text-xs mt-0.5 ${changeColor}`}>
                      {isNegative ? '' : '+'}{item.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
                {index < pairs.length - 1 && <div className="h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* AI Card */}
        <div className="mt-6 bg-[#181818] rounded-3xl px-5 py-6 flex flex-col items-center">
          <div className="text-4xl mb-4">⚛️</div>
          <p className="text-sm text-text-muted mb-1.5">Easy to use</p>
          <p className="text-[22px] font-semibold text-text-primary text-center">AI Quantitative Trading</p>
          <p className="text-[13px] text-text-muted mt-1.5 mb-5">Safe / Stable / Simple</p>
          <button
            className="bg-accent rounded-2xl py-3 px-6 flex items-center gap-2"
            onClick={() => router.push('/ai-quantification')}
          >
            <PlusCircle size={18} className="text-background" />
            <span className="text-base font-semibold text-background">Create Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
