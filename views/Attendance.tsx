import React, { useState, useMemo } from 'react';
import { mockStudents, getMyChild } from '../data/mockData';
import { UserRole } from '../types';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Save, 
  UserCheck, 
  CalendarPlus, 
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  Download,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';

interface AttendanceProps {
  role?: UserRole;
}

const dailyTrendData = [
  { date: '01 Apr', present: 28, absent: 2 },
  { date: '02 Apr', present: 29, absent: 1 },
  { date: '03 Apr', present: 27, absent: 3 },
  { date: '04 Apr', present: 30, absent: 0 },
  { date: '05 Apr', present: 26, absent: 4 },
  { date: '06 Apr', present: 29, absent: 1 },
  { date: '07 Apr', present: 28, absent: 2 },
];

export const Attendance: React.FC<AttendanceProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'details'>('register');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Filter states for Details tab
  const [filterName, setFilterName] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Leave Form State
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const preschoolGroups = ["Play Group", "Pre-KG", "KG 1", "KG 2"];
  const isParent = role === UserRole.PARENT;
  const child = isParent ? getMyChild() : null;

  // Memoized filter logic for the details list
  const filteredLogs = useMemo(() => {
    return mockStudents.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(filterName.toLowerCase());
      const gradeMatch = filterGrade === 'All' || s.grade === filterGrade;
      // In a real app, status would come from a log. Here we simulate it based on student data or random.
      const statusMatch = filterStatus === 'All' || (s.attendance > 90 ? 'Present' : 'Absent') === filterStatus;
      return nameMatch && gradeMatch && statusMatch;
    });
  }, [filterName, filterGrade, filterStatus]);

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Leave requested for ${child?.name}!`);
    setShowLeaveModal(false);
  };

  const handleSaveRegister = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      alert("Attendance record saved successfully for " + date);
    }, 100);
  };

  if (isParent) {
    if (!child) return <div className="p-6">No student record linked to this account.</div>;

    const history = Array.from({ length: 14 }).map((_, i) => {
       const d = new Date();
       d.setDate(d.getDate() - i);
       if (d.getDay() === 0 || d.getDay() === 6) return null;
       const isAbsent = i === 3; 
       const isLate = i === 7;
       return {
         date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
         status: isAbsent ? 'Absent' : isLate ? 'Late' : 'Present',
         time: isAbsent ? '-' : isLate ? '09:15 AM' : '08:55 AM'
       };
    }).filter(Boolean);

    return (
      <div className="p-4 md:p-8 h-full overflow-y-auto animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Record</h2>
              <p className="text-slate-500 font-medium">Tracking history for {child.name}</p>
            </div>
            <button 
              onClick={() => setShowLeaveModal(true)} 
              className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-3 justify-center w-full md:w-auto shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              <CalendarPlus className="w-5 h-5" /> Request Leave
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Rate</p>
                  <h3 className="text-4xl font-black text-slate-900">{child.attendance}%</h3>
               </div>
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Clock className="w-8 h-8" /></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days Present</p>
                  <h3 className="text-4xl font-black text-emerald-600">42</h3>
               </div>
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><UserCheck className="w-8 h-8" /></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days Absent</p>
                  <h3 className="text-4xl font-black text-rose-600">3</h3>
               </div>
               <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform"><AlertCircle className="w-8 h-8" /></div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <h3 className="font-black text-slate-900 text-xl">Recent History</h3>
               <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-widest text-slate-400">Last 14 School Days</span>
            </div>
            <div className="divide-y divide-slate-50">
               {history.map((record: any, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm ${
                          record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          record.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {record.date.split(' ')[2]}
                        </div>
                        <div>
                           <p className="font-black text-slate-900">{record.date}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{record.time}</p>
                        </div>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       record.status === 'Present' ? 'bg-emerald-500 text-white' : 
                       record.status === 'Absent' ? 'bg-rose-500 text-white' : 
                       'bg-amber-500 text-white'
                     }`}>
                        {record.status}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {showLeaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-slate-900">Request Leave</h3>
                    <button onClick={() => setShowLeaveModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleLeaveSubmit} className="space-y-6">
                     <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white" /></div>
                     <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label><input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white" /></div>
                     <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason</label><textarea required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Please detail the reason for leave..." className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white h-28 resize-none"></textarea></div>
                     <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 mt-4 active:scale-95">Submit Request</button>
                  </form>
               </div>
            </div>
         )}
      </div>
    );
  }

  // Admin/Teacher View with Tabs
  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto max-w-7xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Register</h2>
           <p className="text-slate-500 font-medium">Manage and review preschool attendance records.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full md:w-auto">
           {[
             { id: 'register', label: 'Attendance Register', icon: UserCheck },
             { id: 'details', label: 'Attendance Details', icon: BarChart3 }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 justify-center ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'register' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-inner flex-1 md:flex-none">
                   <CalendarIcon className="w-5 h-5 text-slate-400" />
                   <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm font-bold text-slate-700 outline-none bg-transparent" />
                 </div>
                 <div className="bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-100 whitespace-nowrap">
                   {isSubmitted ? 'Marked' : 'Unmarked'}
                 </div>
              </div>
              <button 
                onClick={handleSaveRegister} 
                disabled={isSubmitted} 
                className={`px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 text-white active:scale-95 ${isSubmitted ? 'bg-emerald-500 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
              >
                {isSubmitted ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isSubmitted ? 'Saved Successfully' : 'Save Register'}
              </button>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 gap-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                 <div className="col-span-1">#</div>
                 <div className="col-span-5">Student Information</div>
                 <div className="col-span-6 text-center">Attendance Selection</div>
               </div>
               <div className="divide-y divide-slate-50">
                 {mockStudents.map((s, i) => (
                   <div key={s.id} className="grid grid-cols-12 gap-6 items-center p-6 hover:bg-slate-50/50 transition-colors">
                     <div className="col-span-1 text-slate-300 font-black text-sm">{i+1}</div>
                     <div className="col-span-5 flex items-center gap-4">
                        <img src={s.image} className="w-12 h-12 rounded-2xl border border-slate-200 shadow-sm object-cover" alt={s.name} />
                        <div>
                           <p className="font-black text-slate-900 text-base">{s.name}</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{s.grade}</p>
                        </div>
                     </div>
                     <div className="col-span-6 flex justify-center gap-3">
                       <button 
                         onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Present'}))} 
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${attendanceState[s.id] === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-300'}`}
                       >
                         Present
                       </button>
                       <button 
                         onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Absent'}))} 
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${attendanceState[s.id] === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100' : 'bg-white text-slate-500 border-slate-100 hover:border-rose-300'}`}
                       >
                         Absent
                       </button>
                       <button 
                         onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Late'}))} 
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${attendanceState[s.id] === 'Late' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' : 'bg-white text-slate-500 border-slate-100 hover:border-amber-300'}`}
                       >
                         Late
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
           </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
           {/* Summary Stats for Details */}
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <h3 className="text-xl font-black text-slate-900 mb-8">Daily Attendance Trend</h3>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrendData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                         <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                         <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                         <Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-50">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Today's Presence</p>
                    <h4 className="text-4xl font-black">94.2%</h4>
                    <p className="text-xs font-bold mt-4 bg-white/20 px-3 py-1.5 rounded-xl inline-block">+2.1% from yesterday</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Absents</p>
                    <h4 className="text-4xl font-black text-rose-500">12</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">For March 2024</p>
                 </div>
              </div>
           </div>

           {/* Filter Bar */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                 <input 
                   type="text" 
                   placeholder="Search student name or ID..." 
                   className="w-full pl-14 pr-6 py-4 border border-slate-100 bg-slate-50/50 rounded-[1.5rem] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                   value={filterName}
                   onChange={e => setFilterName(e.target.value)}
                 />
              </div>
              <div className="flex flex-wrap gap-4">
                 <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] px-5 py-3 shadow-inner">
                    <Users className="w-5 h-5 text-slate-400" />
                    <select 
                      className="text-xs font-black uppercase tracking-widest bg-transparent outline-none text-slate-600"
                      value={filterGrade}
                      onChange={e => setFilterGrade(e.target.value)}
                    >
                       <option value="All">All Groups</option>
                       {preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] px-5 py-3 shadow-inner">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select 
                      className="text-xs font-black uppercase tracking-widest bg-transparent outline-none text-slate-600"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                       <option value="All">All Status</option>
                       <option value="Present">Present</option>
                       <option value="Absent">Absent</option>
                       <option value="Late">Late</option>
                    </select>
                 </div>
                 <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"><Download className="w-5 h-5" /></button>
              </div>
           </div>

           {/* Results Table */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       <tr>
                          <th className="px-8 py-5">Student</th>
                          <th className="px-8 py-5">Group</th>
                          <th className="px-8 py-5">Monthly Rate</th>
                          <th className="px-8 py-5">Current Status</th>
                          <th className="px-8 py-5 text-right">Activity</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredLogs.map((student) => (
                          <tr key={student.id} className="group hover:bg-slate-50/30 transition-colors">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 font-black flex items-center justify-center text-xs shadow-inner">
                                      {student.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900">{student.name}</p>
                                      <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{student.id}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{student.grade}</span>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${student.attendance > 90 ? 'bg-emerald-500' : student.attendance > 80 ? 'bg-blue-500' : 'bg-rose-500'}`} 
                                        style={{width: `${student.attendance}%`}}
                                      ></div>
                                   </div>
                                   <span className="text-xs font-black text-slate-800">{student.attendance}%</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  student.attendance > 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                   <span className={`w-1.5 h-1.5 rounded-full ${student.attendance > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                   {student.attendance > 90 ? 'Present' : 'Absent'}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Log</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredLogs.length === 0 && (
                   <div className="p-20 text-center text-slate-300 font-bold italic">No records match your filters.</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};