
import React, { useState } from 'react';
import { BookOpen, Award, Clock, Plus, FileText, X, Save, Pencil, Trash2, Filter, GraduationCap } from 'lucide-react';
import { mockHomework } from '../data/mockData';
import { UserRole, Homework, ProgramType } from '../types';

interface TimetableItem {
  id: string;
  time: string;
  subject: string;
  desc: string;
  status: 'Current' | 'Upcoming' | 'Past';
  program?: ProgramType | 'All';
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

const initialTimetable: TimetableItem[] = [
  { id: '1', time: '9:00 AM', subject: 'Starting the Day with Smiles', desc: 'Circle time, greetings, settling in with morning songs and activities', status: 'Current', program: 'All' },
  { id: '2', time: '10:45 - 11:10 AM', subject: 'Quick Bites Break', desc: 'Light snacks to recharge little learners', status: 'Upcoming', program: 'All' },
  { id: '3', time: '12:30 PM', subject: 'Wrap-up Time (Play Group & Pre-KG)', desc: 'Storytime, reflection, and getting ready to go home', status: 'Upcoming', program: 'Little Seeds' },
];

export const Academics: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'homework' | 'results'>('timetable');
  const [filterProgram, setFilterProgram] = useState<'All' | ProgramType>('All');
  const [homeworkList, setHomeworkList] = useState<Homework[]>(mockHomework);
  const [timetableItems, setTimetableItems] = useState<TimetableItem[]>(initialTimetable);
  
  const canEdit = role === UserRole.ADMIN || role === UserRole.TEACHER;

  const filteredTimetable = timetableItems.filter(item => 
    filterProgram === 'All' || item.program === 'All' || item.program === filterProgram
  );

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-in fade-in duration-500 overflow-hidden max-w-7xl mx-auto w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academic Hub</h2>
           <p className="text-slate-500 font-medium">Curriculum management and assessment tracking.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full xl:w-auto">
           <select value={filterProgram} onChange={e => setFilterProgram(e.target.value as any)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest outline-none shadow-sm">
              <option value="All">All Programs</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
           </select>
           <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
             {['Timetable', 'Homework', 'Results'].map((tab) => (
               <button key={tab} onClick={() => setActiveTab(tab.toLowerCase() as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.toLowerCase() ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                 {tab}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
         {activeTab === 'timetable' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10 relative">
               <div className="absolute left-10 top-20 bottom-20 w-1 bg-slate-50 rounded-full"></div>
               {filteredTimetable.map((slot, idx) => (
                  <div key={slot.id} className="relative flex gap-10 items-start group">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm z-10 shadow-lg ${slot.status === 'Current' ? 'bg-blue-600 ring-8 ring-blue-50' : 'bg-slate-200 text-slate-400'}`}>
                        {idx + 1}
                     </div>
                     <div className={`flex-1 p-8 rounded-[2.5rem] border transition-all ${slot.status === 'Current' ? 'bg-blue-50/50 border-blue-100 shadow-xl' : 'bg-white border-slate-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{slot.time}</p>
                              <h4 className="text-xl font-black text-slate-900">{slot.subject}</h4>
                           </div>
                           <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{slot.program}</span>
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed">{slot.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         )}
         {activeTab === 'homework' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeworkList.map(hw => (
                <div key={hw.id} className="pro-card p-6 flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">{hw.subject}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{hw.dueDate}</span>
                   </div>
                   <h4 className="text-lg font-black text-slate-900 mb-2">{hw.title}</h4>
                   <p className="text-slate-500 text-sm mb-6 flex-1">{hw.description}</p>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned By: {hw.assignedBy}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${hw.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{hw.status}</span>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};
