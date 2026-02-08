'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sparkline from '@/components/charts/Sparkline';
import SkeletonList from '@/components/market/SkeletonList';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

type MarketPair = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image?: string;
  flag1?: string;
  flag2?: string;
};

type TabType = 'Crypto' | 'Futures' | 'Forex' | 'US stock' | 'ETF';

const FUTURES_PAIRS: MarketPair[] = [
  { id: 'wti', symbol: 'WTI', name: 'West Texas Oil', price: 65.75, change24h: -23.48 },
  { id: 'brent', symbol: 'BRENT', name: 'Brent Crude Oil', price: 69.77, change24h: -23.29 },
  { id: 'ng', symbol: 'NG', name: 'Natural Gas', price: 4.48, change24h: 152.82 },
  { id: 'ho', symbol: 'HO', name: 'Heating Oil', price: 2.46, change24h: -8.75 },
  { id: 'rbob', symbol: 'RBOB', name: 'Gasoline', price: 2.05, change24h: -26.21 },
  { id: 'gc', symbol: 'GC', name: 'Gold', price: 4886.83, change24h: 106.25 },
  { id: 'xpt', symbol: 'XPT', name: 'Platinum', price: 83.94, change24h: 197.66 },
  { id: 'hg', symbol: 'HG', name: 'Copper', price: 595.14, change24h: 36.74 },
];

const FOREX_PAIRS: MarketPair[] = [
  { id: 'usdcnh', symbol: 'USD/CNH', name: 'China', price: 6.9576, change24h: -4.47, flag1: 'https://flagcdn.com/w80/us.png', flag2: 'https://flagcdn.com/w80/cn.png' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'Japan', price: 154.6285, change24h: -0.98, flag1: 'https://flagcdn.com/w80/us.png', flag2: 'https://flagcdn.com/w80/jp.png' },
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Us Dollar', price: 1.1832, change24h: 13.61, flag1: 'https://flagcdn.com/w80/eu.png', flag2: 'https://flagcdn.com/w80/us.png' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'Switzerland', price: 0.7726, change24h: -14.76, flag1: 'https://flagcdn.com/w80/us.png', flag2: 'https://flagcdn.com/w80/ch.png' },
  { id: 'usdhkd', symbol: 'USD/HKD', name: 'USDHKD', price: 7.8097, change24h: 0.02, flag1: 'https://flagcdn.com/w80/us.png', flag2: 'https://flagcdn.com/w80/hk.png' },
  { id: 'usdsgd', symbol: 'USD/SGD', name: 'USDSGD', price: 1.2680, change24h: -6.48, flag1: 'https://flagcdn.com/w80/us.png', flag2: 'https://flagcdn.com/w80/sg.png' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'Us Dollar', price: 1.3674, change24h: 10.72, flag1: 'https://flagcdn.com/w80/gb.png', flag2: 'https://flagcdn.com/w80/us.png' },
  { id: 'hkdcny', symbol: 'HKD/CNY', name: 'Chinaese', price: 0.8925, change24h: -4.38, flag1: 'https://flagcdn.com/w80/hk.png', flag2: 'https://flagcdn.com/w80/cn.png' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australia', price: 0.6750, change24h: -1.20, flag1: 'https://flagcdn.com/w80/au.png', flag2: 'https://flagcdn.com/w80/us.png' },
];

const US_STOCKS: MarketPair[] = [
  { id: 'sohu', symbol: 'Sohu.com Ltd', name: 'SOHU', price: 15.420, change24h: 0.52, image: 'https://logo.clearbit.com/sohu.com' },
  { id: 'alphabet', symbol: 'Alphabet', name: 'GOOGL', price: 320.180, change24h: -0.98, image: 'https://logo.clearbit.com/google.com' },
  { id: 'microsoft', symbol: 'Microsoft', name: 'MSFT', price: 492.010, change24h: 0.91, image: 'https://logo.clearbit.com/microsoft.com' },
  { id: 'apple', symbol: 'Apple Inc', name: 'AAPL', price: 278.850, change24h: 0.57, image: 'https://logo.clearbit.com/apple.com' },
  { id: 'netease', symbol: 'NetEase Inc', name: 'NTES', price: 138.050, change24h: 0.20, image: 'https://logo.clearbit.com/netease.com' },
  { id: 'toyota', symbol: 'Toyota Motor', name: 'TM', price: 201.870, change24h: 0.90, image: 'https://logo.clearbit.com/toyota.com' },
  { id: 'amazon', symbol: 'Amazon.com', name: 'AMZN', price: 233.220, change24h: 0.86, image: 'https://logo.clearbit.com/amazon.com' },
  { id: 'berkshire', symbol: 'Berkshire Hathaway', name: 'BRK.A', price: 770100.000, change24h: 0.34, image: 'https://logo.clearbit.com/berkshirehathaway.com' },
  { id: 'nvidia', symbol: 'NVIDIA Corp', name: 'NVDA', price: 125.50, change24h: 1.25, image: 'https://logo.clearbit.com/nvidia.com' },
];

const ETF_PAIRS: MarketPair[] = [
  { id: 'spy', symbol: 'SPY', name: 'SPDR S&P 500', price: 485.32, change24h: 0.85, image: 'https://logo.clearbit.com/ssga.com' },
  { id: 'qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 432.18, change24h: 1.12, image: 'https://logo.clearbit.com/invesco.com' },
  { id: 'vti', symbol: 'VTI', name: 'Vanguard Total Stock', price: 258.45, change24h: 0.67, image: 'https://logo.clearbit.com/vanguard.com' },
  { id: 'voo', symbol: 'VOO', name: 'Vanguard S&P 500', price: 485.78, change24h: 0.82, image: 'https://logo.clearbit.com/vanguard.com' },
  { id: 'iwm', symbol: 'IWM', name: 'iShares Russell 2000', price: 198.23, change24h: -0.45, image: 'https://logo.clearbit.com/ishares.com' },
  { id: 'dia', symbol: 'DIA', name: 'SPDR Dow Jones', price: 382.56, change24h: 0.34, image: 'https://logo.clearbit.com/ssga.com' },
  { id: 'schw', symbol: 'SCHW', name: 'Schwab US Large-Cap', price: 78.90, change24h: 0.56, image: 'https://logo.clearbit.com/schwab.com' },
  { id: 'arkk', symbol: 'ARKK', name: 'ARK Innovation ETF', price: 52.34, change24h: 2.15, image: 'https://logo.clearbit.com/ark-invest.com' },
  { id: 'xlk', symbol: 'XLK', name: 'Technology Select', price: 198.67, change24h: 1.45, image: 'https://logo.clearbit.com/ssga.com' },
];

function DualFlag({ flag1, flag2 }: { flag1: string; flag2: string }) {
  return (
    <div className="relative w-11 h-11">
      <div className="absolute top-0 left-0 w-8 h-8 rounded-full overflow-hidden bg-[#2A2A2A] border-2 border-card z-[2]">
        <img src={flag1} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full overflow-hidden bg-[#2A2A2A] border-2 border-card z-[1]">
        <img src={flag2} alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

export default function MarketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Crypto');
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [pairHistory, setPairHistory] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  const tabs: TabType[] = ['Crypto', 'Futures', 'Forex', 'US stock', 'ETF'];

  useEffect(() => {
    const fetchCryptoData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,cardano,polkadot,dogecoin,ripple,tron,litecoin,filecoin&price_change_percentage=24h&sparkline=true'
        );
        const json = await res.json();
        if (Array.isArray(json)) {
          const byId: Record<string, any> = {};
          json.forEach((item: any) => { if (item?.id) byId[item.id] = item; });

          const desiredOrder = ['bitcoin', 'ethereum', 'litecoin', 'polkadot', 'filecoin', 'dogecoin', 'ripple', 'tron', 'binancecoin', 'solana', 'cardano'];
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
          }).filter(Boolean) as MarketPair[]);

          const newHistory: Record<string, number[]> = {};
          desiredOrder.forEach((id) => {
            const item = byId[id];
            if (item?.sparkline_in_7d?.price) {
              newHistory[id] = item.sparkline_in_7d.price.slice(-50);
            }
          });
          setPairHistory(newHistory);
        }
      } catch {
        // Keep skeleton
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'Crypto') {
      fetchCryptoData();
    } else if (activeTab === 'Futures') {
      setPairs(FUTURES_PAIRS);
      setPairHistory({});
      setLoading(false);
    } else if (activeTab === 'Forex') {
      setPairs(FOREX_PAIRS);
      setPairHistory({});
      setLoading(false);
    } else if (activeTab === 'US stock') {
      setPairs(US_STOCKS);
      setPairHistory({});
      setLoading(false);
    } else if (activeTab === 'ETF') {
      setPairs(ETF_PAIRS);
      setPairHistory({});
      setLoading(false);
    }
  }, [activeTab]);

  // Auto-refresh crypto every 30s
  useEffect(() => {
    if (activeTab !== 'Crypto') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,cardano,polkadot,dogecoin,ripple,tron,litecoin,filecoin&price_change_percentage=24h&sparkline=true'
        );
        const json = await res.json();
        if (Array.isArray(json)) {
          const byId: Record<string, any> = {};
          json.forEach((item: any) => { if (item?.id) byId[item.id] = item; });
          const desiredOrder = ['bitcoin', 'ethereum', 'litecoin', 'polkadot', 'filecoin', 'dogecoin', 'ripple', 'tron', 'binancecoin', 'solana', 'cardano'];
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
          }).filter(Boolean) as MarketPair[]);
          const newHistory: Record<string, number[]> = {};
          desiredOrder.forEach((id) => {
            const item = byId[id];
            if (item?.sparkline_in_7d?.price) {
              newHistory[id] = item.sparkline_in_7d.price.slice(-50);
            }
          });
          setPairHistory(newHistory);
        }
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const renderIcon = (item: MarketPair) => {
    if (activeTab === 'Forex' && item.flag1 && item.flag2) {
      return <DualFlag flag1={item.flag1} flag2={item.flag2} />;
    }
    if (activeTab === 'Futures' || activeTab === 'US stock' || activeTab === 'ETF') return null;
    if (item.image) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2A2A2A]">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-4 pt-4">
        <h1 className="text-[28px] font-bold text-text-primary mb-5">Market</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                'px-5 py-2.5 rounded-full text-[15px] font-medium whitespace-nowrap transition',
                activeTab === tab
                  ? 'bg-[#2A2A2A] text-white font-semibold'
                  : 'text-[#888]'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Market List */}
      <div className="flex-1 mx-4 mb-4 bg-card rounded-2xl overflow-hidden min-h-0">
        {loading ? (
          <SkeletonList />
        ) : (
          <div className="overflow-y-auto h-full">
            {pairs.map((item, index) => {
              const isNegative = item.change24h < 0;
              const changeColor = isNegative ? 'text-[#E57373]' : 'text-[#81C784]';
              const history = pairHistory[item.id] || [];
              const displaySymbol = activeTab === 'US stock' ? item.name : item.symbol;
              const displayName = activeTab === 'US stock' ? item.symbol : item.name;
              const hasIcon = activeTab === 'Forex' ? !!(item.flag1 && item.flag2) : activeTab === 'Crypto' && !!item.image;

              return (
                <div key={item.id}>
                  <button
                    className="w-full flex items-center py-3 px-4 hover:bg-white/5 transition"
                    onClick={() => {
                      router.push(`/chart?symbolId=${item.id}&displaySymbol=${encodeURIComponent(displaySymbol)}&price=${item.price}&change24h=${item.change24h}`);
                    }}
                  >
                    <div className="flex items-center flex-1 min-w-[100px]">
                      {renderIcon(item)}
                      <div className={hasIcon ? 'ml-3' : ''}>
                        <p className="text-[15px] font-semibold text-text-primary text-left">{displaySymbol}</p>
                        <p className="text-xs text-[#666] mt-0.5 text-left">{displayName}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex justify-center mx-2">
                      <Sparkline data={history} width={100} height={40} />
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-[15px] font-semibold text-text-primary">{formatPrice(item.price, activeTab)}</p>
                      <p className={cn('text-[13px] font-medium mt-0.5', changeColor)}>
                        {isNegative ? '' : '+'}{item.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                  {index < pairs.length - 1 && <div className="h-px bg-[#2A2A2A] mx-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
