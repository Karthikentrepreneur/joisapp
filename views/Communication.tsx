import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { UserRole, ProgramType, Notice } from '../types';
import { 
  Plus, 
  X, 
  Search, 
  Send, 
  Loader2, 
  FileText,
  Bell,
  Filter
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
  const [searchQuery, setSearchQuery] = useState('');
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
        sender: role === UserRole.ADMIN ? 'School Office' : 'Teacher'
      };
      await db.create('notices', notice);
      showToast?.("Message Sent", "success", "Your message is now on the board.");
      setShowAddModal(false);
      setFormData({ title: '', content: '', priority: 'Medium', targetGroup: 'All' });
      loadNotices();
    } finally {
      setIsSending(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesGroup = filterGroup === 'All' || n.targetGroup === filterGroup;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden max-w-[1600px] mx-auto w-full">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Messages Board</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Broadcast updates and important news to the community.</p>
        </div>

        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="group bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-3"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
            Create Announcement
          </button>
        )}
      </div>

      {/* --- FILTER BAR --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-transparent rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-200 outline-none transition-all" 
            />
         </div>
         <div className="flex items-center gap-2 px-2 border-l border-slate-100">
           <Filter className="w-4 h-4 text-slate-400 ml-2" />
           <select 
              value={filterGroup} 
              onChange={e => setFilterGroup(e.target.value as any)} 
              className="bg-transparent pr-8 py-2 text-xs font-bold uppercase text-slate-600 outline-none cursor-pointer"
            >
              <option value="All">All Audiences</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
           </select>
         </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
         {loading ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20">
             <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-tighter text-xs">Loading Feed...</p>
           </div>
         ) : filteredNotices.length > 0 ? (
           filteredNotices.map(notice => (
            <div key={notice.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden">
               {/* Priority Indicator */}
               <div className={`absolute top-0 right-0 h-1 w-full ${notice.priority === 'High' ? 'bg-rose-500' : 'bg-blue-500'}`} />
               
               <div className="flex justify-between items-start mb-5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    notice.priority === 'High' 
                    ? 'bg-rose-50 text-rose-600' 
                    : 'bg-blue-50 text-blue-600'
                  }`}>
                    {notice.priority === 'High' ? 'Urgent' : 'General'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold tabular-nums">{notice.date}</p>
               </div>

               <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">{notice.title}</h3>
               <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-1 line-clamp-4">{notice.content}</p>
               
               <div className="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {notice.sender[0]}
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">{notice.sender}</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-600/40 bg-blue-50/50 px-2 py-1 rounded uppercase tracking-tighter">
                    {notice.targetGroup}
                  </span>
               </div>
            </div>
          ))
         ) : (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
             <FileText className="w-12 h-12 text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold uppercase text-xs">No announcements found</p>
           </div>
         )}
      </div>

      {/* --- ADD MESSAGE MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-white/20 slide-in-from-bottom-8 duration-500">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Announcement</h3>
                    <p className="text-slate-400 text-xs font-medium">This will be visible to selected classes immediately.</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
               </div>

               <form onSubmit={handlePostNotice} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Subject Title</label>
                    <input 
                      required 
                      placeholder="e.g., Annual Sports Day Update"
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      className="w-full px-5 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Priority</label>
                        <select 
                          value={formData.priority} 
                          onChange={e => setFormData({...formData, priority: e.target.value as any})} 
                          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Medium">Normal Priority</option>
                          <option value="High">Urgent / High</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Target Audience</label>
                        <select 
                          value={formData.targetGroup} 
                          onChange={e => setFormData({...formData, targetGroup: e.target.value as any})} 
                          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="All">All Parents</option>
                          {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Detailed Message</label>
                    <textarea 
                      required 
                      placeholder="Write your announcement here..."
                      value={formData.content} 
                      onChange={e => setFormData({...formData, content: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-700 h-32 resize-none outline-none transition-all" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSending} 
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-xs disabled:opacity-70 disabled:grayscale"
                  >
                    {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-4 h-4" /> Broadcast Now</>}
                  </button>
               </form>
            </div>
        </div>
      )}
    </div>
  );
};
