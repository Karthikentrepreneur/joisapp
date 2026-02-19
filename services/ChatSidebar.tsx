import React from 'react';
import { UserRole, ChatMessage } from '../types';
import { Search, Plus } from 'lucide-react';

interface ChatThread {
  threadId: string;
  participants: string[];
  lastMessage: ChatMessage;
  messageCount: number;
}

interface ChatSidebarProps {
  currentUser: { id: string; name: string; role: UserRole };
  threads: ChatThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  userMap: Record<string, { name: string; role: string; image?: string }>;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  currentUser, 
  threads, 
  selectedThreadId, 
  onSelectThread,
  userMap,
  onNewChat
}) => {
  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <button 
          onClick={onNewChat}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {threads.map(thread => {
          const otherId = thread.participants.find(p => p !== currentUser.id) || thread.participants[0];
          const otherUser = userMap[otherId] || { name: 'Unknown User', role: 'Unknown' };
          const isSelected = selectedThreadId === thread.threadId;
          
          return (
            <div 
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {otherUser.name}
                </h4>
                <span className="text-[10px] text-gray-400">
                  {new Date(thread.lastMessage.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {thread.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                {thread.lastMessage.text}
              </p>
            </div>
          );
        })}
        
        {threads.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No conversations yet.
          </div>
        )}
      </div>
    </div>
  );
};