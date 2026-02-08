'use client';

import { useState, useEffect, useRef } from 'react';

interface CountdownModalProps {
  visible: boolean;
  duration: number;
  symbol: string;
  amount: number;
  expectedProfit: number;
  ror: number;
  onComplete: () => void;
}

export default function CountdownModal({
  visible,
  duration,
  symbol,
  amount,
  expectedProfit,
  ror,
  onComplete,
}: CountdownModalProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (visible) {
      setTimeLeft(duration);
      setProgress(0);
    }
  }, [visible, duration]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, duration]);

  // Progress animation
  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const totalDuration = duration * 1000;

    const animFrame = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / totalDuration, 1);
      setProgress(pct * 100);
      if (pct < 1) {
        requestAnimationFrame(animFrame);
      }
    };

    const raf = requestAnimationFrame(animFrame);
    return () => cancelAnimationFrame(raf);
  }, [visible, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5">
      <div className="w-full max-w-[360px] bg-card rounded-2xl p-6 flex flex-col items-center">
        {/* Header */}
        <h3 className="text-lg font-semibold text-text-primary mb-2">Option Order Active</h3>
        <p className="text-2xl font-bold text-accent mb-6">{symbol}</p>

        {/* Timer */}
        <div className="text-center mb-5">
          <p className="text-sm text-[#888] mb-2">Time Remaining</p>
          <p className="text-[56px] font-bold text-text-primary tabular-nums leading-none">
            {formatTime(timeLeft)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Order Details */}
        <div className="w-full space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#888]">Amount</span>
            <span className="text-sm font-semibold text-text-primary">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#888]">ROR</span>
            <span className="text-sm font-semibold text-accent">{ror}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#888]">Expected Profit</span>
            <span className="text-base font-bold text-[#4CAF50]">+${expectedProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Status */}
        <p className="text-xs text-[#888] text-center italic">
          Profit will be added when countdown completes...
        </p>
      </div>
    </div>
  );
}
