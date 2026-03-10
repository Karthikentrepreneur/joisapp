import React, { useState } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
  contacts: any[];
  loading?: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser, contacts, loading }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">New Message</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search people..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div> : filtered.map(user => (
            <button key={user.id} onClick={() => onSelectUser(user)} className="w-full p-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {user.image ? <img src={user.image} className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};