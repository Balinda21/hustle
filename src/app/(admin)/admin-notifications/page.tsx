'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { chatService } from '@/services/chatService';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Menu, ArrowUpCircle, CheckCheck, Bell } from 'lucide-react';

interface WithdrawalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    fee: number;
    currency: string;
    network: string;
    walletAddress: string;
  } | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<WithdrawalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ADMIN.NOTIFICATIONS);
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time: prepend new withdrawal as it arrives
  useEffect(() => {
    const unsubscribe = chatService.onNewWithdrawal((data) => {
      const newNotif: WithdrawalNotification = {
        id: data.notificationId,
        type: 'WITHDRAWAL_REQUEST',
        title: 'New Withdrawal Request',
        message: `${data.user.name} requested ${data.amount} ${data.currency}`,
        data: {
          userId: data.user.id,
          userName: data.user.name,
          userEmail: data.user.email,
          amount: data.amount,
          fee: data.fee,
          currency: data.currency,
          network: data.network,
          walletAddress: data.walletAddress,
        },
        isRead: false,
        readAt: null,
        createdAt: data.createdAt,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(API_ENDPOINTS.ADMIN.NOTIFICATION_READ(id));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post(API_ENDPOINTS.ADMIN.NOTIFICATIONS_READ_ALL);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-lg bg-background flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">Withdrawal Requests</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-lg"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell size={56} className="text-text-muted mb-4" />
            <p className="text-text-muted text-sm">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-2xl border p-4 transition ${
                  notif.isRead
                    ? 'bg-card border-border'
                    : 'bg-accent/5 border-accent/30'
                }`}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle size={20} className="text-accent flex-shrink-0" />
                    <span className="text-sm font-bold text-text-primary">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0">{formatTime(notif.createdAt)}</span>
                </div>

                {/* Details grid */}
                {notif.data && (
                  <div className="bg-background rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted w-20">User</span>
                      <span className="text-xs font-semibold text-text-primary text-right">{notif.data.userName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted w-20">Email</span>
                      <span className="text-xs text-text-primary text-right">{notif.data.userEmail}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted w-20">Amount</span>
                      <span className="text-sm font-bold text-accent">{notif.data.amount} {notif.data.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted w-20">Fee (2%)</span>
                      <span className="text-xs text-text-primary">{notif.data.fee} {notif.data.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted w-20">Network</span>
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md">{notif.data.network}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-text-muted w-20 flex-shrink-0">Wallet</span>
                      <span className="text-xs font-mono text-text-primary text-right break-all">{notif.data.walletAddress}</span>
                    </div>
                  </div>
                )}

                {/* Mark read */}
                {!notif.isRead && (
                  <button
                    className="text-xs text-accent font-semibold hover:underline"
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
