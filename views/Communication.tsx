import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import { cryptoService } from '../services/cryptoService';
import { UserRole, Notice, ChatMessage, Conversation, Staff, Student } from '../types';
import { 
  Bell, 
  Search, 
  Send, 
  MessageSquare, 
  MoreVertical, 
  Paperclip, 
  X, 
  Plus,
  ChevronLeft,
  Loader2,
  CheckCheck,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { CURRENT_USER_ID, getMyChild } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface CommunicationProps {
  role: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

export const Communication: React.FC<CommunicationProps> = ({ role, showToast }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'chat'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [selectedThread, setSelectedThread] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const child = getMyChild();
  const currentUserName = role === UserRole.PARENT ? child?.parentName : 
                        role === UserRole.TEACHER ? 'Sarah Johnson' : 
                        role === UserRole.ADMIN ? 'Robert Principal' : 'Transport Desk';

  const currentUserId = role === UserRole.PARENT ? child?.parentId : 
                      role === UserRole.TEACHER ? 'TCH-001' : 
                      role === UserRole.ADMIN ? 'ADM-001' : 'TRN-001';

  const loadData = async () => {
    setLoading(true);
    try {
      const [allNotices, allChats, allStaff, allStudents] = await Promise.all([
        db.getAll('notices'),
        db.getAll('chats'),
        db.getAll('staff'),
        db.getAll('students')
      ]);

      setNotices(allNotices.sort((a, b) => b.id.localeCompare(a.id)));
      
      const myChats = allChats.filter(c => 
        c.senderId === currentUserId || 
        c.receiverId === currentUserId || 
        c.receiverId === 'ALL'
      );
      setMessages(myChats);

      const directory: Conversation[] = [];
      if (role === UserRole.PARENT) {
        allStaff.forEach(s => {
          directory.push({ id: s.id, participantId: s.id, participantName: s.name, participantRole: s.role as any, lastMessage: '', lastTimestamp: '', unreadCount: 0 });
        });
      } else if (role === UserRole.TEACHER) {
        allStudents.forEach(s => {
          directory.push({ id: s.parentId, participantId: s.parentId, participantName: s.parentName, participantRole: UserRole.PARENT, lastMessage: '', lastTimestamp: '', unreadCount: 0 });
        });
        allStaff.filter(s => s.role === 'Admin').forEach(s => {
          directory.push({ id: s.id, participantId: s.id, participantName: s.name, participantRole: UserRole.ADMIN, lastMessage: '', lastTimestamp: '', unreadCount: 0 });
        });
      } else {
        allStaff.forEach(s => { if (s.id !== currentUserId) directory.push({ id: s.id, participantId: s.id, participantName: s.name, participantRole: s.role as any, lastMessage: '', lastTimestamp: '', unreadCount: 0 }); });
        allStudents.forEach(s => { directory.push({ id: s.parentId, participantId: s.parentId, participantName: s.parentName, participantRole: UserRole.PARENT, lastMessage: '', lastTimestamp: '', unreadCount: 0 }); });
      }

      setConversations(directory);
    } catch (e) {
      console.error("Database fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Real-time listeners
    const chatSub = db.subscribe('chats', (newMsg: ChatMessage) => {
      // Only add if it belongs to me
      if (newMsg.senderId === currentUserId || newMsg.receiverId === currentUserId || newMsg.receiverId === 'ALL') {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    const noticeSub = db.subscribe('notices', (newNotice: Notice) => {
      setNotices(prev => {
        if (prev.find(n => n.id === newNotice.id)) return prev;
        return [newNotice, ...prev];
      });
    });

    return () => {
      chatSub?.unsubscribe();
      noticeSub?.unsubscribe();
    };
  }, [role, currentUserId]);

  // Handle Decryption when thread or global messages change
  useEffect(() => {
    const decryptAll = async () => {
      if (!selectedThread) return;
      const threadId = [currentUserId, selectedThread.participantId].sort().join(':');
      const newMap = { ...decryptedMessages };
      let changed = false;

      for (const msg of messages) {
        if (!newMap[msg.id] && msg.receiverId !== 'ALL') {
          newMap[msg.id] = await cryptoService.decrypt(msg.text, threadId);
          changed = true;
        }
      }
      if (changed) setDecryptedMessages(newMap);
    };
    decryptAll();
  }, [messages, selectedThread, currentUserId]);

  const currentThreadMessages = selectedThread
    ? messages.filter(m => 
        m.receiverId === 'ALL' ||
        (m.senderId === currentUserId && m.receiverId === selectedThread.participantId) ||
        (m.senderId === selectedThread.participantId && m.receiverId === currentUserId)
      )
    : [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentThreadMessages, decryptedMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread || !currentUserId) return;
    setIsSending(true);
    try {
      // sendMessage creates the record in DB, which triggers our real-time listener
      await schoolService.sendMessage(currentUserId, currentUserName || 'Unknown', role, selectedThread.participantId, messageInput);
      setMessageInput('');
      showToast?.("Message Encrypted & Sent", "success", "End-to-end handshake complete.");
    } catch (e) {
      showToast?.("Database Error", "error", "Failed to reach secure server.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-in fade-in duration-500 overflow-hidden max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Communication</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            AES-256 Cloud Encrypted Pipeline
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner border border-slate-200">
          <button onClick={() => setActiveTab('notices')} className={`px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Notice Board</button>
          <button onClick={() => setActiveTab('chat')} className={`px-8 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Private Chats</button>
        </div>
      </div>

      {activeTab === 'notices' ? (
        <div className="flex-1 overflow-y-auto space-y-6 pb-20 scroll-smooth">
           {(role !== UserRole.PARENT) && (
              <div onClick={() => setShowCreateNotice(true)} className="group cursor-pointer bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 group-hover:scale-110 transition-transform"><Plus className="w-7 h-7 text-blue-500" /></div>
                 <span className="font-black text-slate-400 uppercase tracking-widest text-[11px] group-hover:text-blue-600">Post a new announcement</span>
              </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map(notice => (
                <div key={notice.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group h-full">
                   <div className={`h-2 w-full ${notice.priority === 'High' ? 'bg-rose-500' : notice.priority === 'Medium' ? 'bg-yellow-400' : 'bg-blue-500'}`}></div>
                   <div className="p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${notice.priority === 'High' ? 'bg-rose-500 text-white' : notice.priority === 'Medium' ? 'bg-yellow-400 text-slate-900' : 'bg-blue-600 text-white'}`}>{notice.priority}</span>
                         <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{notice.date}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{notice.title}</h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6 flex-1 line-clamp-4">{notice.content}</p>
                      <div className="flex items-center gap-4 pt-6 border-t border-slate-50 mt-auto">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><Bell className="w-5 h-5" /></div>
                         <div><p className="text-xs font-black text-slate-800 uppercase tracking-tight">{notice.sender}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized Broadcast</p></div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
           <div className={`w-full md:w-80 border-r border-slate-50 flex flex-col bg-slate-50/50 ${selectedThread ? 'hidden md:flex' : 'flex'} h-full`}>
              <div className="p-6 bg-white border-b border-slate-100">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search contacts..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Secured Directory</p>
                 {conversations.map(conv => (
                    <div key={conv.participantId} onClick={() => setSelectedThread(conv)} className={`flex items-center gap-4 p-4 rounded-[1.5rem] cursor-pointer transition-all border ${selectedThread?.participantId === conv.participantId ? 'bg-white border-blue-200 shadow-lg ring-4 ring-blue-50' : 'hover:bg-white hover:border-slate-200 border-transparent'}`}>
                       <div className="relative">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm ${conv.participantRole === UserRole.ADMIN ? 'bg-purple-600' : conv.participantRole === UserRole.TEACHER ? 'bg-blue-600' : conv.participantRole === UserRole.TRANSPORT ? 'bg-amber-500' : 'bg-pink-500'}`}>
                           {conv.participantName.charAt(0)}
                         </div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-black truncate text-slate-800">{conv.participantName}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{conv.participantRole}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className={`flex-1 flex flex-col bg-white ${!selectedThread ? 'hidden md:flex' : 'flex'} h-full`}>
              {selectedThread ? (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white shadow-sm z-10">
                     <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedThread(null)} className="md:hidden p-2 bg-slate-100 rounded-xl text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${selectedThread.participantRole === UserRole.ADMIN ? 'bg-purple-600' : 'bg-blue-600'}`}>{selectedThread.participantName.charAt(0)}</div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg">{selectedThread.participantName}</h3>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">End-to-End Encrypted</span>
                          </div>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20" ref={scrollRef}>
                     {currentThreadMessages.map((msg) => {
                       const isMine = msg.senderId === currentUserId;
                       const text = decryptedMessages[msg.id] || (msg.receiverId === 'ALL' ? msg.text : 'Decrypting cipher...');
                       return (
                         <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            {msg.receiverId === 'ALL' && (
                              <div className="w-full flex justify-center mb-4">
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">School Broadcast</span>
                              </div>
                            )}
                            <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm font-medium leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'}`}>
                               <p>{text}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && <CheckCheck className="w-3 h-3 text-blue-500" />}
                            </div>
                         </div>
                       );
                     })}
                  </div>
                  <div className="p-6 bg-white border-t border-slate-100">
                     <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-[2rem] px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all">
                        <button className="p-2.5 text-slate-400 hover:text-blue-600 rounded-full transition-colors"><Paperclip className="w-5 h-5" /></button>
                        <input type="text" placeholder="Type your secure message..." className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <button onClick={handleSendMessage} disabled={!messageInput.trim() || isSending} className="w-12 h-12 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center transition-all disabled:opacity-50">
                          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                   <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-blue-500 mb-6 shadow-xl border border-slate-100 animate-pulse"><ShieldCheck className="w-12 h-12" /></div>
                   <h3 className="text-2xl font-black text-slate-900 mb-2">Vaulted Messaging</h3>
                   <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">Your messages are encrypted before they ever reach the Supabase cloud. Total privacy ensured.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {showCreateNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative">
              <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-slate-900">Broadcast Notice</h3><button onClick={() => setShowCreateNotice(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"><X className="w-6 h-6" /></button></div>
              <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); schoolService.sendBroadcast(currentUserId || 'UNKNOWN', currentUserName || 'User', role, formData.get('content') as string, formData.get('priority') as any).then(() => { loadData(); setShowCreateNotice(false); showToast?.("Notice Broadcasted", "success", "All users have been notified via the global hub."); }); }} className="space-y-6">
                 <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label><select name="priority" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"><option value="Low">Low - Informational</option><option value="Medium" selected>Medium - Action Required</option><option value="High">High - Emergency Alert</option></select></div>
                 <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</label><textarea name="content" required placeholder="Write your announcement..." className="w-full px-6 py-5 border-2 border-slate-100 rounded-[1.5rem] text-sm font-semibold h-40 resize-none transition-all focus:border-blue-500" /></div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95">Send to Cloud Hub <Bell className="w-5 h-5" /></button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
