'use client';

import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] to-[#F5E6FF] flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Chat Icon */}
        <div className="w-20 h-20 rounded-full bg-[#4A90E2] flex items-center justify-center mb-8">
          <div className="w-8 h-8 rounded-md bg-white" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl font-bold text-black mb-2">Welcome!</h1>
        <p className="text-2xl font-semibold text-black mb-12">Text us</p>

        {/* Chat Message Box */}
        <div className="bg-white rounded-2xl p-5 w-full shadow-lg mb-6">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-black">DB</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-base font-semibold text-black">Business</span>
              <span className="text-sm text-gray-500">23:39</span>
            </div>
          </div>
          <p className="text-[15px] text-gray-700 leading-relaxed">Hello. How may I help you?</p>
        </div>

        {/* Back to Chat Button */}
        <button
          className="w-full bg-[#4A90E2] rounded-xl py-4 px-6 flex items-center justify-center gap-2 text-white font-semibold text-base hover:opacity-90 transition"
          onClick={() => router.push('/chat')}
        >
          Back to chat
          <Send size={20} className="rotate-45" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center py-4 gap-2">
        <span className="text-xs text-gray-500">Powered by</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-[#FF6B35] rounded-sm" />
          <span className="text-xs font-semibold text-gray-500">LiveChat</span>
        </div>
      </div>
    </div>
  );
}
