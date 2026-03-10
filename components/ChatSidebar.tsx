import React from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { UserRole } from '../types';

interface ChatSidebarProps {
  currentUser: { id: string; name: string; role: UserRole };
  threads: any[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  userMap: Record<string, { name: string; role: string; image?: string }>;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ currentUser, threads, selectedThreadId, onSelectThread, userMap, onNewChat }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <button onClick={onNewChat} className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-black transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> New Message
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          threads.map((thread) => {
            const otherId = thread.participants.find((p: string) => p !== currentUser.id);
            const otherUser = userMap[otherId] || { name: 'Unknown', role: '' };
            const isSelected = selectedThreadId === thread.threadId;
            
            return (
              <button
                key={thread.threadId}
                onClick={() => onSelectThread(thread.threadId)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {otherUser.image ? <img src={otherUser.image} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500">{otherUser.name.charAt(0)}</span>}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{otherUser.name}</h4>
                    {thread.unreadCount > 0 && <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{thread.unreadCount}</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{thread.lastMessage?.text || 'Start of conversation'}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};