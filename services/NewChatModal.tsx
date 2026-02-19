import React, { useState, useMemo } from 'react';
import { X, Search, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  image?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: Contact) => void;
  contacts: Contact[];
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser, contacts }) => {
  const [search, setSearch] = useState('');

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const lowerSearch = search.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(lowerSearch) ||
      c.role.toLowerCase().includes(lowerSearch)
    );
  }, [contacts, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">New Message</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm focus:outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectUser(contact)}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-blue-200">
                  {contact.image ? (
                    <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{contact.name}</div>
                  <div className="text-xs text-gray-500">{contact.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};