'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

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
        <span className="text-3xl font-bold text-black">DB</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h1>
      <p className="text-text-secondary mb-10">
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
            <button className="text-accent text-sm">Forgot Password?</button>
          </div>
        )}

        <Button
          onClick={isSignUp ? handleSignUp : handleEmailLogin}
          loading={loading}
          className="w-full mt-2"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-text-secondary text-sm">OR</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        {/* Google Login */}
        <button
          className="w-full h-14 rounded-xl bg-[#4285F4] text-white font-semibold flex items-center justify-center gap-3 hover:opacity-80 transition disabled:opacity-50"
          onClick={() => showToast('Google login will be available soon', 'info')}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

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
    </div>
  );
}
