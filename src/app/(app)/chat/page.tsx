'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { chatService, ChatMessage, ChatSession } from '@/services/chatService';
import { uploadImage, uploadAudio } from '@/services/cloudinaryService';
import { API_ENDPOINTS } from '@/config/api';
import { api } from '@/services/apiClient';
import {
  ArrowLeft,
  Camera,
  Send,
  Mic,
  Play,
  Pause,
  X,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const commonEmojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get('sessionId');
  const urlUserId = searchParams.get('userId');
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Voice note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [audioPositions, setAudioPositions] = useState<Record<string, number>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Initialize chat (honor sessionId from URL so opening a specific conversation shows its messages)
  useEffect(() => {
    if (!token) return;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);
        chatService.connect(token);
        await new Promise(resolve => setTimeout(resolve, 500));

        let chatSession: ChatSession;

        if (urlSessionId) {
          // Opening a specific session (e.g. admin clicked from list) — use it and load its messages
          chatSession = {
            id: urlSessionId,
            userId: urlUserId || '',
            status: 'OPEN',
            createdAt: new Date().toISOString(),
          };
          setSession(chatSession);
          chatService.joinSession(chatSession.id);
        } else {
          // Normal user flow: get or create my session
          chatSession = await chatService.getOrCreateSession();
          setSession(chatSession);
          chatService.joinSession(chatSession.id);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const messagesData = await chatService.getMessages(chatSession.id);
          setMessages(messagesData.messages || []);
        } catch {
          setMessages([]);
        }

        try { await chatService.markAsRead(chatSession.id); } catch {}
        setLoading(false);

        // Refetch messages once after a short delay to catch any that arrived just before we opened
        setTimeout(async () => {
          if (!chatSession?.id) return;
          try {
            const messagesData = await chatService.getMessages(chatSession.id);
            setMessages((prev) => {
              const byId = new Map(prev.map((m) => [m.id, m]));
              for (const m of messagesData.messages || []) {
                if (!byId.has(m.id)) byId.set(m.id, m);
              }
              return Array.from(byId.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
          } catch {
            // ignore
          }
        }, 800);
      } catch (error: any) {
        setError(error.message || 'Failed to initialize chat');
        setLoading(false);
      }
    };

    initializeChat();
  }, [token, urlSessionId, urlUserId]);

  // Listen for new messages
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribeNewMessage = chatService.onNewMessage((data) => {
      if (data.sessionId === session.id) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
          if (filtered.some((m) => m.id === data.message.id)) return filtered;
          return [...filtered, data.message];
        });
        scrollToBottom();
      }
    });

    const unsubscribeTyping = chatService.onTyping((data) => {
      if (data.sessionId === session.id && data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeTyping();
    };
  }, [session?.id, user?.id]);

  // Typing indicator
  useEffect(() => {
    if (!session?.id) return;

    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      chatService.sendTyping(session.id, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && session?.id) {
        setIsTyping(false);
        chatService.sendTyping(session.id, false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [message, session?.id, isTyping]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const isUserMessage = (msg: ChatMessage) => {
    if (user?.role === 'ADMIN') return msg.senderType === 'ADMIN';
    return msg.senderType === 'USER' && msg.userId === user?.id;
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile && !recordingBlob) || !session || sending) return;

    const messageText = message.trim();
    const fileToSend = selectedFile;
    const blobToSend = recordingBlob;
    const audioDuration = recordingDuration;

    setMessage('');
    setSelectedImage(null);
    setSelectedFile(null);
    setSending(true);

    try {
      let imageUrl: string | undefined;
      let audioUrl: string | undefined;

      if (fileToSend) {
        setUploadingImage(true);
        try {
          const result = await uploadImage(fileToSend);
          imageUrl = result.url;
        } catch (err: any) {
          showToast(err.message || 'Failed to upload image', 'error');
          setSending(false);
          setUploadingImage(false);
          setSelectedFile(fileToSend);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      if (blobToSend) {
        try {
          const result = await uploadAudio(blobToSend);
          audioUrl = result.url;
        } catch (err: any) {
          showToast(err.message || 'Failed to upload voice note', 'error');
          setSending(false);
          return;
        }
        setRecordingBlob(null);
        setRecordingDuration(0);
      }

      const senderType = user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
      const tempMessageId = `temp-${Date.now()}`;

      if (audioDuration > 0 && audioUrl) {
        setAudioDurations((prev) => ({ ...prev, [tempMessageId]: audioDuration }));
      }

      const optimisticMessage: ChatMessage = {
        id: tempMessageId,
        sessionId: session.id,
        userId: user?.id || '',
        senderType,
        message: messageText,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        isRead: false,
        createdAt: new Date().toISOString(),
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          imageUrl: user.imageUrl || null,
          role: user.role || 'CUSTOMER',
        } : undefined,
      };

      if (messageText || imageUrl || audioUrl) {
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      if (chatService.connected) {
        chatService.sendMessageSocket(session.id, messageText || '', imageUrl, audioUrl);
      } else {
        await chatService.sendMessage(session.id, messageText || '', imageUrl, audioUrl);
      }

      scrollToBottom();
      await chatService.markAsRead(session.id);
    } catch {
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleSendSuggestion = async (text: string) => {
    if (!session || sending) return;
    setSending(true);
    const senderType = user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      sessionId: session.id,
      userId: user?.id || '',
      senderType,
      message: text,
      imageUrl: null,
      audioUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        imageUrl: user.imageUrl || null,
        role: user.role || 'CUSTOMER',
      } : undefined,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    if (chatService.connected) {
      chatService.sendMessageSocket(session.id, text, undefined, undefined);
    } else {
      await chatService.sendMessage(session.id, text, undefined, undefined);
    }
    setSending(false);
    scrollToBottom();
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedImage(URL.createObjectURL(file));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiPress = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      showToast('Failed to start recording. Please grant microphone permissions.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingBlob(null);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Audio playback
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      setAudioPositions((prev) => ({ ...prev, [audioUrl]: 0 }));
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudio(audioUrl);
    setAudioPositions((prev) => ({ ...prev, [audioUrl]: 0 }));

    audio.ontimeupdate = () => {
      setAudioPositions((prev) => ({ ...prev, [audioUrl]: Math.floor(audio.currentTime) }));
    };

    audio.onloadedmetadata = () => {
      setAudioDurations((prev) => {
        if (prev[audioUrl]) return prev;
        return { ...prev, [audioUrl]: Math.floor(audio.duration) };
      });
    };

    audio.onended = () => {
      audioRef.current = null;
      setPlayingAudio(null);
      setAudioPositions((prev) => ({ ...prev, [audioUrl]: 0 }));
    };

    audio.play().catch(() => {
      setPlayingAudio(null);
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-chat-bg z-30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8696A0]">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="fixed inset-0 flex flex-col bg-chat-bg z-30">
        <div className="flex items-center px-2 py-3 bg-chat-header border-b border-chat-border">
          <button className="p-2" onClick={() => router.back()}>
            <ArrowLeft size={24} className="text-white" />
          </button>
          <span className="text-lg font-semibold text-white ml-2">Chat</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <AlertCircle size={48} className="text-danger mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Chat</h3>
          <p className="text-sm text-[#8696A0] text-center mb-6">{error}</p>
          <button
            className="bg-accent px-6 py-3 rounded-lg"
            onClick={() => { setError(null); setLoading(true); }}
          >
            <span className="text-base font-semibold text-white">Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-chat-bg z-30">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="flex items-center px-2 py-3 bg-chat-header border-b border-chat-border">
        <button className="p-2" onClick={() => router.back()}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="flex-1 ml-2">
          <p className="text-lg font-semibold text-white">Support Chat</p>
          {otherUserTyping && <p className="text-xs text-chat-green">typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 pb-4"
        style={{
          backgroundImage: 'url(https://i.pinimg.com/originals/97/c0/07/97c00759d90d786d9b6096e6e0e2e69b.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-16 px-6">
              <div className="w-[100px] h-[100px] rounded-full bg-[rgba(0,168,132,0.15)] flex items-center justify-center mb-5">
                <MessageCircle size={60} className="text-accent" />
              </div>
              <h3 className="text-[22px] font-bold text-white mb-2">Start a Conversation</h3>
              <p className="text-[15px] text-[#8696A0] mb-6">We&apos;re here to help you</p>
              <div className="space-y-2.5">
                {['Hello! I need help', 'What are your trading fees?', 'How do I deposit funds?'].map((text, i) => (
                  <button
                    key={i}
                    className="bg-chat-header py-3 px-5 rounded-[20px] border border-chat-green hover:opacity-80 transition"
                    onClick={() => handleSendSuggestion(text)}
                  >
                    <span className="text-sm font-medium text-chat-green">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = isUserMessage(msg);
            const isSending = msg.id.startsWith('temp-');
            const isRead = msg.isRead;

            return (
              <div key={msg.id} className={`flex my-0.5 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-xl p-2 max-w-[80%] min-w-[80px] ${
                    isUser
                      ? 'bg-chat-sent rounded-tr-sm'
                      : 'bg-chat-received rounded-tl-sm'
                  }`}
                >
                  {/* Image */}
                  {msg.imageUrl && (
                    <button onClick={() => setViewingImage(msg.imageUrl!)} className="block mb-1">
                      <img src={msg.imageUrl} alt="" className="w-[220px] h-[220px] rounded-lg object-cover" />
                    </button>
                  )}

                  {/* Voice Note */}
                  {msg.audioUrl && (
                    <div className="flex items-center gap-2 py-1 min-w-[200px]">
                      <button
                        className="w-10 h-10 rounded-full bg-chat-green flex items-center justify-center flex-shrink-0"
                        onClick={() => playAudio(msg.audioUrl!)}
                      >
                        {playingAudio === msg.audioUrl ? (
                          <Pause size={22} className="text-white" />
                        ) : (
                          <Play size={22} className="text-white ml-0.5" />
                        )}
                      </button>
                      <div className="flex items-center gap-0.5 flex-1">
                        {[5,12,8,18,10,15,7,20,12,16,9,14,6,18,11,15,8,12].map((h, i) => (
                          <div
                            key={i}
                            className={`w-[3px] rounded-sm ${isUser ? 'bg-white/50' : 'bg-[#8696A0]'}`}
                            style={{ height: h }}
                          />
                        ))}
                      </div>
                      <span className={`text-xs min-w-[36px] ${isUser ? 'text-white/60' : 'text-[#8696A0]'}`}>
                        {playingAudio === msg.audioUrl
                          ? `${formatDuration(audioPositions[msg.audioUrl] || 0)} / ${formatDuration(audioDurations[msg.audioUrl] || 0)}`
                          : formatDuration(audioDurations[msg.audioUrl] || 0)}
                      </span>
                    </div>
                  )}

                  {/* Text */}
                  {msg.message && (
                    <p className="text-[15px] text-white leading-5">{msg.message}</p>
                  )}

                  {/* Time & Ticks */}
                  <div className="flex justify-end items-center mt-1 gap-1">
                    <span className={`text-[11px] ${isUser ? 'text-white/60' : 'text-[#8696A0]'}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                    {isUser && (
                      <span className="ml-0.5">
                        {isSending ? (
                          <Clock size={14} className="text-white/60" />
                        ) : isRead ? (
                          <CheckCheck size={16} className="text-[#53BDEB]" />
                        ) : (
                          <CheckCheck size={16} className="text-white/60" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {otherUserTyping && (
            <div className="flex justify-start my-0.5 px-2">
              <div className="bg-chat-received rounded-xl p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#8696A0] opacity-40 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-[#8696A0] opacity-60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-[#8696A0] opacity-80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {selectedImage && (
        <div className="bg-chat-header p-3 border-t border-chat-border relative">
          <img src={selectedImage} alt="" className="w-[150px] h-[150px] rounded-xl object-cover" />
          <button
            className="absolute top-2 right-2"
            onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
          >
            <X size={28} className="text-danger" />
          </button>
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="flex items-center bg-chat-header px-4 py-3 gap-3">
          <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
          <span className="text-base font-semibold text-white min-w-[50px]">{formatDuration(recordingDuration)}</span>
          <div className="flex items-center gap-[3px] flex-1">
            {[8,14,10,18,12,16,8,20,14,18].map((h, i) => (
              <div key={i} className="w-[3px] bg-chat-green rounded-sm animate-pulse" style={{ height: h }} />
            ))}
          </div>
          <button className="p-2" onClick={cancelRecording}>
            <X size={24} className="text-danger" />
          </button>
          <button
            className="w-11 h-11 rounded-full bg-chat-green flex items-center justify-center"
            onClick={stopRecording}
          >
            <Check size={24} className="text-white" />
          </button>
        </div>
      )}

      {/* Voice Preview */}
      {recordingBlob && !isRecording && (
        <div className="flex items-center bg-chat-header px-4 py-2.5 gap-3">
          <button
            className="w-9 h-9 rounded-full bg-chat-green flex items-center justify-center"
            onClick={() => {
              const url = URL.createObjectURL(recordingBlob);
              playAudio(url);
            }}
          >
            <Play size={20} className="text-white ml-0.5" />
          </button>
          <span className="text-sm text-white flex-1">{formatDuration(recordingDuration)}</span>
          <button className="p-2" onClick={cancelRecording}>
            <Trash2 size={20} className="text-danger" />
          </button>
          <button
            className={`w-11 h-11 rounded-full bg-chat-green flex items-center justify-center ${sending ? 'opacity-50' : ''}`}
            onClick={handleSend}
            disabled={sending}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      )}

      {/* Input Area */}
      {!isRecording && !recordingBlob && (
        <div className="flex items-center bg-chat-header px-2 py-2 gap-2">
          <button className="p-2" onClick={handlePickImage}>
            <Camera size={24} className="text-[#8696A0]" />
          </button>
          <input
            type="text"
            className="flex-1 bg-[#2A3942] rounded-3xl px-4 py-2.5 text-base text-white outline-none placeholder-[#8696A0]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message..."
            disabled={sending}
          />
          {message.trim() || selectedFile ? (
            <button
              className={`w-11 h-11 rounded-full bg-chat-green flex items-center justify-center ${(sending || uploadingImage) ? 'opacity-50' : ''}`}
              onClick={handleSend}
              disabled={sending || uploadingImage}
            >
              {sending || uploadingImage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={20} className="text-white" />
              )}
            </button>
          ) : (
            <button
              className="w-11 h-11 rounded-full bg-chat-green flex items-center justify-center"
              onClick={startRecording}
            >
              <Mic size={24} className="text-white" />
            </button>
          )}
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            className="absolute top-12 right-5 z-10 p-2"
            onClick={() => setViewingImage(null)}
          >
            <X size={32} className="text-white" />
          </button>
          <img src={viewingImage} alt="" className="max-w-full max-h-[80vh] object-contain" />
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowEmojiPicker(false)}>
          <div className="w-full bg-chat-header rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4">
              <span className="text-lg font-semibold text-white">Select Emoji</span>
              <button onClick={() => setShowEmojiPicker(false)}>
                <X size={24} className="text-white" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4">
              <div className="flex flex-wrap">
                {commonEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    className="w-[50px] h-[50px] flex items-center justify-center text-[28px]"
                    onClick={() => handleEmojiPress(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
