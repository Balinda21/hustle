'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { chatService } from '@/services/chatService';
import { ArrowLeft, MessageSquare, Image, Mic } from 'lucide-react';

interface ChatSession {
  id: string;
  userId: string;
  adminId?: string | null;
  status: 'OPEN' | 'CLOSED' | 'WAITING';
  lastMessageAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
  messages?: Array<{
    id: string;
    message: string;
    senderType: 'USER' | 'ADMIN' | 'SYSTEM';
    createdAt: string;
    isRead: boolean;
    imageUrl?: string;
    audioUrl?: string;
  }>;
}

export default function AdminChatsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect socket for real-time updates
  useEffect(() => {
    if (!token) return;

    if (!chatService.connected) {
      chatService.connect(token);
    }

    chatService.joinAllSessions();

    const unsubscribe = chatService.onNewMessage(({ sessionId, message }) => {
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id === sessionId) {
            const updatedMessages = [
              ...(s.messages || []),
              {
                id: message.id,
                message: message.message || '',
                senderType: message.senderType as 'USER' | 'ADMIN' | 'SYSTEM',
                createdAt: message.createdAt,
                isRead: message.isRead || false,
              },
            ];
            return { ...s, lastMessageAt: message.createdAt, messages: updatedMessages };
          }
          return s;
        });

        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      });
    });

    return () => {
      unsubscribe();
    };
  }, [token]);

  const loadSessions = async () => {
    try {
      const response = await api.get<ChatSession[]>(API_ENDPOINTS.CHAT.SESSIONS + '/all');
      if (response.success && response.data) {
        const all = Array.isArray(response.data) ? response.data : [];
        const sorted = all.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        setSessions(sorted);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diff = today.getTime() - messageDate.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        const hours12 = date.getHours() % 12 || 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        return `${hours12}:${minutes} ${ampm}`;
      }
      if (days === 1) return 'Yesterday';
      if (days < 7) {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getUserName = (session: ChatSession) => {
    if (session.user?.firstName && session.user?.lastName) {
      return `${session.user.firstName} ${session.user.lastName}`;
    }
    return session.user?.email || 'Unknown User';
  };

  const getUserInitials = (session: ChatSession) => {
    const name = getUserName(session);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessage = (session: ChatSession) => {
    if (session.messages && session.messages.length > 0) {
      const sorted = [...session.messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const last = sorted[0];
      const hasImage = !!last.imageUrl;
      const hasAudio = !!last.audioUrl;

      if (hasImage && !last.message) return { text: 'Photo', hasImage: true, hasAudio: false };
      if (hasAudio && !last.message) return { text: 'Voice message', hasImage: false, hasAudio: true };

      const msg = last.message || '';
      const text = msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
      return { text: text || 'No message content', hasImage, hasAudio };
    }
    return { text: 'No messages yet', hasImage: false, hasAudio: false };
  };

  const getUnreadCount = (session: ChatSession) => {
    if (!session.messages) return 0;
    return session.messages.filter((m) => !m.isRead && m.senderType === 'USER').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-[22px] font-bold text-text-primary">Chats</h1>
          <div className="w-6" />
        </div>
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary mt-3">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-[22px] font-bold text-text-primary">Chats</h1>
        <div className="w-6" />
      </div>

      {/* Chat sessions list */}
      <div className="pb-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-8">
            <MessageSquare size={64} className="text-text-muted mb-4" />
            <p className="text-lg font-semibold text-text-primary mb-2">No chats yet</p>
            <p className="text-sm text-text-secondary text-center">
              When users start chatting, their conversations will appear here
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const unreadCount = getUnreadCount(session);
            const lastMessage = getLastMessage(session);
            const time = formatTime(session.lastMessageAt || session.createdAt);

            return (
              <button
                key={session.id}
                className="w-full flex items-center px-4 py-3 bg-card border-b border-border hover:bg-[#1c1c1c] active:bg-[#222] transition text-left"
                onClick={() =>
                  router.push(`/chat?sessionId=${session.id}&userId=${session.userId}`)
                }
              >
                {/* Avatar */}
                <div className="mr-3">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-xl font-semibold text-background">
                      {getUserInitials(session)}
                    </span>
                  </div>
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-base font-semibold text-text-primary truncate flex-1">
                      {getUserName(session)}
                    </p>
                    {time && (
                      <span className="text-[13px] text-text-muted ml-2 shrink-0">{time}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      {lastMessage.hasImage && (
                        <Image size={14} className="text-text-muted mr-1 shrink-0" />
                      )}
                      {lastMessage.hasAudio && (
                        <Mic size={14} className="text-text-muted mr-1 shrink-0" />
                      )}
                      <p className="text-sm text-text-secondary truncate">{lastMessage.text}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 min-w-[20px] h-5 rounded-full bg-accent flex items-center justify-center px-1.5 shrink-0">
                        <span className="text-xs font-bold text-background">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
