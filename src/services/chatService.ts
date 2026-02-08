import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { api } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  senderType: 'USER' | 'ADMIN' | 'SYSTEM';
  message: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
    role: string;
  };
}

export interface ChatSession {
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
  admin?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
}

class ChatService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnected: boolean = false;
  private currentSessionId: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.token = token;

    let baseUrl = API_BASE_URL.replace('/api', '');

    if (baseUrl.includes('render.com')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }

    console.log('Connecting to socket:', baseUrl);

    this.socket = io(baseUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 60000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.socket?.emit('join-sessions');
      if (this.currentSessionId) {
        this.socket?.emit('join-session', { sessionId: this.currentSessionId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Socket connection issue (will auto-retry):', error.message || error);
      this.isConnected = false;
    });

    this.socket.on('sessions-joined', (data: { count: number }) => {
      console.log('Joined sessions:', data.count);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentSessionId = null;
    }
  }

  async getOrCreateSession(): Promise<ChatSession> {
    const response = await api.get<ChatSession>(API_ENDPOINTS.CHAT.SESSION);
    if (response.success && response.data) {
      return response.data;
    }
    console.error('Failed to get or create session. Response:', JSON.stringify(response, null, 2));
    throw new Error(response.message || 'Failed to get or create session');
  }

  async getMessages(sessionId: string, page: number = 1, limit: number = 50) {
    try {
      const endpoint = API_ENDPOINTS.CHAT.MESSAGES(sessionId);
      const response = await api.get<{ messages: ChatMessage[]; pagination: any }>(endpoint, {
        params: { page, limit },
      });
      if (response.success && response.data) {
        return response.data;
      }
      console.error('Failed to get messages. Response:', JSON.stringify(response, null, 2));
      throw new Error(response.message || 'Failed to get messages');
    } catch (error: any) {
      if (error?.status === 404) {
        console.warn(`Messages endpoint not found for session ${sessionId}. Using socket events for messages.`);
        return { messages: [], pagination: { page: 1, limit, total: 0 } };
      }
      throw error;
    }
  }

  async sendMessage(sessionId: string, message: string, imageUrl?: string, audioUrl?: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(API_ENDPOINTS.CHAT.MESSAGE, {
      sessionId,
      message,
      imageUrl,
      audioUrl,
    });

    if (response.success && response.data) {
      return response.data;
    }
    console.error('Failed to send message. Response:', JSON.stringify(response, null, 2));
    throw new Error(response.message || 'Failed to send message');
  }

  joinSession(sessionId: string) {
    this.currentSessionId = sessionId;
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join session');
      return;
    }
    this.socket.emit('join-session', { sessionId });
  }

  joinAllSessions() {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join sessions');
      return;
    }
    this.socket.emit('join-sessions');
  }

  leaveSession() {
    this.currentSessionId = null;
  }

  sendMessageSocket(sessionId: string, message: string, imageUrl?: string, audioUrl?: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }
    this.socket.emit('send-message', { sessionId, message, imageUrl, audioUrl });
  }

  async markAsRead(sessionId: string) {
    const endpoint = API_ENDPOINTS.CHAT.READ(sessionId);
    await api.post(endpoint);

    if (this.socket && this.isConnected) {
      this.socket.emit('mark-read', { sessionId });
    }
  }

  sendTyping(sessionId: string, isTyping: boolean) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('typing', { sessionId, isTyping });
  }

  onNewMessage(callback: (data: { sessionId: string; message: ChatMessage }) => void) {
    if (!this.socket) return () => {};

    this.socket.on('new-message', callback);

    return () => {
      this.socket?.off('new-message', callback);
    };
  }

  onTyping(callback: (data: { sessionId: string; userId: string; isTyping: boolean }) => void) {
    if (!this.socket) return () => {};

    this.socket.on('user-typing', callback);

    return () => {
      this.socket?.off('user-typing', callback);
    };
  }

  onMessagesRead(callback: (data: { sessionId: string; userId: string }) => void) {
    if (!this.socket) return () => {};

    this.socket.on('messages-read', callback);

    return () => {
      this.socket?.off('messages-read', callback);
    };
  }

  onBalanceUpdated(callback: (data: { userId: string; accountBalance: string }) => void) {
    if (!this.socket) return () => {};

    this.socket.on('balance-updated', callback);

    return () => {
      this.socket?.off('balance-updated', callback);
    };
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(API_ENDPOINTS.CHAT.UNREAD);
    if (response.success && response.data) {
      return response.data.count || 0;
    }
    return 0;
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const chatService = new ChatService();
