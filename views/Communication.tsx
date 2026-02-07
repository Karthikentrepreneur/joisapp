import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { UserRole, ProgramType, Notice } from '../types';
import { 
  Plus, 
  X, 
  Search, 
  Send, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { ToastType } from '../components/Toast';

interface CommunicationProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const Communication: React.FC<CommunicationProps> = ({ role, showToast }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState<'All' | ProgramType>('All');
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState<Partial<Notice>>({
    title: '', content: '', priority: 'Medium', targetGroup: 'All'
  });

  const loadNotices = async () => {
    setLoading(true);
    const data = await db.getAll('notices');
    setNotices(data.sort((a, b) => b.date.localeCompare(a.date)));
    setLoading(false);
  };

  useEffect(() => { loadNotices(); }, []);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const notice: Notice = {
        ...formData as any,
        id: `N-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        sender: role === 'Admin' ? 'School Office' : 'Teacher'
      };
      await db.create('notices', notice);
      showToast?.("Message Sent", "success", "Your message is now on the board.");
      setShowAddModal(false);
      loadNotices();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-5 h-full flex flex-col animate-in fade-in duration-500 overflow-hidden max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
           <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages Board</h2>
           <p className="text-slate-500 text-[12px] font-medium">Important news for everyone.</p>
        </div>
        {role === UserRole.ADMIN && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Write New Message
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Search for messages..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-medium text-slate-700 outline-none" />
         </div>
         <select value={filterGroup} onChange={e => setFilterGroup(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase outline-none shadow-sm">
            <option value="All">All Classes</option>
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
         </select>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
         {loading ? (
           <div className="col-span-full flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-200" /></div>
         ) : notices.filter(n => filterGroup === 'All' || n.targetGroup === filterGroup).map(notice => (
            <div key={notice.id} className="pro-card p-5 flex flex-col group hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${notice.priority === 'High' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'}`}>{notice.priority === 'High' ? 'Urgent' : 'Normal'}</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{notice.date}</p>
               </div>
               <h3 className="text-base font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{notice.title}</h3>
               <p className="text-slate-500 font-medium text-[12px] leading-relaxed mb-6 flex-1">{notice.content}</p>
               <div className="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">For Class: {notice.targetGroup}</p>
                  <FileText className="w-3.5 h-3.5 text-slate-200" />
               </div>
            </div>
         ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl relative border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-extrabold text-slate-900 uppercase">Write New Message</h3>
                 <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handlePostNotice} className="space-y-4">
                 <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-xs font-bold outline-none" /></div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Importance</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white outline-none"><option value="Medium">Normal</option><option value="High">Urgent</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">For Which Class?</label><select value={formData.targetGroup} onChange={e => setFormData({...formData, targetGroup: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white outline-none"><option value="All">Everyone</option>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type Message</label><textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-xs font-medium h-24 resize-none" /></div>
                 <button type="submit" disabled={isSending} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-[11px]">
                    {isSending ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-3.5 h-3.5" /> Post Message</>}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};