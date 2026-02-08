'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Plus, Minus } from 'lucide-react';

const sections = [
  {
    id: 'aboutUs',
    title: 'about Us:',
    content: `We are committed to building a platform that allows you to be comfortable in cryptocurrency trading and investment, tracking the cryptocurrency traders with the best trading performance, and selecting all trading records of outstanding traders with high transparency and credible past performance to complete. and systematic analysis. Use advanced trading terminals to trade and use AI technology to create fully automated trading robots. Using our advanced trading tools, we create a unique combination of trading strategies based on technical analysis and indicators, as well as personalized settings for each cryptocurrency pair, and these combinations can be completely left to the trading robot. These portfolios are backtested, allowing users to build consistent profitability each month. They are now available to any investor on our platform`,
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer:',
    content: `We solemnly remind you: You acknowledge and agree that, to the extent permitted by law, all our services are provided without any express or implied warranty. We do not represent that this website will meet your needs 100% of the time. We make no warranty or representation that the Service will meet your requirements; will be uninterrupted, timely, secure, or free of defects; that the results that may be obtained from the use of the Service will be accurate or reliable; or that any defects that are known but not discovered will be corrected. correct. We will strive to provide you with services as quickly as possible, but we do not guarantee that access will be uninterrupted or that there will be no delays, failures, errors, omissions or losses in transmitted information. We will use reasonable efforts to ensure that you have normal access to this website in accordance with these terms of use. We may suspend use of the Site for maintenance and will use reasonable efforts to provide notice to you. You acknowledge that this may not be possible in an emergency.`,
  },
  {
    id: 'aml',
    title: 'Anti-Money Laundering Agreement:',
    content: `This agreement is drawn up in accordance with the provisions of the law aimed at reducing the risk of money laundering on virtual currency trading platforms, you need to agree and comply with the following:\n\n1. You undertake to comply with the laws and regulations related to understanding and anti-money laundering in a prudent manner, and shall not violate them intentionally.\n\n2. We set and adjust the maximum limit of daily transactions and cash withdrawals in real time according to the security and actual transaction situation.\n\n3. If transactions occur too frequently and in a concentrated manner on a particular account, or under other circumstances that are beyond reason, our professional team will evaluate and decide whether they are suspicious or not.\n\n4. In the event that we determine, in our sole judgment, that a transaction is suspicious, we may suspend the transaction, refuse the transaction, and take other restrictive measures.\n\n5. We reserve the right to reject applications from persons from jurisdictions that do not comply with international anti-money laundering standards.`,
  },
  {
    id: 'terms',
    title: 'Terms of Service:',
    content: `Account Holder Representations and Warranties\n\nBy registering for an account, the account holder expressly represents and warrants that they:\n\nHave accepted these Terms of Use;\n\nComply with the rules and laws of their country of residence and/or the country in which they access the Site and the Services;\n\nIs at least 18 years of age, is authorized to accept these Terms of Use and to engage in transactions involving cryptocurrencies;\n\nAgree to provide accurate, current and complete information to the Platform as prompted by the account creation process;\n\nAre responsible for maintaining the confidentiality of their account information and all activities that occur under their account;\n\nUse funds through the Platform that belong to the account holder and come from legitimate sources.`,
  },
];

export default function AboutPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aboutUs: true,
    disclaimer: false,
    aml: false,
    terms: false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="About Us" />

      <div className="px-4 pt-6 pb-8 overflow-y-auto flex flex-col gap-3">
        {sections.map((section) => {
          const isExpanded = expandedSections[section.id];
          const previewText = section.content.substring(0, 100) + '...';

          return (
            <div key={section.id} className="bg-card rounded-xl p-4">
              <button
                className="w-full flex items-center justify-between mb-3"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center flex-1">
                  <div className="w-[3px] h-5 bg-accent rounded-sm mr-3" />
                  <span className="text-base font-semibold text-text-primary">{section.title}</span>
                </div>
                {isExpanded ? (
                  <span className="text-text-primary font-semibold text-lg">--</span>
                ) : (
                  <Plus size={24} className="text-text-primary" />
                )}
              </button>
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {isExpanded ? section.content : previewText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
