import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Plus, Trash2, GraduationCap, Calendar,
  CheckCircle2, AlertCircle, User, FileText, Filter,
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

// ─── Brand Palette ────────────────────────────────────────────────────────────
const PROGRAM_META: Record<string, { bar: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { bar: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE' },
  'Curiosity Cubs': { bar: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080' },
  'Odyssey Owls':   { bar: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2' },
  'Future Makers':  { bar: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' },
};

const STATUS_META = {
  Current:  { bg: '#EEF8FE', color: '#1270A0', border: '#99D8F8', dot: '#3BB5F0' },
  Upcoming: { bg: '#FFFBEA', color: '#A07000', border: '#FFE080', dot: '#FFB800' },
  Past:     { bg: '#F8FAFC', color: '#9AA5B4', border: '#F0F4F8', dot: '#C8D0DC' },
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
    <div className="w-full flex flex-col min-h-full pb-8" style={{ background: '#F8FAFC', animation: 'fadeUp .4s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div className="bg-white px-6 py-4" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF8FE' }}>
              <GraduationCap className="w-6 h-6" style={{ color: '#3BB5F0' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: '#1A2340' }}>Academic Hub</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#9AA5B4' }}>Curriculum management & assessment tracking</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Program filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9AA5B4' }} />
              <select
                value={filterProgram}
                onChange={e => setFilterProgram(e.target.value as any)}
                className="pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl outline-none appearance-none transition-all"
                style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
              >
                <option value="All">All Programs</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
              {TABS.map(tab => {
                const active = activeTab === tab.toLowerCase();
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={active ? { background: '#1A2340', color: '#fff' } : { color: '#9AA5B4' }}
                  >{tab}</button>
                );
              })}
            </div>

            {/* Assign HW button */}
            {activeTab === 'homework' && canEdit && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 text-white"
                style={{ background: '#1A2340' }}
              >
                <Plus className="w-3.5 h-3.5" /> Assign Homework
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-6 pt-6 pb-10">

        {/* ── Timetable Tab ── */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>
            {/* Card header */}
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                <Clock className="w-4 h-4" style={{ color: '#3BB5F0' }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: '#1A2340' }}>Daily Schedule</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>
                {filteredTimetable.length} slots
              </span>
            </div>

            {filteredTimetable.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Clock className="w-10 h-10" style={{ color: '#F0F4F8' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>No slots for this program</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {filteredTimetable.map((slot, idx) => {
                  const sm = STATUS_META[slot.status] ?? STATUS_META.Past;
                  const pm = slot.program && slot.program !== 'All' ? getProgramMeta(slot.program) : null;
                  return (
                    <div
                      key={slot.id}
                      className="flex gap-4 items-start p-5 rounded-2xl transition-all"
                      style={{ background: sm.bg, border: `1.5px solid ${sm.border}` }}
                    >
                      {/* Index dot */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white"
                        style={{ background: sm.dot }}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sm.color }}>
                            {slot.time}
                          </p>
                          <div className="flex items-center gap-2">
                            {pm && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                                style={{ background: pm.light, color: pm.text, border: `1px solid ${pm.border}` }}
                              >{slot.program}</span>
                            )}
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                              style={{ background: '#fff', color: sm.color, border: `1px solid ${sm.border}` }}
                            >{slot.status}</span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold mb-1" style={{ color: '#1A2340' }}>{slot.subject}</h4>
                        <p className="text-xs font-medium leading-relaxed" style={{ color: '#9AA5B4' }}>{slot.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Homework Tab ── */}
        {activeTab === 'homework' && (
          <div>
            {homeworkList.length === 0 ? (
              <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 gap-3" style={{ border: '1.5px solid #F0F4F8' }}>
                <BookOpen className="w-10 h-10" style={{ color: '#F0F4F8' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>No homework assigned yet</p>
                {canEdit && (
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white transition-all active:scale-95"
                    style={{ background: '#1A2340' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign First Homework
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {homeworkList.map(hw => {
                  const isActive = hw.status === 'Active';
                  return (
                    <div
                      key={hw.id}
                      className="bg-white rounded-2xl p-5 flex flex-col transition-all duration-200 hover:-translate-y-1"
                      style={{ border: '1.5px solid #F0F4F8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: '#EEF8FE', color: '#1270A0', border: '1px solid #99D8F8' }}
                          >{hw.subject}</span>
                          {(hw as any).studentId && (
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: '#FFF0F5', color: '#CC1A5A', border: '1px solid #FFB3CE' }}
                            >Individual</span>
                          )}
                        </div>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg shrink-0"
                          style={isActive
                            ? { background: '#F0FBF0', color: '#217A15', border: '1px solid #A8E8A2' }
                            : { background: '#F8FAFC', color: '#9AA5B4', border: '1px solid #F0F4F8' }}
                        >{hw.status}</span>
                      </div>

                      <h4 className="text-sm font-bold mb-1.5" style={{ color: '#1A2340' }}>{hw.title}</h4>
                      <p className="text-xs font-medium leading-relaxed flex-1 mb-4" style={{ color: '#9AA5B4' }}>{hw.description}</p>

                      {/* Attachments */}
                      {hw.attachments && hw.attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {hw.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:opacity-80"
                              style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
                            >
                              <FileText className="w-3 h-3" style={{ color: '#9AA5B4' }} />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1.5px solid #F0F4F8' }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#F8FAFC' }}>
                            <User className="w-3 h-3" style={{ color: '#9AA5B4' }} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#9AA5B4' }}>{hw.assignedBy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" style={{ color: '#9AA5B4' }} />
                            <span className="text-[9px] font-bold" style={{ color: '#9AA5B4' }}>{hw.dueDate}</span>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteHomework(hw.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                              style={{ background: '#FFF0F5' }}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#FF4B8B' }} />
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
          <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 gap-3" style={{ border: '1.5px solid #F0F4F8' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#FFFBEA' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: '#FFB800' }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: '#1A2340' }}>Results Coming Soon</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Assessment records will appear here</p>
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
