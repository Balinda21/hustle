'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  Search,
  XCircle,
  ChevronRight,
  ArrowLeftRight,
  ShoppingCart,
  CreditCard,
  Wallet,
  Calendar,
  Clock,
  X,
  Users,
} from 'lucide-react';

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  accountBalance: number;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    transactions: number;
    orders: number;
    loans: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Balance edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadUsers = async (pageNum: number = 1, search: string = '') => {
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (search) params.search = search;

      const response = await api.get<{ users: User[]; pagination: any }>(
        API_ENDPOINTS.ADMIN.USERS,
        { params }
      );

      if (response.success && response.data) {
        if (pageNum === 1) {
          setUsers(response.data.users || []);
        } else {
          setUsers((prev) => [...prev, ...(response.data.users || [])]);
        }
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setLoading(true);
    loadUsers(1, searchQuery);
  }, [searchQuery]);

  const loadMore = () => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUsers(nextPage, searchQuery);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getUserDisplayName = (u: User) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    return u.firstName || u.lastName || u.email || 'Unknown User';
  };

  const getUserInitials = (u: User) => {
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    if (u.firstName) return u.firstName[0].toUpperCase();
    if (u.lastName) return u.lastName[0].toUpperCase();
    if (u.email) return u.email[0].toUpperCase();
    return 'U';
  };

  const openBalanceModal = (u: User) => {
    setSelectedUser(u);
    setEditBalance((u.accountBalance || 0).toString());
    setEditModalVisible(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;
    const newBalance = parseFloat(editBalance);
    if (isNaN(newBalance) || newBalance < 0) {
      showToast('Please enter a valid positive number', 'error');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put(
        API_ENDPOINTS.ADMIN.UPDATE_USER(selectedUser.id),
        { accountBalance: newBalance }
      );

      if (response.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, accountBalance: newBalance } : u
          )
        );
        setEditModalVisible(false);
        showToast('Balance updated successfully', 'success');
      } else {
        showToast(response.message || 'Failed to update balance', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update balance', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button className="p-1 w-8" onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Users</h1>
          <div className="w-8" />
        </div>
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary mt-3">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button className="p-1 w-8" onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Users</h1>
        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="mx-4 mt-3 mb-2">
        <div className="flex items-center bg-card rounded-xl px-3 border border-border">
          <Search size={20} className="text-text-muted mr-2" />
          <input
            className="flex-1 h-11 bg-transparent text-text-primary text-[15px] outline-none placeholder:text-text-muted"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button className="p-1" onClick={() => setSearchQuery('')}>
              <XCircle size={20} className="text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="overflow-y-auto px-4 pt-2 pb-8">
        {users.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Users size={64} className="text-text-muted mb-4" />
            <p className="text-lg font-semibold text-text-primary">No users found</p>
            {searchQuery && (
              <p className="text-sm text-text-secondary mt-2">Try a different search term</p>
            )}
          </div>
        ) : (
          <>
            {users.map((u) => (
              <div key={u.id} className="bg-card rounded-2xl p-4 mb-3 border border-border">
                {/* User header */}
                <div className="flex items-center mb-3">
                  <div className="relative mr-3">
                    <div className="w-[50px] h-[50px] rounded-full bg-accent flex items-center justify-center">
                      <span className="text-lg font-bold text-background">{getUserInitials(u)}</span>
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                        u.isActive ? 'bg-[#50C878]' : 'bg-text-muted'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-semibold text-text-primary truncate">
                        {getUserDisplayName(u)}
                      </p>
                      {u.role === 'ADMIN' && (
                        <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-text-secondary truncate">
                      {u.email || 'No email'}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-text-secondary" />
                </div>

                {/* Stats */}
                <div className="flex justify-around py-3 border-t border-b border-border mb-3">
                  <div className="flex flex-col items-center">
                    <ArrowLeftRight size={16} className="text-text-muted" />
                    <span className="text-base font-semibold text-text-primary mt-1">
                      {u._count.transactions || 0}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5">Transactions</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShoppingCart size={16} className="text-text-muted" />
                    <span className="text-base font-semibold text-text-primary mt-1">
                      {u._count.orders || 0}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5">Orders</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CreditCard size={16} className="text-text-muted" />
                    <span className="text-base font-semibold text-text-primary mt-1">
                      {u._count.loans || 0}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5">Loans</span>
                  </div>
                  <button
                    className="flex flex-col items-center bg-accent/10 px-3 py-2 rounded-lg"
                    onClick={() => openBalanceModal(u)}
                  >
                    <Wallet size={16} className="text-accent" />
                    <span className="text-base font-semibold text-accent mt-1">
                      ${(u.accountBalance || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5">Balance (tap to edit)</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="flex items-center flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">Joined {formatDate(u.createdAt)}</span>
                  </div>
                  {u.lastLoginAt && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-text-muted" />
                      <span className="text-xs text-text-muted">Last login {formatDate(u.lastLoginAt)}</span>
                    </div>
                  )}
                  {!u.isVerified && (
                    <span className="ml-auto bg-danger/20 text-danger text-[11px] font-semibold px-2 py-1 rounded">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            ))}

            {page < totalPages && (
              <div className="flex justify-center mt-4">
                <button
                  className="px-6 py-3 bg-card rounded-lg border border-border hover:opacity-80 active:opacity-60 transition"
                  onClick={loadMore}
                >
                  <span className="text-sm font-semibold text-accent">Load More</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Balance Edit Modal */}
      {editModalVisible && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5"
          onClick={() => setEditModalVisible(false)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-[400px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-primary">Edit Balance</h2>
              <button className="p-1" onClick={() => setEditModalVisible(false)}>
                <X size={24} className="text-text-secondary" />
              </button>
            </div>

            {/* User info */}
            {selectedUser && (
              <div className="flex flex-col items-center mb-6">
                <div className="w-[60px] h-[60px] rounded-full bg-accent flex items-center justify-center mb-3">
                  <span className="text-[22px] font-bold text-background">
                    {getUserInitials(selectedUser)}
                  </span>
                </div>
                <p className="text-lg font-semibold text-text-primary mb-1">
                  {getUserDisplayName(selectedUser)}
                </p>
                <p className="text-sm text-text-secondary">{selectedUser.email}</p>
              </div>
            )}

            {/* Balance input */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-secondary mb-2">New Balance (USD)</p>
              <div className="flex items-center bg-background rounded-xl border border-border px-4">
                <span className="text-xl font-semibold text-accent mr-2">$</span>
                <input
                  type="number"
                  className="flex-1 h-14 bg-transparent text-2xl font-semibold text-text-primary outline-none"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3.5 rounded-xl bg-background border border-border text-center hover:opacity-80 transition"
                onClick={() => setEditModalVisible(false)}
              >
                <span className="text-base font-semibold text-text-secondary">Cancel</span>
              </button>
              <button
                className={`flex-1 py-3.5 rounded-xl bg-accent text-center hover:opacity-80 transition ${
                  updating ? 'opacity-60' : ''
                }`}
                onClick={handleUpdateBalance}
                disabled={updating}
              >
                <span className="text-base font-semibold text-background">
                  {updating ? 'Updating...' : 'Update Balance'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
