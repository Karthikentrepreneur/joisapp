import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Plus, Trash2, GraduationCap, Calendar,
  CheckCircle2, AlertCircle, User, FileText, Filter, ChevronRight, CornerDownRight, BarChart3,
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

// ─── Refined Brand Palette (Inspired by image_0.png) ──────────────────────────
// We extract the core vibrant colors but apply them with more sophisticated
// distribution (smaller accents, refined light variants).
const JOIS_THEME = {
  j_pink:   { main: '#FF2D78', bg: '#FFF5F8', border: '#FFD3E3' }, // "J"
  o_yellow: { main: '#FFC107', bg: '#FFFBEA', border: '#FFE080' }, // "o" face
  i_green:  { main: '#72BF44', bg: '#F8FDF5', border: '#E2F3D8' }, // "i" and hand
  s_blue:   { main: '#369FFF', bg: '#EFF8FF', border: '#D3E9FF' }, // "s"
  
  text:      { main: '#1A2340', muted: '#64748B', inverse: '#FFFFFF' },
  bg:        { page: '#F9FBFC', card: '#FFFFFF', input: '#F1F5F9' },
  status: {
    current:  { dot: '#FF2D78', text: '#CC1A5A', line: '#FFD3E3' }, // Pink for energy
    upcoming: { dot: '#FFC107', text: '#A07000', line: '#FFE080' }, // Yellow for anticipation
    past:     { dot: '#C8D0DC', text: '#9AA5B4', line: '#E2E8F0' }, // Neutral grey
  },
};

const PROGRAM_META: Record<string, { bar: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { bar: JOIS_THEME.j_pink.main, light: JOIS_THEME.j_pink.bg, text: JOIS_THEME.j_pink.main, border: JOIS_THEME.j_pink.border },
  'Curiosity Cubs': { bar: JOIS_THEME.o_yellow.main, light: JOIS_THEME.o_yellow.bg, text: '#A07000', border: JOIS_THEME.o_yellow.border },
  'Odyssey Owls':   { bar: JOIS_THEME.i_green.main, light: JOIS_THEME.i_green.bg, text: '#2D5A27', border: JOIS_THEME.i_green.border },
  'Future Makers':  { bar: JOIS_THEME.s_blue.main, light: JOIS_THEME.s_blue.bg, text: JOIS_THEME.s_blue.main, border: JOIS_THEME.s_blue.border },
};

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

  const getProgramMeta = (p: string) => PROGRAM_META[p] ?? PROGRAM_META['Future Makers'];

  const TABS = ['Timetable', 'Homework', 'Results'] as const;

  return (
    <div className="w-full flex flex-col min-h-full pb-8" style={{ background: JOIS_THEME.bg.page, animation: 'fadeUp .4s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Refined Modern Header with Jois Signature Wave ── */}
      <div className="bg-white px-6 pt-6 pb-5 relative z-10" style={{ borderBottom: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(26,35,64,0.03)' }}>
        {/* Subtle decorative "hand" wave element */}
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-5 pointer-events-none" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}>
          <div className="w-full h-full flex items-end justify-end p-6">
            <svg viewBox="0 0 100 100" className="w-24 h-24" style={{ color: JOIS_THEME.i_green.main }}>
              <path fill="currentColor" d="M20,10 C30,0 50,0 60,10 L90,40 C100,50 100,70 90,80 C80,90 60,90 50,80 L20,50 C10,40 10,20 20,10 Z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">

          {/* Title - Jois Blue & Muted Grey */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner" style={{ background: JOIS_THEME.s_blue.bg }}>
              <GraduationCap className="w-8 h-8" style={{ color: JOIS_THEME.s_blue.main }} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter" style={{ color: JOIS_THEME.text.main }}>Academic Hub</h2>
              <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: JOIS_THEME.text.muted }}>Curriculum management & assessment tracking</p>
            </div>
          </div>

          {/* Controls - Refined, Less Bulky */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Program filter - Refined Select */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: JOIS_THEME.text.muted }} />
              <select
                value={filterProgram}
                onChange={e => setFilterProgram(e.target.value as any)}
                className="pl-10 pr-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl outline-none appearance-none transition-all shadow-sm"
                style={{ background: JOIS_THEME.bg.card, border: '2px solid #F1F5F9', color: JOIS_THEME.text.main }}
              >
                <option value="All">All Programs</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Tabs - Modern, Indicator Style */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl" style={{ background: JOIS_THEME.bg.input }}>
              {TABS.map(tab => {
                const active = activeTab === tab.toLowerCase();
                const tabColor = tab === 'Timetable' ? JOIS_THEME.s_blue.main : tab === 'Homework' ? JOIS_THEME.j_pink.main : JOIS_THEME.i_green.main;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                    className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative"
                    style={active ? { background: JOIS_THEME.bg.card, color: tabColor, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' } : { color: JOIS_THEME.text.muted }}
                  >
                    {tab}
                    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: tabColor }} />}
                  </button>
                );
              })}
            </div>

            {/* Assign HW button - Bold Action */}
            {activeTab === 'homework' && canEdit && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all transform hover:scale-[1.02] active:scale-95 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${JOIS_THEME.text.main}, #303F60)` }}
              >
                <Plus className="w-4 h-4" /> Assign Homework
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-6 pt-10 pb-12">

        {/* ── Timetable Tab ── */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            {/* Modern Muted Grey Header */}
            <div className="px-8 py-5 flex items-center gap-3" style={{ background: JOIS_THEME.bg.page, borderBottom: '1px solid #E2E8F0' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: JOIS_THEME.bg.card }}>
                <Clock className="w-5 h-5" style={{ color: JOIS_THEME.o_yellow.main }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: JOIS_THEME.text.main }}>Today’s Learning Schedule</h3>
              <span className="ml-auto text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: JOIS_THEME.bg.input, color: JOIS_THEME.text.muted }}>
                {filteredTimetable.length} activities
              </span>
            </div>

            {filteredTimetable.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: JOIS_THEME.bg.input }}>
                  <Clock className="w-10 h-10" style={{ color: JOIS_THEME.status.past.dot }} />
                </div>
                <p className="text-sm font-bold uppercase tracking-wider max-w-xs" style={{ color: JOIS_THEME.text.muted }}>There are no schedule slots for the selected program today.</p>
              </div>
            ) : (
              // Timeline Style Schedule
              <div className="p-8 relative">
                <div className="absolute left-16 top-10 bottom-10 w-[2px]" style={{ background: JOIS_THEME.bg.input }}></div>

                <div className="space-y-6">
                  {filteredTimetable.map((slot, idx) => {
                    const sm = JOIS_THEME.status[slot.status.toLowerCase() as keyof typeof JOIS_THEME.status] ?? JOIS_THEME.status.past;
                    const pm = slot.program && slot.program !== 'All' ? getProgramMeta(slot.program) : null;
                    return (
                      <div
                        key={slot.id}
                        className="flex gap-10 items-start relative pl-10"
                      >
                        {/* Status Line Indicator */}
                        <div className="absolute left-[34px] top-3.5 -translate-x-1/2 w-[2px] h-full" style={{ background: sm.line }}></div>
                        
                        {/* Status Dot */}
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 shadow relative z-10 -ml-1 mt-3"
                          style={{ background: '#fff', border: `4px solid ${sm.dot}` }}
                        />

                        {/* Card */}
                        <div
                          className="flex-1 min-w-0 p-6 rounded-3xl transition-all"
                          style={{ background: pm ? pm.light : JOIS_THEME.bg.card, border: `1px solid ${pm ? pm.border : '#E2E8F0'}`, boxShadow: pm ? `0 6px 12px ${pm.bar}08` : '0 6px 12px rgba(26,35,64,0.03)' }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#fff', border: `1px solid ${pm ? pm.border : '#E2E8F0'}`, color: sm.text }}>
                              {slot.time}
                            </p>
                            <div className="flex items-center gap-2">
                              {pm && (
                                <span
                                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full text-white"
                                  style={{ background: pm.bar, boxShadow: `0 4px 10px ${pm.bar}40` }}
                                >{slot.program}</span>
                              )}
                            </div>
                          </div>
                          <h4 className="text-lg font-extrabold mb-1.5" style={{ color: JOIS_THEME.text.main }}>{slot.subject}</h4>
                          <p className="text-sm font-medium leading-relaxed" style={{ color: pm ? pm.text : JOIS_THEME.text.muted }}>{slot.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Homework Tab ── */}
        {activeTab === 'homework' && (
          <div>
            {homeworkList.length === 0 ? (
              <div className="bg-white rounded-3xl flex flex-col items-center justify-center py-24 gap-4 text-center shadow-xl" style={{ border: '1px solid #E2E8F0' }}>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: JOIS_THEME.j_pink.bg }}>
                  <BookOpen className="w-10 h-10" style={{ color: JOIS_THEME.j_pink.main }} />
                </div>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: JOIS_THEME.text.muted }}>No homework assigned yet for this group.</p>
                {canEdit && (
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-3 flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-md"
                    style={{ background: JOIS_THEME.j_pink.main }}
                  >
                    <Plus className="w-4 h-4" /> Assign First Homework
                  </button>
                )}
              </div>
            ) : (
              // Refined Cards (Cleaner, Less Bulky Footer)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {homeworkList.map(hw => {
                  const isActive = hw.status === 'Active';
                  return (
                    <div
                      key={hw.id}
                      className="bg-white rounded-3xl p-6 flex flex-col transition-all duration-300 hover:shadow-2xl group border-l-[8px]"
                      style={{ borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', borderLeftColor: JOIS_THEME.j_pink.main, boxShadow: '0 4px 12px rgba(26,35,64,0.03)' }}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-inner"
                            style={{ background: JOIS_THEME.j_pink.bg, color: JOIS_THEME.j_pink.main, border: `1px solid ${JOIS_THEME.j_pink.border}` }}
                          >{hw.subject}</span>
                          {(hw as any).studentId && (
                            <span
                              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: JOIS_THEME.i_green.bg, color: '#2D5A27', border: `1px solid ${JOIS_THEME.i_green.border}` }}
                            >Individual</span>
                          )}
                        </div>
                        <span
                          className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0"
                          style={isActive
                            ? { background: JOIS_THEME.i_green.bg, color: '#2D5A27', border: `1px solid ${JOIS_THEME.i_green.border}` }
                            : { background: JOIS_THEME.bg.input, color: JOIS_THEME.text.muted, border: '1px solid #E2E8F0' }}
                        >{hw.status}</span>
                      </div>

                      <h4 className="text-xl font-extrabold mb-2.5 group-hover:text-pink-600 transition-colors" style={{ color: JOIS_THEME.text.main }}>{hw.title}</h4>
                      <p className="text-sm font-medium leading-relaxed flex-1 mb-6" style={{ color: JOIS_THEME.text.muted }}>{hw.description}</p>

                      {/* Attachments - Sleeker Tags */}
                      {hw.attachments && hw.attachments.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                          {hw.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-slate-50 border border-slate-200 hover:border-pink-300 group-hover:shadow-sm"
                              style={{ color: JOIS_THEME.text.main }}
                            >
                              <FileText className="w-3.5 h-3.5" style={{ color: JOIS_THEME.text.muted }} />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Footer - Minimalist */}
                      <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 shadow-inner">
                            <User className="w-4 h-4" style={{ color: JOIS_THEME.text.muted }} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: JOIS_THEME.text.muted }}>{hw.assignedBy}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: JOIS_THEME.bg.input, border: '1px solid #E2E8F0' }}>
                            <Calendar className="w-3.5 h-3.5" style={{ color: JOIS_THEME.o_yellow.main }} />
                            <span className="text-[10px] font-black" style={{ color: JOIS_THEME.text.muted }}>{hw.dueDate}</span>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteHomework(hw.id)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-rose-50 border border-rose-100 group-hover:border-rose-200"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: JOIS_THEME.j_pink.main }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Results Tab ── */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl flex flex-col items-center justify-center py-28 gap-4 text-center shadow-xl" style={{ border: '1px solid #E2E8F0' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative" style={{ background: JOIS_THEME.o_yellow.bg }}>
              {/* Floating Jois hand icon as decoration */}
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center p-1" style={{ background: JOIS_THEME.bg.card, border: `2px solid ${JOIS_THEME.i_green.border}` }}>
                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: JOIS_THEME.i_green.main }}>
                  <path fill="currentColor" d="M20,10 C30,0 50,0 60,10 L90,40 C100,50 100,70 90,80 C80,90 60,90 50,80 L20,50 C10,40 10,20 20,10 Z" />
                </svg>
              </div>
              <BarChart3 className="w-12 h-12" style={{ color: JOIS_THEME.o_yellow.main }} />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight" style={{ color: JOIS_THEME.text.main }}>Results & Progress Coming Soon</h3>
            <p className="text-sm font-bold uppercase tracking-wider max-w-xs" style={{ color: JOIS_THEME.text.muted }}>Assessment records, developmental charts, and feedback will be visible here.</p>
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
