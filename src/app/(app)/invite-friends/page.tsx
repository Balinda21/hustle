'use client';

import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/contexts/ToastContext';
import { MessageCircle, Send, Facebook } from 'lucide-react';
import { FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

export default function InviteFriendsPage() {
  const { showToast } = useToast();
  const referralLink = 'https://df-business.life#/...';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast('Referral link copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const socialIcons = [
    { id: 'line', name: 'LINE', color: '#00C300', label: 'LINE' },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: FaWhatsapp },
    { id: 'telegram', name: 'Telegram', color: '#0088cc', icon: Send },
    { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: Facebook },
    { id: 'twitter', name: 'X', color: '#000000', label: 'X' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Invite friends" />

      <div className="px-4 pt-6 pb-8">
        {/* Total Commission Card */}
        <div className="bg-card rounded-2xl px-5 py-6 mb-6">
          <p className="text-sm text-text-muted mb-3">Total commission</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-text-primary">0.0</span>
            <span className="text-2xl font-semibold text-accent">USD</span>
          </div>
          <p className="text-sm text-text-muted leading-5">
            Share this link with your friends and join successfully to get cryptocurrency rewards
          </p>
        </div>

        {/* Referral Link */}
        <div className="mb-6">
          <p className="text-sm text-text-muted mb-3">Referral Link</p>
          <div className="flex items-center bg-card rounded-xl py-3.5 px-4">
            <span className="flex-1 text-sm text-text-primary truncate mr-3">{referralLink}</span>
            <button
              className="bg-accent rounded-lg py-2 px-4 text-sm font-semibold text-background"
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="flex flex-col items-center">
          <span className="text-3xl mb-3">🎉</span>
          <p className="text-[15px] text-text-primary text-center mb-5">
            Share it with your friends through social software
          </p>
          <div className="flex justify-center gap-4">
            {socialIcons.map((social) => {
              const Icon = social.icon;
              return (
                <button
                  key={social.id}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: social.color }}
                >
                  {social.label ? (
                    <span className={`text-white text-xs font-semibold ${social.id === 'twitter' ? 'text-xl font-bold' : ''}`}>
                      {social.label}
                    </span>
                  ) : Icon ? (
                    <Icon size={24} className="text-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
