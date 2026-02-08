'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, User, X } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.LOGIN_PASSWORD,
        { email, password },
        { skipAuth: true }
      );

      if (response.success) {
        const token = response.data.accessToken;
        const user = response.data.user;

        if (!token || !user || !user.id) {
          showToast('Invalid response from server', 'error');
          return;
        }

        await login(token, user);
      } else {
        showToast(response.message || 'Login failed', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email: forgotEmail.trim().toLowerCase() },
        { skipAuth: true }
      );
      if (response.success) {
        showToast('If an account exists, we sent a reset link to your email.', 'success');
        setShowForgotModal(false);
        setForgotEmail('');
      } else {
        showToast(response.message || 'Something went wrong', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Network error', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
        { skipAuth: true }
      );

      if (response.success) {
        await handleEmailLogin();
      } else {
        showToast(response.message || 'Sign up failed', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-8">
      {/* Logo */}
      <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-5">
        <span className="text-xl font-bold text-black">CR</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        ChainReturns
      </h1>
      <p className="text-text-secondary mb-2">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </p>
      <p className="text-text-muted text-sm mb-8">
        {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
      </p>

      {/* Form */}
      <div className="w-full flex flex-col gap-4">
        {isSignUp && (
          <>
            <Input
              icon={<User size={20} />}
              placeholder="First Name (Optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              icon={<User size={20} />}
              placeholder="Last Name (Optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </>
        )}

        <Input
          icon={<Mail size={20} />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <Input
          icon={<Lock size={20} />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:opacity-80"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          }
        />

        {!isSignUp && (
          <div className="flex justify-end">
            <button
              type="button"
              className="text-accent text-sm font-medium hover:underline"
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </button>
          </div>
        )}

        <Button
          onClick={isSignUp ? handleSignUp : handleEmailLogin}
          loading={loading}
          className="w-full mt-2"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>

        {/* Switch */}
        <div className="flex items-center justify-center gap-1 mt-5">
          <span className="text-text-secondary text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            className="text-accent text-sm font-semibold"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Forgot Password</h2>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5 transition"
                onClick={() => { setShowForgotModal(false); setForgotEmail(''); }}
                disabled={forgotLoading}
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <Input
              icon={<Mail size={20} />}
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="flex gap-3 mt-5">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setShowForgotModal(false); setForgotEmail(''); }}
                disabled={forgotLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleForgotPassword}
                loading={forgotLoading}
              >
                Send reset link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
