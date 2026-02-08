'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
  className?: string;
}

export default function Sparkline({
  data,
  width = 80,
  height = 32,
  isPositive,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} />;
  }

  const positive = isPositive ?? data[data.length - 1] >= data[0];
  const strokeColor = positive ? '#81C784' : '#E57373';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
