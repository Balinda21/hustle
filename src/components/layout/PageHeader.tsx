'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, onBack, rightElement, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn('flex items-center h-14 px-4 bg-background', className)}>
      <button
        onClick={onBack || (() => router.back())}
        className="p-2 -ml-2 text-text-primary hover:opacity-80 transition"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="flex-1 text-lg font-semibold text-text-primary text-center mr-8">
        {title}
      </h1>
      {rightElement && <div className="absolute right-4">{rightElement}</div>}
    </div>
  );
}
