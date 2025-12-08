import React, { useState } from 'react';
import { mockNotices, mockChats } from '../data/mockData';
import { Bell, Search, Send, MessageSquare, MoreVertical, Paperclip } from 'lucide-react';

export const Communication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'chat'>('notices');
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messageInput, setMessageInput] = useState('');

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Communication Center</h2>
          <p className="text-slate-500">School-wide announcements and parent-teacher messaging.</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('notices')}
             className={`flex-1 md:flex-none px-4 py-1.5 rounded-md transition-all ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Notice Board
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 md:flex-none px-4 py-1.5 rounded-md transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Messages
           </button>
        </div>
      </div>

      {activeTab === 'notices' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
          {mockNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-fit">
               <div className={`h-1.5 w-full ${notice.priority === 'High' ? 'bg-red-500' : notice.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
               <div className="p-6 flex-1">
                 <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${notice.priority === 'High' ? 'bg-red-50 text-red-600' : notice.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                      {notice.priority} Priority
                    </span>
                    <span className="text-xs text-slate-400">{notice.date}</span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">{notice.title}</h3>
                 <p className="text-sm text-slate-600 leading-relaxed mb-4">
                   {notice.content}
                 </p>
                 <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                      <Bell className="w-3 h-3 text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">{notice.sender}</p>
                 </div>
               </div>
            </div>
          ))}
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group h-64">
             <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
               <Bell className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
             </div>
             <p className="font-medium text-sm">Create New Notice</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col md:flex-row overflow-hidden">
           {/* Chat Sidebar */}
           <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/50 ${selectedChat ? 'hidden md:flex' : 'flex'} h-full`}>
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none" />
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
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-500 mr-2">
                        ←
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">MJ</div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">Mrs. Johnson</h3>
                       <p className="text-xs text-green-600">Online</p>
                    </div>
                 </div>
                 <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                 <div className="flex justify-center mb-4">
                    <span className="bg-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-full uppercase tracking-wide">Today</span>
                 </div>
                 {mockChats.map((msg) => (
                   <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                         <p>{msg.text}</p>
                         <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                           {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2">
                    <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                       <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
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
    </div>
  );
};