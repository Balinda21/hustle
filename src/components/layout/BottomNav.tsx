'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, LayoutGrid, Banknote, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Market', href: '/market', icon: TrendingUp },
  { label: 'AI Quant', href: '/ai-quantification', icon: LayoutGrid },
  { label: 'Loan', href: '/loan', icon: Banknote },
  { label: 'Account', href: '/account', icon: UserCircle },
];

// Routes where bottom nav should be hidden
const hiddenRoutes = ['/chat', '/contact'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isHidden = hiddenRoutes.some((route) => pathname.startsWith(route));
  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive ? 'text-accent' : 'text-text-secondary'
              )}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
