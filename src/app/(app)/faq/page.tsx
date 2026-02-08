'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { ChevronUp, ChevronDown } from 'lucide-react';

const faqData = [
  { id: '1', question: 'What is this platform?', answer: 'This is a comprehensive trading and financial services platform that offers various features including trading, loans, and more.' },
  { id: '2', question: 'How do I get started?', answer: 'Simply create an account, complete your profile verification, and you can start using all the platform features.' },
  { id: '3', question: 'How do I make a deposit?', answer: 'You can make deposits through various payment methods available in your account dashboard. Navigate to your account section and select "Deposit" to see all available options.' },
  { id: '4', question: 'How long does withdrawal take?', answer: 'Withdrawals are typically processed within 24-48 hours, depending on the payment method you choose.' },
  { id: '5', question: 'Is my account secure?', answer: 'Yes, we use industry-standard encryption and security measures to protect your account and personal information.' },
  { id: '6', question: 'How do I contact support?', answer: 'You can contact our support team through the Chat feature in the app, or use the Contact Us section for general inquiries.' },
  { id: '7', question: 'What are the trading fees?', answer: 'Trading fees vary depending on the type of trade and market conditions. Check the Market section for current fee structures.' },
  { id: '8', question: 'Can I use the platform on mobile?', answer: 'Yes, this platform is fully optimized for mobile devices and works seamlessly on both iOS and Android.' },
];

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="FAQ" />

      <div className="px-4 pb-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Frequently Asked Questions</h2>
        <p className="text-sm text-text-secondary mb-6">
          Find answers to common questions about our platform
        </p>

        <div className="flex flex-col gap-3">
          {faqData.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="flex-1 text-base font-semibold text-text-primary mr-3">
                    {item.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-text-secondary shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-text-secondary shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <p className="text-sm text-text-secondary leading-5 pt-3">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
