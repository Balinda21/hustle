'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ArrowLeftRight,
  ShoppingCart,
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
  { label: 'Users', icon: Users, path: '/admin-users' },
  { label: 'Chats', icon: MessageSquare, path: '/admin-chats' },
  { label: 'Transactions', icon: ArrowLeftRight, path: '', disabled: true },
  { label: 'Orders', icon: ShoppingCart, path: '', disabled: true },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sidebar panel */}
      <div
        className="relative w-72 max-w-[80%] bg-card h-full flex flex-col animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Admin Panel</h2>
            <button
              className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:opacity-80"
              onClick={onClose}
            >
              <X size={18} className="text-text-primary" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-bold text-background">
                {user?.firstName?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {user?.firstName || 'Admin'}
              </p>
              <p className="text-xs text-text-muted">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 py-3">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  item.disabled
                    ? 'opacity-40 cursor-default'
                    : isActive
                    ? 'bg-accent/10 border-r-2 border-accent'
                    : 'hover:bg-[#1a1a1a]'
                }`}
                onClick={() => {
                  if (!item.disabled && item.path) {
                    router.push(item.path);
                    onClose();
                  }
                }}
                disabled={item.disabled}
              >
                <Icon size={20} className={isActive ? 'text-accent' : 'text-text-secondary'} />
                <span
                  className={`text-sm font-medium ${
                    isActive ? 'text-accent' : 'text-text-primary'
                  }`}
                >
                  {item.label}
                </span>
                {item.disabled && (
                  <span className="ml-auto text-[10px] text-text-muted">Soon</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-5 py-4 border-t border-border">
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-danger/10 hover:bg-danger/20 transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={20} className="text-danger" />
            <span className="text-sm font-semibold text-danger">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
