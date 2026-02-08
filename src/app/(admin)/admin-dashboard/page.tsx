'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Menu,
  LogOut,
  TrendingUp,
  Calendar,
  Clock,
  MessageSquare,
  ChevronRight,
  Users,
  UserCheck,
  ArrowLeftRight,
  Timer,
  ShoppingCart,
  Zap,
  CreditCard,
  Hourglass,
  MailOpen,
  MessageCircle,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  totalOrders: number;
  activeOrders: number;
  totalLoans: number;
  pendingLoans: number;
  totalRevenue: number;
  todayRevenue: number;
  openChatSessions: number;
  unreadMessages: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  title: string;
  icon: typeof Users;
  color: string;
  link?: string;
}[] = [
  { key: 'totalUsers', title: 'Total Users', icon: Users, color: '#4A90E2', link: '/admin-users' },
  { key: 'activeUsers', title: 'Active Users', icon: UserCheck, color: '#50C878', link: '/admin-users' },
  { key: 'totalTransactions', title: 'Transactions', icon: ArrowLeftRight, color: '#FF6B35' },
  { key: 'pendingTransactions', title: 'Pending', icon: Timer, color: '#FFD700' },
  { key: 'totalOrders', title: 'Total Orders', icon: ShoppingCart, color: '#9B59B6' },
  { key: 'activeOrders', title: 'Active Orders', icon: Zap, color: '#3498DB' },
  { key: 'totalLoans', title: 'Total Loans', icon: CreditCard, color: '#E74C3C' },
  { key: 'pendingLoans', title: 'Pending Loans', icon: Hourglass, color: '#F39C12' },
  { key: 'openChatSessions', title: 'Open Chats', icon: MessageCircle, color: '#00D4AA', link: '/admin-chats' },
  { key: 'unreadMessages', title: 'Unread Messages', icon: MailOpen, color: '#FF6B9D', link: '/admin-chats' },
];

const QUICK_ACTIONS = [
  { label: 'Chats', icon: MessageSquare, color: '#bfdb31', path: '/admin-chats' },
  { label: 'Users', icon: Users, color: '#4A90E2', path: '/admin-users' },
  { label: 'Transactions', icon: ArrowLeftRight, color: '#FF6B35', disabled: true },
  { label: 'Orders', icon: ShoppingCart, color: '#9B59B6', disabled: true },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get(API_ENDPOINTS.ADMIN.STATS),
        api.get(API_ENDPOINTS.ADMIN.ACTIVITY, { params: { limit: 10 } }),
      ]);

      if (statsResponse.success && statsResponse.data) {
        const data = statsResponse.data;
        setStats({
          totalUsers: data.users?.total || 0,
          activeUsers: data.users?.active || 0,
          totalTransactions: data.transactions?.total || 0,
          pendingTransactions: data.transactions?.pending || 0,
          totalOrders: data.orders?.total || 0,
          activeOrders: data.orders?.active || 0,
          totalLoans: data.loans?.total || 0,
          pendingLoans: data.loans?.active || 0,
          totalRevenue: parseFloat(data.revenue?.total) || 0,
          todayRevenue: parseFloat(data.transactions?.volume24h) || 0,
          openChatSessions: data.chat?.openSessions || 0,
          unreadMessages: data.chat?.unreadMessages || 0,
        });
      }

      if (activityResponse.success && activityResponse.data) {
        const activityData: ActivityItem[] = [];
        const data = activityResponse.data;

        if (data.recentUsers) {
          data.recentUsers.forEach((u: any) => {
            activityData.push({
              id: `user-${u.id}`,
              type: 'user',
              description: 'New user registered',
              userId: u.id,
              userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              createdAt: u.createdAt,
            });
          });
        }

        activityData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivity(activityData.slice(0, 10));
      }
    } catch {
      setStats({
        totalUsers: 0, activeUsers: 0, totalTransactions: 0, pendingTransactions: 0,
        totalOrders: 0, activeOrders: 0, totalLoans: 0, pendingLoans: 0,
        totalRevenue: 0, todayRevenue: 0, openChatSessions: 0, unreadMessages: 0,
      });
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-secondary mt-3">Loading dashboard...</p>
      </div>
    );
  }

  const d = stats || {
    totalUsers: 0, activeUsers: 0, totalTransactions: 0, pendingTransactions: 0,
    totalOrders: 0, activeOrders: 0, totalLoans: 0, pendingLoans: 0,
    totalRevenue: 0, todayRevenue: 0, openChatSessions: 0, unreadMessages: 0,
  };

  return (
    <>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-card border-b border-border">
        <button className="p-2 mr-3" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Welcome back, {user?.firstName || 'Admin'}
          </p>
        </div>
        <button
          className="p-2 rounded-lg bg-danger/20"
          onClick={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <LogOut size={20} className="text-text-primary" />
        </button>
      </div>

      <div className="overflow-y-auto pb-8">
        {/* Welcome + Revenue */}
        <div className="px-4 pt-4 pb-4">
          <h2 className="text-[28px] font-bold text-text-primary mb-1.5">
            Hey {user?.firstName || 'Admin'}!
          </h2>
          <p className="text-[15px] text-text-secondary mb-4">Here&apos;s your dashboard overview</p>

          {/* Revenue cards */}
          <div className="flex gap-3">
            <div className="flex-1 bg-card rounded-2xl p-4 border-2 border-accent min-h-[140px]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={24} className="text-accent" />
                <span className="text-sm text-text-secondary font-medium">Total Revenue</span>
              </div>
              <p className="text-[28px] font-bold text-accent mb-2">
                ${d.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">All time</span>
              </div>
            </div>
            <div className="flex-1 bg-card rounded-2xl p-4 border border-border min-h-[140px]">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={24} className="text-accent" />
                <span className="text-sm text-text-secondary font-medium">Today&apos;s Revenue</span>
              </div>
              <p className="text-[28px] font-bold text-accent mb-2">
                ${d.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Last 24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="px-4 mb-5">
          <h3 className="text-lg font-bold text-text-primary mb-3">Overview</h3>

          {/* Prominent Chat Card */}
          <button
            className="w-full bg-card rounded-2xl p-5 mb-4 border-2 border-accent/40 flex items-center justify-between hover:opacity-80 active:opacity-60 transition"
            onClick={() => router.push('/admin-chats')}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-[60px] h-[60px] rounded-full bg-accent/20 flex items-center justify-center">
                <MessageSquare size={32} className="text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary text-left">Chat Support</p>
                <p className="text-sm text-text-secondary text-left">
                  {d.openChatSessions} open chats &bull; {d.unreadMessages} unread messages
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="text-accent" />
          </button>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const value = d[card.key];
              return (
                <button
                  key={card.key}
                  className="bg-card rounded-2xl p-4 flex flex-col items-center border border-border min-h-[140px] hover:opacity-80 active:opacity-60 transition"
                  onClick={() => card.link && router.push(card.link)}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: card.color + '20' }}
                  >
                    <Icon size={28} style={{ color: card.color }} />
                  </div>
                  <p className="text-[22px] font-bold text-text-primary mb-1">
                    {(value || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary font-medium text-center">{card.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-5">
          <h3 className="text-lg font-bold text-text-primary mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className={`bg-card rounded-2xl p-4 flex flex-col items-center border border-border min-h-[120px] transition ${
                    action.disabled ? 'opacity-50' : 'hover:opacity-80 active:opacity-60'
                  }`}
                  onClick={() => !action.disabled && action.path && router.push(action.path)}
                  disabled={action.disabled}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: action.color + '20' }}
                  >
                    <Icon size={28} style={{ color: action.color }} />
                  </div>
                  <span className="text-xs font-semibold text-text-primary text-center">
                    {action.label}
                  </span>
                  {action.disabled && (
                    <span className="text-[10px] text-text-muted mt-1">Coming Soon</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 mb-5">
          <h3 className="text-lg font-bold text-text-primary mb-3">Recent Activity</h3>
          {activity.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border py-12 flex flex-col items-center">
              <Clock size={48} className="text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No recent activity</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 px-4 py-3.5 border-b border-border last:border-b-0"
                >
                  <div className="mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary mb-1">{item.description}</p>
                    {item.userName && (
                      <p className="text-xs text-text-secondary mb-0.5">{item.userName}</p>
                    )}
                    <p className="text-[11px] text-text-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
