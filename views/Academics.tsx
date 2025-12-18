import React, { useState } from 'react';
import { BookOpen, Award, Clock, Plus, FileText, X, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockHomework } from '../data/mockData';
import { UserRole, Homework } from '../types';

interface AcademicsProps {
  role?: UserRole;
}

const performanceData = [
  { subject: 'Motor Skills', score: 95 },
  { subject: 'Socializing', score: 88 },
  { subject: 'Creative Arts', score: 92 },
  { subject: 'Storytelling', score: 85 },
];

export const Academics: React.FC<AcademicsProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'homework' | 'results'>('timetable');
  const [homeworkList, setHomeworkList] = useState<Homework[]>(mockHomework);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State for new assignment
  const [newHW, setNewHW] = useState<Partial<Homework>>({
    subject: 'Art',
    title: '',
    description: '',
    grade: 'Play Group',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const isAdmin = role === UserRole.ADMIN;
  const preschoolGroups = ["Play Group", "Pre-KG", "KG 1", "KG 2"];

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Homework = {
      ...newHW,
      id: `HW-${Date.now()}`,
      section: 'A',
      assignedBy: 'Admin',
    } as Homework;
    setHomeworkList([created, ...homeworkList]);
    setShowAddModal(false);
    setNewHW({
      subject: 'Art',
      title: '',
      description: '',
      grade: 'Play Group',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Academics</h2>
           <p className="text-slate-500 font-medium italic text-sm">Every day is filled with joy, learning, and discovery at JOIS Preschool.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
           {['Timetable', 'Homework', 'Results'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab.toLowerCase() as any)}
               className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.toLowerCase() ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'timetable' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-6 min-w-[500px]">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock className="w-5 h-5 text-blue-500" /> A Day at JOIS Preschool
             </h3>
             <button className="text-sm text-blue-600 font-bold hover:underline">Download PDF</button>
          </div>
          <div className="space-y-4 relative min-w-[500px]">
             <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
             {[
               { time: '9:00 AM', subject: 'Starting the Day with Smiles', desc: 'Circle time, greetings, settling in with morning songs and activities', status: 'Current' },
               { time: '10:45 - 11:10 AM', subject: 'Quick Bites Break', desc: 'Light snacks to recharge little learners', status: 'Upcoming' },
               { time: '12:30 PM', subject: 'Wrap-up Time (Play Group & Pre-KG)', desc: 'Storytime, reflection, and getting ready to go home', status: 'Upcoming' },
               { time: '12:30 PM', subject: 'Lunch Time (KG 1 & KG 2)', desc: 'Nutritious meals shared together in a happy, social setting', status: 'Upcoming' },
               { time: '1:00 PM', subject: 'Time to Head Home', desc: 'Saying goodbye, heading home with smiles and stories to share', status: 'Upcoming' },
             ].map((slot, idx) => (
               <div key={idx} className="relative flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white ${slot.status === 'Current' ? 'border-blue-500 text-blue-600 shadow-sm' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <div className={`flex-1 p-4 rounded-xl border ${slot.status === 'Current' ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100 group-hover:border-slate-200'} transition-colors`}>
                     <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${slot.status === 'Current' ? 'text-blue-800' : 'text-slate-800'}`}>{slot.subject}</span>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 font-bold whitespace-nowrap">{slot.time}</span>
                     </div>
                     <p className="text-xs text-slate-500 leading-relaxed">{slot.desc}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'homework' && (
         <div className="space-y-6">
            {isAdmin && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Create Assignment
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {homeworkList.map((hw) => (
                  <div key={hw.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${hw.subject === 'Art' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hw.subject}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${hw.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{hw.status}</span>
                     </div>
                     <h3 className="font-bold text-slate-800 text-lg mb-2">{hw.title}</h3>
                     <p className="text-sm text-slate-600 mb-4 line-clamp-2">{hw.description}</p>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="text-xs text-slate-500">
                           <p>Group: <span className="font-semibold text-slate-700">{hw.grade}</span></p>
                           <p>Due: <span className="font-semibold text-slate-700">{hw.dueDate}</span></p>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                           View Details
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Milestone Tracking
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10b981' : entry.score > 80 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                   <Award className="w-24 h-24" />
                </div>
                <h4 className="text-2xl font-black mb-1">Top Star</h4>
                <p className="text-yellow-50 text-sm font-medium mb-4">Milestone Achieved</p>
                <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                   <p className="text-xs text-white leading-relaxed">Showing great enthusiasm in creative arts and group play! Emma is a delight in circle time.</p>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Monthly Observations</h4>
                <div className="space-y-2">
                   {['March 2024 Log', 'February 2024 Log', 'January 2024 Log'].map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-slate-700">{report}</span>
                         </div>
                         <span className="text-xs text-slate-400 group-hover:text-blue-500">View</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Assignment Modal for Admin */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">New Assignment</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                       <select 
                         value={newHW.subject} 
                         onChange={e => setNewHW({...newHW, subject: e.target.value})}
                         className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                          <option>Art</option>
                          <option>Nature</option>
                          <option>Social</option>
                          <option>Language</option>
                          <option>Math</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Target Group</label>
                       <select 
                         value={newHW.grade} 
                         onChange={e => setNewHW({...newHW, grade: e.target.value})}
                         className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                          {preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                      required 
                      type="text" 
                      value={newHW.title} 
                      onChange={e => setNewHW({...newHW, title: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Spring Coloring"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      required 
                      value={newHW.description} 
                      onChange={e => setNewHW({...newHW, description: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      placeholder="Details of the activity..."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                    <input 
                      required 
                      type="date" 
                      value={newHW.dueDate} 
                      onChange={e => setNewHW({...newHW, dueDate: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-600 shadow-lg flex items-center gap-2 transition-all"><Save className="w-4 h-4" /> Post Assignment</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};