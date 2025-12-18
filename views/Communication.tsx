import React, { useState } from 'react';
import { mockNotices, mockChats } from '../data/mockData';
import { UserRole, Notice } from '../types';
import { Bell, Search, Send, MessageSquare, MoreVertical, Paperclip, X, Save, Plus } from 'lucide-react';

interface CommunicationProps {
  role?: UserRole;
}

export const Communication: React.FC<CommunicationProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'chat'>('notices');
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messageInput, setMessageInput] = useState('');
  
  // Create Notice State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState<Partial<Notice>>({
    title: '',
    content: '',
    priority: 'Medium',
    sender: role === UserRole.ADMIN ? 'Principal Office' : 'Teacher'
  });

  const canCreate = role === UserRole.ADMIN || role === UserRole.TEACHER;

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Notice = {
      ...newNotice,
      id: `N-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sender: role === UserRole.ADMIN ? 'Principal Office' : 'Teacher'
    } as Notice;
    
    setNotices([created, ...notices]);
    setShowCreateModal(false);
    setNewNotice({ title: '', content: '', priority: 'Medium' });
  };

  return (
    <div className="p-4 md:p-6 h-full md:h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Communication Center</h2>
          <p className="text-sm md:text-base text-slate-500">School-wide announcements and messaging.</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('notices')}
             className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-md transition-all ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Notice Board
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-md transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Messages
           </button>
        </div>
      </div>

      {activeTab === 'notices' ? (
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-6">
            {/* Create Card - Only for Admin/Teacher */}
            {canCreate && (
              <div 
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group h-auto min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                  <Plus className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                </div>
                <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Create New Notice</p>
              </div>
            )}

            {notices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-auto md:h-fit min-h-[200px]">
                 <div className={`h-1.5 w-full ${notice.priority === 'High' ? 'bg-red-500' : notice.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                 <div className="p-5 md:p-6 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${notice.priority === 'High' ? 'bg-red-50 text-red-600' : notice.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                        {notice.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{notice.date}</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{notice.title}</h3>
                   <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                     {notice.content}
                   </p>
                   <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <Bell className="w-4 h-4 text-slate-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-600">{notice.sender}</p>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
           {/* Chat Sidebar */}
           <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/50 ${selectedChat ? 'hidden md:flex' : 'flex'} h-full`}>
              <div className="p-4 border-b border-slate-200 bg-white md:bg-transparent">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                 <div onClick={() => setSelectedChat('1')} className="p-3 hover:bg-blue-50 cursor-pointer border-l-4 border-blue-600 bg-white">
                    <div className="flex justify-between mb-1">
                       <h4 className="font-semibold text-sm text-slate-800">Mrs. Johnson</h4>
                       <span className="text-[10px] text-slate-400">10:45 AM</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">Hello Mr. Wilson, Liam has been improving...</p>
                 </div>
                 {['Principal Desk', 'Transport Admin', 'Science Dept'].map((name, i) => (
                   <div key={i} className="p-3 hover:bg-white cursor-pointer border-l-4 border-transparent">
                      <div className="flex justify-between mb-1">
                         <h4 className="font-semibold text-sm text-slate-700">{name}</h4>
                         <span className="text-[10px] text-slate-400">Yesterday</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">Click to view conversation...</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Chat Area */}
           <div className={`flex-1 flex flex-col bg-white ${!selectedChat ? 'hidden md:flex' : 'flex'} h-full`}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                 <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedChat(null)} className="md:hidden p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-full">
                        <MoreVertical className="w-5 h-5 rotate-90" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">MJ</div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">Mrs. Johnson</h3>
                       <p className="text-xs text-green-600 font-medium">Online</p>
                    </div>
                 </div>
                 <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
                 <div className="flex justify-center mb-4">
                    <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Today</span>
                 </div>
                 {mockChats.map((msg) => (
                   <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                         <p>{msg.text}</p>
                         <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                           {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-3 md:p-4 border-t border-slate-100 bg-white">
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                       <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 bg-white outline-none text-sm text-slate-700 placeholder-slate-400 min-w-0"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                       <Send className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Notice Creation Modal */}
      {showCreateModal && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">New Announcement</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleCreateNotice} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <div className="flex gap-2">
                       {['Low', 'Medium', 'High'].map((p) => (
                          <button
                             key={p}
                             type="button"
                             onClick={() => setNewNotice({...newNotice, priority: p as any})}
                             className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                newNotice.priority === p 
                                   ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                                   : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                             }`}
                          >
                             {p}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                      required 
                      type="text" 
                      value={newNotice.title} 
                      onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Annual Day Rehearsal"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Announcement Content</label>
                    <textarea 
                      required 
                      value={newNotice.content} 
                      onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                      placeholder="Write your message to the parents..."
                    />
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all"><Save className="w-4 h-4" /> Post Notice</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};