'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function BrandHeader() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Logo + Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <span className="text-sm font-bold text-black">DB</span>
        </div>
        <span className="text-lg font-bold text-text-primary">Business</span>
      </div>
      {/* Account chip */}
      <button
        onClick={() => router.push('/account')}
        className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 border border-border hover:opacity-80 transition"
      >
        <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center">
          <span className="text-xs font-bold text-black">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <span className="text-sm text-text-secondary">
          {user?.firstName || 'Account'}
        </span>
      </button>
    </div>
  );
}
