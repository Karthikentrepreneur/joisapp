import React, { useState, useEffect } from 'react';
import { schoolService } from '../services/schoolService';
import { CreateAnnouncementModal } from '../services/CreateAnnouncementModal';
import { ChatWindow } from '../services/ChatWindow';
import { ChatSidebar } from '../components/ChatSidebar';
import { NewChatModal } from '../components/NewChatModal';
import { UserRole, Announcement } from '../types';
import { Megaphone, MessageSquare, Plus } from 'lucide-react';

interface CommunicationProps {
  role: UserRole;
  currentUser: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Communication: React.FC<CommunicationProps> = ({ role, currentUser, showToast }) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'chats'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<{ id: string; name: string; role: string; image?: string } | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { name: string; role: string; image?: string }>>({});
  const [isCreateModalOpen, setOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [role, activeTab]);

  const loadData = async () => {
    if (activeTab === 'announcements') {
      const data = await schoolService.getAnnouncements(role, currentUser.classAssigned || currentUser.childClassId);
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      const allThreads = await schoolService.getAllThreads();
      // Filter threads where current user is a participant
      const myThreads = allThreads.filter((t: any) => t.participants.includes(currentUser.id));
      setThreads(myThreads);
      
      // Build User Map to resolve names in Sidebar
      const students = await schoolService.getAll('students');
      const staff = await schoolService.getAll('staff');
      const map: any = {};
      
      students.forEach((s: any) => {
        map[s.id] = { name: s.name, role: 'Student', image: s.image };
        // Also map parent ID to student name (or parent name if available)
        if (s.parentId) map[s.parentId] = { name: `${s.name}'s Parent`, role: 'Parent' };
      });
      
      staff.forEach((s: any) => {
        map[s.id] = { name: s.name, role: s.role, image: s.image };
      });
      
      // Add current user
      map[currentUser.id] = { name: currentUser.name, role: role };
      
      setUserMap(map);
    }
  };

  const handlePostNotice = async (data: { title: string; message: string; classId: string | null; attachments: any[] }) => {
    try {
      await schoolService.createAnnouncement({
        title: data.title,
        message: data.message,
        createdBy: currentUser.id,
        role: currentUser.role,
        classId: data.classId,
        attachments: data.attachments
      });
      showToast('Announcement posted successfully', 'success');
      loadData();
    } catch (error) {
      console.error("Failed to create announcement:", error);
      showToast('Failed to post announcement', 'error');
    }
  };

  const handleThreadSelect = (threadId: string) => {
    const thread = threads.find(t => t.threadId === selectedThreadId);
    if (thread) {
      const otherId = thread.participants.find((p: string) => p !== currentUser.id);
      if (otherId) {
        setActiveRecipient({ id: otherId, ...(userMap[otherId] || { name: 'Unknown', role: 'User' }) });
      }
    }
  };

  // Calculate selected thread ID based on active recipient to highlight in sidebar
  const selectedThreadId = activeRecipient ? [currentUser.id, activeRecipient.id].sort().join(':') : null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'announcements' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chats' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
          </button>
        </div>

        {activeTab === 'announcements' && (role === UserRole.ADMIN || role === UserRole.FOUNDER) && (
          <button 
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'announcements' ? (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {item.role}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {item.classId ? (
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                          {item.classId}
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                          All Classes
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{item.message}</p>
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 overflow-x-auto">
                        {item.attachments.map((att, idx) => (
                          <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100">
                            📎 {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex">
            <ChatSidebar 
              currentUser={{ id: currentUser.id, name: currentUser.name, role }}
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThread={handleThreadSelect}
              userMap={userMap}
              onNewChat={() => setIsNewChatOpen(true)}
            />
            <div className="flex-1 bg-gray-50/50">
              {activeRecipient ? (
                <ChatWindow 
                  currentUser={{ id: currentUser.id, name: currentUser.name, role }}
                  recipient={activeRecipient}
                  onClose={() => setActiveRecipient(null)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                  <p>Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setOpen(false)}
        onSubmit={handlePostNotice}
        userRole={role}
        userClassId={currentUser.classAssigned || currentUser.childClassId}
      />

      <NewChatModal 
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={(user) => {
          setActiveRecipient(user);
          setIsNewChatOpen(false);
        }}
        contacts={Object.entries(userMap).map(([id, u]) => ({ id, ...u })).filter(u => u.id !== currentUser.id)}
      />
    </div>
  );
};