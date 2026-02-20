import React, { useState, useEffect } from 'react';
import { schoolService } from '../services/schoolService';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { ChatWindow } from './ChatWindow';
import { ChatSidebar } from './ChatSidebar';
import { NewChatModal } from './NewChatModal';
import { UserRole, Announcement } from '../types';
import { Megaphone, MessageSquare, Plus, Trash2, Edit, Pin, Eye, Heart } from 'lucide-react';

interface CommunicationProps {
  role: UserRole;
  currentUser: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Communication: React.FC<CommunicationProps> = ({ role, currentUser, showToast }) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'chats'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<{ id: string; name: string; role: string; image?: string } | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { name: string; role: string; image?: string }>>({});
  const [isCreateModalOpen, setOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [role, activeTab, currentUser]);

  const loadData = async () => {
    // Always fetch threads to update unread count badge
    const allThreads = await schoolService.getAllThreads(currentUser.id);
    const myThreads = allThreads.filter((t: any) => t.participants.includes(currentUser.id));
    const totalUnread = myThreads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
    setUnreadCount(totalUnread);

    if (activeTab === 'announcements') {
      const userClassId = currentUser.classAssigned || currentUser.class_assigned || currentUser.childClassId || currentUser.child_class_id || currentUser.classId || currentUser.class_id || currentUser.program;
      const data = await schoolService.getAnnouncements(role, userClassId, currentUser.id);
      setAnnouncements(data.sort((a, b) => {
        // Sort by pinned status first (pinned items come first)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    } else {
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

  const handleMarkAsRead = async (announcement: Announcement) => {
    if (!announcement.readBy?.includes(currentUser.id)) {
      await schoolService.markAnnouncementAsRead(announcement.id, currentUser.id);
      setAnnouncements(prev => prev.map(a => 
        a.id === announcement.id 
          ? { ...a, readBy: [...(a.readBy || []), currentUser.id] } 
          : a
      ));
    }
  };

  const handleLikeAnnouncement = async (id: string) => {
    try {
      const updatedLikes = await schoolService.toggleAnnouncementLike(id, currentUser.id);
      setAnnouncements(prev => prev.map(a => 
        a.id === id ? { ...a, likes: updatedLikes } : a
      ));
    } catch (error) {
      console.error("Failed to like announcement:", error);
    }
  };

  const handlePostNotice = async (data: { title: string; message: string; classId: string | null; attachments: any[]; isPinned: boolean }) => {
    try {
      if (editingAnnouncement) {
        await schoolService.updateAnnouncement(editingAnnouncement.id, {
          title: data.title,
          message: data.message,
          classId: data.classId,
          attachments: data.attachments,
          isPinned: data.isPinned
        });
        showToast('Announcement updated successfully', 'success');
      } else {
        await schoolService.createAnnouncement({
          title: data.title,
          message: data.message,
          createdBy: currentUser.id,
          role: role,
          classId: data.classId,
          attachments: data.attachments,
          isPinned: data.isPinned
        });
        showToast('Announcement posted successfully', 'success');
      }
      loadData();
      setEditingAnnouncement(null);
    } catch (error) {
      console.error("Failed to save announcement:", error);
      showToast('Failed to save announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await schoolService.deleteAnnouncement(id);
        showToast('Announcement deleted successfully', 'success');
        loadData();
      } catch (error) {
        console.error("Failed to delete announcement:", error);
        showToast('Failed to delete announcement', 'error');
      }
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 sticky top-0 z-10 shadow-sm md:shadow-none">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
            className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chats' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'announcements' && (role === UserRole.ADMIN || role === UserRole.TEACHER) && (
          <button 
            onClick={() => {
              setEditingAnnouncement(null);
              setOpen(true);
            }}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'announcements' ? (
          <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-50/50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-0">
              {announcements.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleMarkAsRead(item)}
                    className={`group relative border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full cursor-pointer ${
                      (item.isPinned || !item.readBy?.includes(currentUser.id)) 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50/30 border-yellow-200' 
                        : 'bg-white border-gray-100 hover:border-blue-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          {item.isPinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600 rotate-45" />}
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {item.role}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500" title="Read by">
                            <Eye className="w-3 h-3" />
                            <span>{item.readBy?.length ?? 0}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500" title="Likes">
                            <Heart className="w-3 h-3" />
                            <span>{item.likes?.length ?? 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {item.classId ? (
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                            {item.classId}
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                            All Classes
                          </span>
                        )}
                        {/* Action Buttons: Hidden for Parents completely */}
                        {role !== UserRole.PARENT && (
                          <div className="flex items-center gap-1 mt-1">
                            {/* Edit: Only the creator can edit */}
                            {item.createdBy === currentUser.id && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAnnouncement(item);
                                  setOpen(true);
                                }}
                                className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-blue-50"
                                title="Edit Announcement"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {/* Delete: Admins/Founders can delete ALL. Teachers can ONLY delete THEIR OWN. */}
                            {((role === UserRole.ADMIN || role === UserRole.FOUNDER) || (role === UserRole.TEACHER && item.createdBy === currentUser.id)) && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnouncement(item.id);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                                title="Delete Announcement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{item.message}</p>
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 overflow-x-auto">
                        {item.attachments.map((att, idx) => (
                          <a 
                            key={idx} 
                            href={att.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            📎 {att.name}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50/50 mt-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeAnnouncement(item.id);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          item.likes?.includes(currentUser.id) 
                            ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                            : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                        <span>{item.likes?.includes(currentUser.id) ? 'Liked' : 'Like'}</span>
                      </button>
                      
                      {item.likes && item.likes.length > 0 && (
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[10px] text-rose-600 font-bold">
                             {item.likes.length}
                           </div>
                        </div>
                      )}
                    </div>
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
        onClose={() => {
          setOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handlePostNotice}
        userRole={role}
        userClassId={currentUser.classAssigned || currentUser.class_assigned || currentUser.childClassId || currentUser.child_class_id || currentUser.classId || currentUser.class_id || currentUser.program}
        initialData={editingAnnouncement}
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