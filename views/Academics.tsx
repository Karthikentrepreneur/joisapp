import React, { useState } from 'react';
import { BookOpen, Award, Clock, Plus, CheckCircle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockHomework } from '../data/mockData';

const gradeData = [
  { subject: 'Math', score: 88 },
  { subject: 'Science', score: 92 },
  { subject: 'English', score: 85 },
  { subject: 'History', score: 78 },
  { subject: 'Art', score: 95 },
];

export const Academics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'homework' | 'results'>('timetable');

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Academics</h2>
           <p className="text-slate-500">Manage schedules, assignments, and performance.</p>
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
               <Clock className="w-5 h-5 text-blue-500" /> Today's Schedule (Grade 5-A)
             </h3>
             <button className="text-sm text-blue-600 font-bold hover:underline">Download PDF</button>
          </div>
          <div className="space-y-4 relative min-w-[500px]">
             <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
             {[
               { time: '09:00 AM', subject: 'Mathematics', teacher: 'Sarah Johnson', active: true },
               { time: '10:00 AM', subject: 'Physics', teacher: 'Michael Brown', active: false },
               { time: '11:00 AM', subject: 'English Literature', teacher: 'Emily Davis', active: false },
               { time: '12:00 PM', subject: 'Lunch Break', teacher: '-', active: false },
               { time: '01:00 PM', subject: 'History', teacher: 'History Dept', active: false },
             ].map((slot, idx) => (
               <div key={idx} className="relative flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white ${slot.active ? 'border-blue-500 text-blue-600' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <div className={`flex-1 p-3 rounded-xl border ${slot.active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 group-hover:border-slate-200'} transition-colors`}>
                     <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${slot.active ? 'text-blue-800' : 'text-slate-800'}`}>{slot.subject}</span>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">{slot.time}</span>
                     </div>
                     <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {slot.teacher}
                     </p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'homework' && (
         <div className="space-y-6">
            <div className="flex justify-end">
               <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Create Assignment
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {mockHomework.map((hw) => (
                  <div key={hw.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${hw.subject === 'Math' ? 'bg-blue-500' : hw.subject === 'Science' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hw.subject}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${hw.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{hw.status}</span>
                     </div>
                     <h3 className="font-bold text-slate-800 text-lg mb-2">{hw.title}</h3>
                     <p className="text-sm text-slate-600 mb-4 line-clamp-2">{hw.description}</p>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="text-xs text-slate-500">
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
              <Award className="w-5 h-5 text-yellow-500" /> Assessment Performance
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                    {gradeData.map((entry, index) => (
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
                <h4 className="text-2xl font-black mb-1">Top 5%</h4>
                <p className="text-yellow-50 text-sm font-medium mb-4">Class Rank</p>
                <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                   <p className="text-xs text-white">Excellent performance in Science and Arts this term. Keep it up!</p>
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Report Cards</h4>
                <div className="space-y-2">
                   {['Term 1 2024', 'Annual 2023', 'Term 2 2023'].map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-slate-700">{report}</span>
                         </div>
                         <span className="text-xs text-slate-400 group-hover:text-blue-500">Download</span>
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