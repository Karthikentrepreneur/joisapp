import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Plus, Trash2, GraduationCap, Calendar,
  CheckCircle2, FileText, Filter, BarChart3,
} from 'lucide-react';
import { UserRole, Homework, ProgramType } from '../types';
import { schoolService } from '../services/schoolService';
import { CreateHomeworkModal } from '../services/CreateHomeworkModal';

interface TimetableItem {
  id: string;
  time: string;
  subject: string;
  desc: string;
  status: 'Current' | 'Upcoming' | 'Past';
  program?: ProgramType | 'All';
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

// ─── Locked Brand Palette from image_39dc84.jpg ─────────────────────────────
const JOIS_COLORS = {
  pink:   '#FF2D78', 
  yellow: '#FFC107', 
  green:  '#72BF44', 
  blue:   '#369FFF', 
  navy:   '#1A2340', 
  slate:  '#64748B', 
  bg:     '#F9FBFC'  
};

// ─── Theme Array for Row Cycling ─────────────────────────────────────────────
const ROW_THEMES = [
  { accent: JOIS_COLORS.blue,   light: '#EFF8FF', border: '#D3E9FF' }, // Theme 1
  { accent: JOIS_COLORS.yellow, light: '#FFFBEA', border: '#FFE080' }, // Theme 2
  { accent: JOIS_COLORS.pink,   light: '#FFF5F8', border: '#FFD3E3' }, // Theme 3
  { accent: JOIS_COLORS.green,  light: '#F8FDF5', border: '#E2F3D8' }, // Theme 4
];

const initialTimetable: TimetableItem[] = [
  { id: '1', time: '9:00 AM', subject: 'Starting the Day with Smiles', desc: 'Circle time, greetings, settling in with morning songs and activities', status: 'Current', program: 'All' },
  { id: '2', time: '10:45 – 11:10 AM', subject: 'Quick Bites Break', desc: 'Light snacks to recharge little learners', status: 'Upcoming', program: 'All' },
  { id: '3', time: '12:30 PM', subject: 'Wrap-up Time (Play Group & Pre-KG)', desc: 'Storytime, reflection, and getting ready to go home', status: 'Upcoming', program: 'Little Seeds' },
];

export const Academics: React.FC<{ role?: UserRole; currentUser?: any }> = ({ role, currentUser }) => {
  const [activeTab, setActiveTab]         = useState<'timetable' | 'homework' | 'results'>('timetable');
  const [filterProgram, setFilterProgram] = useState<'All' | ProgramType>('All');
  const [homeworkList, setHomeworkList]   = useState<Homework[]>([]);
  const [timetableItems]                  = useState<TimetableItem[]>(initialTimetable);
  const [isCreateModalOpen, setOpen]      = useState(false);

  const canEdit = role === UserRole.ADMIN || role === UserRole.TEACHER;

  useEffect(() => {
    if (activeTab === 'homework') loadHomework();
  }, [activeTab, role]);

  const loadHomework = async () => {
    let userClassId: string | string[] | undefined;
    let userStudentId: string | string[] | undefined;
    
    if (role === UserRole.TEACHER) {
      userClassId = currentUser?.classAssigned;
    } else if (role === UserRole.PARENT && currentUser) {
      userClassId   = [currentUser.program];
      userStudentId = [currentUser.id];
    }
    
    const data = await schoolService.getHomework(role || UserRole.PARENT, userClassId, userStudentId);
    setHomeworkList(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handlePostHomework = async (data: any) => {
    await schoolService.createHomework({ ...data, assignedBy: currentUser?.name || 'Teacher', status: 'Active' });
    loadHomework();
  };

  const handleDeleteHomework = async (id: string) => {
    if (window.confirm('Delete this assignment?')) {
      await schoolService.deleteHomework(id);
      loadHomework();
    }
  };

  const filteredTimetable = timetableItems.filter(item =>
    filterProgram === 'All' || item.program === 'All' || item.program === filterProgram
  );

  const TABS = ['Timetable', 'Homework', 'Results'] as const;

  return (
    <div className="w-full flex flex-col min-h-full pb-12" style={{ background: JOIS_COLORS.bg, animation: 'fadeUp .4s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div className="bg-white px-8 pt-8 pb-6 shadow-sm border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: JOIS_COLORS.blue }}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: JOIS_COLORS.navy }}>Academic Hub</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: JOIS_COLORS.slate }}>Curriculum management & assessment tracking</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
              <select
                value={filterProgram}
                onChange={e => setFilterProgram(e.target.value as any)}
                className="pl-10 pr-8 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl outline-none appearance-none transition-all shadow-sm bg-slate-50 border border-slate-200"
                style={{ color: JOIS_COLORS.navy }}
              >
                <option value="All">All Programs</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80">
              {TABS.map(tab => {
                const active = activeTab === tab.toLowerCase();
                const activeColor = tab === 'Timetable' ? JOIS_COLORS.blue : tab === 'Homework' ? JOIS_COLORS.pink : JOIS_COLORS.green;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                    className="px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                    style={active ? { background: '#fff', color: activeColor, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' } : { color: JOIS_COLORS.slate }}
                  >{tab}</button>
                );
              })}
            </div>

            {activeTab === 'homework' && canEdit && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all transform hover:scale-[1.02] text-white shadow-lg"
                style={{ background: JOIS_COLORS.pink }}
              >
                <Plus className="w-4 h-4" /> Assign Homework
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-8 pt-10">

        {activeTab === 'timetable' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" style={{ color: JOIS_COLORS.yellow }} />
                <h3 className="text-lg font-extrabold" style={{ color: JOIS_COLORS.navy }}>Today's Learning Schedule</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 text-slate-400">
                {filteredTimetable.length} Activities
              </span>
            </div>

            <div className="p-10 relative">
              <div className="absolute left-[54px] top-12 bottom-12 w-[1.5px]" style={{ background: '#F1F5F9' }}></div>
              <div className="space-y-8">
                {filteredTimetable.map((slot, idx) => {
                  {/* Cycles through the brand colors per row */}
                  const theme = ROW_THEMES[idx % ROW_THEMES.length];
                  return (
                    <div key={slot.id} className="flex gap-12 items-start relative">
                      <div className="w-5 h-5 rounded-full border-[3px] bg-white z-10 mt-5 shrink-0" 
                           style={{ borderColor: theme.accent }}></div>
                      <div className="flex-1 p-8 rounded-[24px] border shadow-sm" 
                           style={{ background: theme.light, borderColor: theme.border }}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="px-4 py-1 rounded-full text-[10px] font-black tracking-widest border"
                                style={{ background: '#fff', color: theme.accent, borderColor: theme.border }}>
                            {slot.time}
                          </span>
                          {slot.program !== 'All' && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full text-white"
                                  style={{ background: theme.accent }}>{slot.program}</span>
                          )}
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: JOIS_COLORS.navy }}>{slot.subject}</h4>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: JOIS_COLORS.slate }}>{slot.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Homework Tab ── */}
        {activeTab === 'homework' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homeworkList.map((hw, idx) => {
              const theme = ROW_THEMES[idx % ROW_THEMES.length];
              return (
                <div key={hw.id} className="bg-white rounded-[32px] p-8 flex flex-col transition-all border border-slate-100 shadow-sm hover:shadow-xl">
                  <div className="flex items-start justify-between mb-5">
                    <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                          style={{ background: theme.light, color: theme.accent }}>{hw.subject}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-50 text-slate-400">{hw.status}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-3" style={{ color: JOIS_COLORS.navy }}>{hw.title}</h4>
                  <p className="text-sm font-medium leading-relaxed text-slate-500 flex-1 mb-8">{hw.description}</p>
                  <div className="pt-6 flex items-center justify-between border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400">{hw.dueDate}</span>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteHomework(hw.id)} className="p-2 rounded-lg text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Results Tab ── */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-[40px] flex flex-col items-center justify-center py-32 shadow-sm border border-slate-100">
            <div className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-inner" style={{ background: JOIS_COLORS.yellow }}>
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black mb-2" style={{ color: JOIS_COLORS.navy }}>Progress Tracking</h3>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Reports Coming Soon</p>
          </div>
        )}
      </div>

      <CreateHomeworkModal
        isOpen={isCreateModalOpen}
        onClose={() => setOpen(false)}
        onSubmit={handlePostHomework}
        userRole={role || UserRole.PARENT}
        userClassId={currentUser?.classAssigned}
      />
    </div>
  );
};
