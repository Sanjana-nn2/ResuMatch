import React from 'react';
import { Target, GitCompare, History, Activity, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'analyze', label: 'Match', icon: Target },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'history', label: 'History', icon: History },
    { id: 'admin', label: 'System', icon: Activity },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-md border-t border-[#1E293B] safe-pb">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-colors duration-150 ${
                isActive
                  ? 'text-[#10B981] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className="text-[11px] font-sans tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
