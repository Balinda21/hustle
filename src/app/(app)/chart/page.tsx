'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { marketDataService, CandleData, PriceUpdate } from '@/services/marketDataService';
import { ArrowLeft, Star, ChevronUp, ChevronDown } from 'lucide-react';

type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '1D';

const CHART_HEIGHT = 200;
const VOLUME_HEIGHT = 60;

export default function ChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const symbolId = searchParams.get('symbolId') || '';
  const displaySymbol = searchParams.get('displaySymbol') || searchParams.get('symbol') || '';
  const fetchSymbol = displaySymbol || symbolId;
  const initialPrice = parseFloat(searchParams.get('price') || '0');
  const initialChange = parseFloat(searchParams.get('change24h') || '0');

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m');
  const [isFavorited, setIsFavorited] = useState(false);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [currentChange24h, setCurrentChange24h] = useState(initialChange);
  const [currentHigh, setCurrentHigh] = useState(initialPrice);
  const [currentLow, setCurrentLow] = useState(initialPrice);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(300);

  const isNegative = currentChange24h < 0;
  const changeColor = isNegative ? 'text-[#cf7635]' : 'text-[#c0dd2c]';
  const changeText = isNegative ? '' : '+';
  const upColor = '#c0dd2c';
  const downColor = '#cf7635';

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1H', '1D'];

  // Measure container width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.offsetWidth - 76); // subtract right labels width
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Price range
  const minPrice = chartData.length > 0
    ? Math.min(...chartData.map(d => d.low))
    : currentPrice * 0.99;
  const maxPrice = chartData.length > 0
    ? Math.max(...chartData.map(d => d.high))
    : currentPrice * 1.01;
  const priceRange = maxPrice - minPrice || 0.01;

  const handleUpPress = () => {
    const params = new URLSearchParams({
      symbol: displaySymbol || fetchSymbol,
      price: currentPrice.toString(),
      change24h: currentChange24h.toString(),
      direction: 'up',
    });
    router.push(`/option-trading?${params.toString()}`);
  };

  const handleDownPress = () => {
    const params = new URLSearchParams({
      symbol: displaySymbol || fetchSymbol,
      price: currentPrice.toString(),
      change24h: currentChange24h.toString(),
      direction: 'down',
    });
    router.push(`/option-trading?${params.toString()}`);
  };

  // Load data and connect WebSocket
  useEffect(() => {
    if (!fetchSymbol) return;
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const candles = await marketDataService.fetchCandles(fetchSymbol, selectedTimeframe, 100);
        if (isMounted) {
          setChartData(candles);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    const connectTimeout = setTimeout(() => {
      if (!isMounted) return;

      marketDataService.connectPriceStream(fetchSymbol, (update: PriceUpdate) => {
        if (isMounted) {
          setCurrentPrice(update.price);
          setCurrentChange24h(update.change24h);
          setCurrentHigh(update.high24h);
          setCurrentLow(update.low24h);
        }
      });

      marketDataService.connectCandleStream(fetchSymbol, selectedTimeframe, (newCandle: CandleData) => {
        if (isMounted) {
          setChartData((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastCandle = updated[updated.length - 1];
            if (lastCandle && lastCandle.time === newCandle.time) {
              updated[updated.length - 1] = newCandle;
            } else {
              updated.push(newCandle);
              return updated.slice(-100);
            }
            return updated;
          });
        }
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(connectTimeout);
      marketDataService.disconnect();
    };
  }, [fetchSymbol, selectedTimeframe]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <button className="w-10 h-10 flex items-start justify-center" onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <span className="text-lg font-bold text-text-primary">{displaySymbol || fetchSymbol}</span>
        <button
          className="w-10 h-10 flex items-end justify-center"
          onClick={() => setIsFavorited(!isFavorited)}
        >
          <Star
            size={24}
            className={isFavorited ? 'text-accent fill-accent' : 'text-text-primary'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Price Card */}
        <div className="flex justify-between p-4 m-4 bg-card rounded-xl">
          <div className="flex items-center flex-1">
            <div className="w-1 h-[50px] bg-[#c0dd2c] rounded-sm mr-3" />
            <div className="flex-1">
              <p className="text-[32px] font-bold text-text-primary mb-1">{currentPrice.toFixed(2)}</p>
              <div className="flex items-center gap-1">
                <span className={`text-base font-semibold ${changeColor}`}>
                  {changeText}{currentChange24h.toFixed(2)}%
                </span>
                <div className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  {isNegative ? (
                    <ChevronDown size={12} className="text-[#888]" />
                  ) : (
                    <ChevronUp size={12} className="text-[#888]" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-text-muted mb-0.5">Open</p>
              <p className="text-sm font-semibold text-text-primary">
                {chartData.length > 0 ? chartData[0].open.toFixed(2) : currentPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted mb-0.5">LOW</p>
              <p className="text-sm font-semibold text-text-primary">{currentLow.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted mb-0.5">High</p>
              <p className="text-sm font-semibold text-text-primary">{currentHigh.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted mb-0.5">Close</p>
              <p className="text-sm font-semibold text-text-primary">
                {chartData.length > 0 ? chartData[chartData.length - 1].close.toFixed(2) : currentPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selection */}
        <div className="flex px-4 mb-4 gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedTimeframe === tf
                  ? 'bg-card text-text-primary font-bold'
                  : 'text-text-muted'
              }`}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div ref={containerRef} className="relative mx-4 mb-4" style={{ height: CHART_HEIGHT + 50 }}>
          {/* Candlestick Chart */}
          <div className="relative mr-[60px]" style={{ height: CHART_HEIGHT }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-text-muted">Loading chart data...</span>
              </div>
            ) : (
              <>
                {/* Grid Lines */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 h-px bg-[#cf7635] opacity-60"
                    style={{ top: (CHART_HEIGHT / 8) * i }}
                  />
                ))}

                {/* Candlesticks */}
                <div className="relative" style={{ height: CHART_HEIGHT }}>
                  {chartData.map((candle, index) => {
                    const isUp = candle.close >= candle.open;
                    const bodyTop = Math.max(candle.open, candle.close);
                    const bodyBottom = Math.min(candle.open, candle.close);

                    const wickTopY = CHART_HEIGHT - ((candle.high - minPrice) / priceRange) * CHART_HEIGHT;
                    const wickBottomY = CHART_HEIGHT - ((candle.low - minPrice) / priceRange) * CHART_HEIGHT;
                    const bodyTopY = CHART_HEIGHT - ((bodyTop - minPrice) / priceRange) * CHART_HEIGHT;
                    const bodyBottomY = CHART_HEIGHT - ((bodyBottom - minPrice) / priceRange) * CHART_HEIGHT;

                    const candleWidth = Math.max(6, (chartWidth / chartData.length) - 1);
                    const x = (index * chartWidth) / chartData.length;
                    const bodyWidth = Math.max(4, candleWidth * 0.7);
                    const color = isUp ? upColor : downColor;

                    return (
                      <div key={index} className="absolute" style={{ left: x, width: candleWidth }}>
                        {/* Wick */}
                        <div
                          className="absolute"
                          style={{
                            top: wickTopY,
                            height: Math.max(1, wickBottomY - wickTopY),
                            width: 1.5,
                            left: candleWidth / 2 - 0.75,
                            backgroundColor: color,
                          }}
                        />
                        {/* Body */}
                        <div
                          className="absolute"
                          style={{
                            top: bodyTopY,
                            height: Math.max(2, bodyBottomY - bodyTopY),
                            width: bodyWidth,
                            left: (candleWidth - bodyWidth) / 2,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Price Labels Right */}
          {chartData.length > 0 && (
            <div className="absolute right-0 top-0" style={{ height: CHART_HEIGHT, width: 60 }}>
              {Array.from({ length: 9 }).map((_, i) => {
                const priceStep = priceRange / 8;
                const labelPrice = maxPrice - priceStep * i;
                const yPosition = (i / 8) * CHART_HEIGHT;
                return (
                  <div
                    key={i}
                    className="absolute right-0 text-right h-4 flex items-center justify-end"
                    style={{ top: yPosition - 8 }}
                  >
                    <span className="text-xs text-text-muted font-medium">
                      {labelPrice.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Price Line */}
          {chartData.length > 0 && (
            <div
              className="absolute left-0 h-0.5 bg-[#c0dd2c] z-[5]"
              style={{ top: CHART_HEIGHT - 1, right: 60 }}
            >
              <span className="text-[11px] text-[#c0dd2c] font-semibold absolute right-2 -top-[10px] bg-background px-1">
                {currentPrice.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        {!isLoading && chartData.length > 0 && (
          <div className="relative mx-4 mb-4 mr-[76px]" style={{ height: VOLUME_HEIGHT }}>
            {chartData.map((candle, index) => {
              const isUp = candle.close >= candle.open;
              const maxVolume = Math.max(...chartData.map(d => d.volume));
              const barHeight = maxVolume > 0 ? (candle.volume / maxVolume) * VOLUME_HEIGHT : 0;
              const barWidth = Math.max(2, chartWidth / chartData.length - 2);
              const x = (index * chartWidth) / chartData.length;
              return (
                <div
                  key={index}
                  className="absolute bottom-0"
                  style={{
                    left: x,
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: isUp ? upColor : downColor,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-4 pb-4">
        <button
          className="flex-1 py-[18px] rounded-xl bg-[#c0dd2c] text-center hover:opacity-80 active:opacity-60 transition"
          onClick={handleUpPress}
        >
          <span className="text-lg font-bold text-black">Up</span>
        </button>
        <button
          className="flex-1 py-[18px] rounded-xl bg-[#cf7635] text-center hover:opacity-80 active:opacity-60 transition"
          onClick={handleDownPress}
        >
          <span className="text-lg font-bold text-black">Down</span>
        </button>
      </div>
    </div>
  );
}
