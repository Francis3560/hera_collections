import React from 'react';
import { Users, User, BookOpen, Settings } from 'lucide-react';

interface UserTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const UserTabs: React.FC<UserTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'User Overview', icon: Users },
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'history', label: 'Login History', icon: BookOpen },
    { id: 'settings', label: 'User Settings', icon: Settings },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }
            `}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default UserTabs;