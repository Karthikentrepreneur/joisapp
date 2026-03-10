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
  const [classTeacherMap, setClassTeacherMap] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [role, activeTab, currentUser]);

  const loadData = async () => {
    // Always fetch threads to update unread count badge
    const allThreads = await schoolService.getAllThreads(currentUser.id);
    const myThreads = allThreads.filter((t: any) => t.participants.includes(currentUser.id));
    const totalUnread = myThreads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
    setUnreadCount(totalUnread);

    // Fetch teacher map for Admin/Founder to display in CreateAnnouncementModal
    if (role === UserRole.ADMIN || role === UserRole.FOUNDER) {
      const staff = await schoolService.getAll('staff');
      const map: Record<string, string> = {};
      if (staff) {
        staff.forEach((s: any) => {
          const assignedClass = s.classAssigned || s.class_assigned;
          if (s.role === 'Teacher' && assignedClass) {
            map[assignedClass] = s.name;
          }
        });
      }
      setClassTeacherMap(map);
    }

    if (activeTab === 'announcements') {
      let userClassId: string | string[] | undefined;

      // Strictly determine class ID based on role and schema to prevent incorrect visibility
      if (role === UserRole.TEACHER) {
         // Teachers are assigned via 'class_assigned' in staff table
         userClassId = currentUser.classAssigned || currentUser.class_assigned;
      } else if (role === UserRole.PARENT) {
         // Parents are linked to students who have 'program' in students table
         if (currentUser.children && Array.isArray(currentUser.children)) {
            userClassId = currentUser.children.map((c: any) => c.program || c.programType || c.classId || c.class_id).filter(Boolean);
         }
      } else {
         // Fallback for Student or other roles
         userClassId = currentUser.program || currentUser.programType || currentUser.classAssigned || currentUser.class_assigned;
      }

      const data = await schoolService.getAnnouncements(role, userClassId, currentUser.id);
      
      // Filter announcements to ensure users only see relevant class content
      const filteredData = data.filter((item: Announcement) => {
        // Admins and Founders see everything
        if (role === UserRole.ADMIN || role === UserRole.FOUNDER) return true;
        
        // Public announcements (All Classes) are visible to everyone
        if (!item.classId || item.classId === 'All') return true;
        
        // Check if the announcement class matches the user's assigned class(es)
        if (Array.isArray(userClassId)) {
          return userClassId.includes(item.classId);
        }
        return item.classId === userClassId;
      });

      setAnnouncements(filteredData.sort((a, b) => {
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
      const allowedContacts: any[] = [];

      const addContact = (id: string, info: any) => {
        if (id !== currentUser.id && !allowedContacts.find(c => c.id === id)) {
          allowedContacts.push({ id, ...info });
        }
      };
      
      staff.forEach((s: any) => {
        map[s.id] = { name: s.name, role: s.role, image: s.image };
        
        if (role === UserRole.ADMIN) {
           if (s.role === 'Teacher' || s.role === 'Admin' || s.role === 'Founder') addContact(s.id, map[s.id]);
        } else if (role === UserRole.TEACHER) {
           // For teachers, only show Admins from the staff list. Parents and students are added later.
           if (s.role === 'Admin') addContact(s.id, map[s.id]);
        } else if (role === UserRole.PARENT) {
           if (s.role === 'Teacher') {
             // For parents, currentUser is the student object. Find the teacher for that student's class.
             const studentProgram = currentUser.program;
             const teacherProgram = s.classAssigned || s.class_assigned;
             if (studentProgram === teacherProgram) {
               addContact(s.id, map[s.id]);
             }
           }
           // Allow parents to see admins
           if (s.role === 'Admin') addContact(s.id, map[s.id]);
        }
      });
      
      students.forEach((s: any) => {
        map[s.id] = { name: s.name, role: 'Student', image: s.image };
        if (s.parentId) {
           const pName = s.fatherName || s.motherName || `${s.name}'s Parent`;
           const pInfo = { name: pName, role: 'Parent' };
           map[s.parentId] = pInfo;
           
           if (role === UserRole.ADMIN) {
             addContact(s.parentId, pInfo);
           } else if (role === UserRole.TEACHER) {
             const teacherClass = currentUser.classAssigned || currentUser.class_assigned;
             if (s.program === teacherClass) {
               addContact(s.parentId, pInfo); // Add parent
               addContact(s.id, map[s.id]); // Add student
             }
           }
        }
      });
      
      // Add current user
      map[currentUser.id] = { name: currentUser.name, role: role };
      
      setUserMap(map);
      setContacts(allowedContacts);
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

  const handleThreadSelect = (threadId: string) => { // Fix: Use the threadId argument
    const thread = threads.find(t => t.threadId === threadId);
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
                announcements.map((item) => {
                  const isUnread = !item.readBy?.includes(currentUser.id);
                  return (
                  <div 
                    key={item.id} 
                    onClick={() => handleMarkAsRead(item)}
                    className="pro-card p-6 flex flex-col group cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all"
                  >
                     <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">{item.classId || 'All Classes'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                     <p className="text-slate-500 text-sm mb-6 flex-1 whitespace-pre-wrap">{item.message}</p>

                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mb-4 flex gap-2 overflow-x-auto">
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

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">By: {item.role}</span>
                       <div className="flex items-center gap-2">
                         {role !== UserRole.PARENT && (
                           <div className="flex items-center gap-1">
                             {item.createdBy === currentUser.id && (
                               <button onClick={(e) => { e.stopPropagation(); setEditingAnnouncement(item); setOpen(true); }} className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                             )}
                             {((role === UserRole.ADMIN || role === UserRole.FOUNDER) || (item.createdBy === currentUser.id)) && (
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(item.id); }} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                             )}
                           </div>
                         )}
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleLikeAnnouncement(item.id); }}
                           className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all active:scale-95 ${
                             item.likes?.includes(currentUser.id) 
                               ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                               : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                           }`}
                         >
                           <Heart className={`w-3 h-3 ${item.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                           <span>{item.likes?.length ?? 0}</span>
                         </button>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                           item.isPinned 
                             ? 'bg-blue-500 text-white' 
                             : isUnread
                               ? 'bg-amber-500 text-white'
                               : 'bg-slate-100 text-slate-400'
                         }`}>
                           {item.isPinned ? 'Pinned' : isUnread ? 'New' : 'Read'}
                         </span>
                       </div>
                    </div>
                  </div>
                  )
                })
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
        userClassId={currentUser.classAssigned || currentUser.class_assigned || currentUser.childClassId || currentUser.child_class_id || currentUser.classId || currentUser.class_id || currentUser.program || currentUser.programType || currentUser.class}
        initialData={editingAnnouncement}
        classTeacherMap={classTeacherMap}
      />

      <NewChatModal 
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={(user) => {
          setActiveRecipient(user);
          setIsNewChatOpen(false);
        }}
        contacts={contacts}
      />
    </div>
  );
};