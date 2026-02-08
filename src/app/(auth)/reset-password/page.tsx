'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast('Invalid or missing reset link. Request a new one from the login page.', 'error');
    }
  }, [token, showToast]);

  const handleReset = async () => {
    if (!token) {
      showToast('Invalid or missing reset link.', 'error');
      return;
    }
    if (!newPassword || !confirmPassword) {
      showToast('Please fill in both password fields', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    // Backend requires: uppercase, lowercase, number, special char
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[@$!%*?&]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      showToast('Password must contain uppercase, lowercase, number, and a special character (@$!%*?&)', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { token, newPassword },
        { skipAuth: true }
      );
      if (response.success) {
        showToast('Password reset successfully. You can now sign in.', 'success');
        router.replace('/login');
      } else {
        showToast(response.message || 'Failed to reset password', 'error');
      }
    } catch (error: any) {
      showToast(error.message || error.data?.message || 'Invalid or expired reset link. Request a new one.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-5">
          <Lock size={32} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Reset Password</h1>
        <p className="text-text-secondary text-center mb-6">
          This link is invalid or has expired. Please request a new password reset from the login page.
        </p>
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-5">
        <Lock size={32} className="text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Set New Password</h1>
      <p className="text-text-secondary text-center mb-8">
        Enter your new password below. Use at least 8 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).
      </p>

      <div className="w-full flex flex-col gap-4">
        <Input
          icon={<Lock size={20} />}
          type={showPassword ? 'text' : 'password'}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:opacity-80"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <Input
          icon={<Lock size={20} />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button
          onClick={handleReset}
          loading={loading}
          className="w-full mt-2"
        >
          Reset Password
        </Button>
        <Link href="/login" className="text-center text-accent text-sm font-medium mt-4 hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
