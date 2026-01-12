
import React, { useState } from 'react';
import { BookOpen, Award, Clock, Plus, FileText, X, Save, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockHomework } from '../data/mockData';
import { UserRole, Homework } from '../types';

interface TimetableItem {
  id: string;
  time: string;
  subject: string;
  desc: string;
  status: 'Current' | 'Upcoming' | 'Past';
}

interface AcademicsProps {
  role?: UserRole;
}

const performanceData = [
  { subject: 'Motor Skills', score: 95 },
  { subject: 'Socializing', score: 88 },
  { subject: 'Creative Arts', score: 92 },
  { subject: 'Storytelling', score: 85 },
];

const initialTimetable: TimetableItem[] = [
  { id: '1', time: '9:00 AM', subject: 'Starting the Day with Smiles', desc: 'Circle time, greetings, settling in with morning songs and activities', status: 'Current' },
  { id: '2', time: '10:45 - 11:10 AM', subject: 'Quick Bites Break', desc: 'Light snacks to recharge little learners', status: 'Upcoming' },
  { id: '3', time: '12:30 PM', subject: 'Wrap-up Time (Play Group & Pre-KG)', desc: 'Storytime, reflection, and getting ready to go home', status: 'Upcoming' },
  { id: '4', time: '12:30 PM', subject: 'Lunch Time (KG 1 & KG 2)', desc: 'Nutritious meals shared together in a happy, social setting', status: 'Upcoming' },
  { id: '5', time: '1:00 PM', subject: 'Time to Head Home', desc: 'Saying goodbye, heading home with smiles and stories to share', status: 'Upcoming' },
];

export const Academics: React.FC<AcademicsProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'homework' | 'results'>('timetable');
  const [homeworkList, setHomeworkList] = useState<Homework[]>(mockHomework);
  const [timetableItems, setTimetableItems] = useState<TimetableItem[]>(initialTimetable);
  
  // Modals
  const [showAddHWModal, setShowAddHWModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  
  // Homework Form State
  const [newHW, setNewHW] = useState<Partial<Homework>>({
    subject: 'Art',
    title: '',
    description: '',
    grade: 'Play Group',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  // Timetable Form State
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableItem> | null>(null);

  const canEdit = role === UserRole.ADMIN || role === UserRole.TEACHER;
  const preschoolGroups = ["Play Group", "Pre-KG", "KG 1", "KG 2"];

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Homework = {
      ...newHW,
      id: `HW-${Date.now()}`,
      section: 'A',
      assignedBy: role === UserRole.ADMIN ? 'Admin' : 'Teacher',
    } as Homework;
    setHomeworkList([created, ...homeworkList]);
    setShowAddHWModal(false);
    setNewHW({
      subject: 'Art',
      title: '',
      description: '',
      grade: 'Play Group',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  };

  const handleSaveTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    if (editingSlot.id) {
      setTimetableItems(prev => prev.map(item => item.id === editingSlot.id ? (editingSlot as TimetableItem) : item));
    } else {
      const newItem: TimetableItem = {
        ...editingSlot,
        id: Date.now().toString(),
        status: editingSlot.status || 'Upcoming'
      } as TimetableItem;
      setTimetableItems(prev => [...prev, newItem]);
    }
    setShowTimetableModal(false);
    setEditingSlot(null);
  };

  const deleteTimetableSlot = (id: string) => {
    if (confirm("Are you sure you want to remove this event from the schedule?")) {
      setTimetableItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 gap-4">
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-slate-800">Academics</h2>
           <p className="text-slate-500 font-medium italic text-xs md:text-sm">Every day is filled with joy, learning, and discovery.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto">
           {['Timetable', 'Homework', 'Results'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab.toLowerCase() as any)}
               className={`flex-1 xl:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${activeTab === tab.toLowerCase() ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base md:text-lg">
                <Clock className="w-5 h-5 text-blue-500" /> Daily Plan
              </h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {canEdit && (
                  <button 
                    onClick={() => { setEditingSlot({ time: '', subject: '', desc: '', status: 'Upcoming' }); setShowTimetableModal(true); }}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Event
                  </button>
                )}
                <button className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline">Download PDF</button>
              </div>
            </div>
            
            <div className="space-y-6 relative md:pl-2 md:pr-2">
              <div className="absolute left-[19px] md:left-[27px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
              {timetableItems.map((slot, idx) => (
                <div key={slot.id} className="relative flex items-start gap-4 md:gap-6 group">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white shrink-0 ${slot.status === 'Current' ? 'border-blue-500 text-blue-600 shadow-sm' : 'border-slate-200 text-slate-400'}`}>
                      <span className="text-[10px] md:text-xs font-black">{idx + 1}</span>
                    </div>
                    <div className={`flex-1 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border transition-all ${slot.status === 'Current' ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 group-hover:border-slate-200'} relative`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <div className="space-y-1">
                            <span className={`text-sm md:text-base font-black block leading-tight ${slot.status === 'Current' ? 'text-blue-900' : 'text-slate-800'}`}>{slot.subject}</span>
                            <span className="text-[9px] md:text-[10px] text-slate-500 bg-white px-2 py-0.5 md:py-1 rounded-lg border border-slate-100 font-black whitespace-nowrap inline-block uppercase tracking-widest">{slot.time}</span>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 self-end sm:self-start">
                              <button 
                                onClick={() => { setEditingSlot(slot); setShowTimetableModal(true); }}
                                className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteTimetableSlot(slot.id)}
                                className="p-1.5 md:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{slot.desc}</p>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'homework' && (
         <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               {homeworkList.map((hw) => (
                  <div key={hw.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                     <div className={`absolute top-0 left-0 w-1 h-full ${hw.subject === 'Art' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{hw.subject}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${hw.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{hw.status}</span>
                     </div>
                     <h3 className="font-bold text-slate-800 text-base md:text-lg mb-2 leading-tight">{hw.title}</h3>
                     <p className="text-xs md:text-sm text-slate-600 mb-4 line-clamp-3">{hw.description}</p>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="text-[10px] md:text-xs text-slate-500">
                           <p>Group: <span className="font-semibold text-slate-700">{hw.grade}</span></p>
                           <p>Due: <span className="font-semibold text-slate-700">{hw.dueDate}</span></p>
                        </div>
                        <button className="text-[10px] md:text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                           Details
                        </button>
                     </div>
                  </div>
               ))}

               {canEdit && (
                 <div 
                   onClick={() => setShowAddHWModal(true)}
                   className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group min-h-[180px]"
                 >
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                     <Plus className="w-5 h-5 text-slate-300 group-hover:text-pink-500" />
                   </div>
                   <p className="font-bold text-[10px] md:text-xs text-slate-500 uppercase tracking-wider">New Task</p>
                 </div>
               )}
            </div>
         </div>
      )}

      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-base md:text-lg">
              <Award className="w-5 h-5 text-yellow-500" /> Milestone Tracking
            </h3>
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10b981' : entry.score > 80 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 md:p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <Award className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 opacity-20" />
                <h4 className="text-xl md:text-2xl font-black mb-1">Top Star</h4>
                <p className="text-yellow-50 text-xs md:text-sm font-medium mb-4">Milestone Achieved</p>
                <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                   <p className="text-[10px] md:text-xs text-white leading-relaxed">Emma is showing great enthusiasm in arts and play! A delight in circle time.</p>
                </div>
             </div>
             
             <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 text-sm md:text-base">Monthly Logs</h4>
                <div className="space-y-2">
                   {['March Log', 'Feb Log', 'Jan Log'].map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                            <span className="text-xs md:text-sm font-medium text-slate-700">{report}</span>
                         </div>
                         <span className="text-[10px] md:text-xs text-slate-400 group-hover:text-blue-500">View</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
