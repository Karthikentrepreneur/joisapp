import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { UserRole, Announcement, ProgramType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  userRole: UserRole;
  initialData?: Announcement | null;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const CreateAnnouncementModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, userRole, initialData }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setMessage(initialData.message);
      setTarget(initialData.classId || 'All');
    } else {
      setTitle(''); setMessage(''); setTarget('All');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 text-lg">{initialData ? 'Edit Notice' : 'Post New Notice'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, message, classId: target === 'All' ? null : target, isPinned: false }); }}>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Audience</label><select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm font-bold bg-white"><option value="All">All School</option>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label><textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm h-32 resize-none" /></div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 flex justify-center gap-2"><Send className="w-4 h-4" /> Post Notice</button>
          </div>
        </form>
      </div>
    </div>
  );
};