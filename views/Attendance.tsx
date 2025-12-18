
import React, { useState } from 'react';
import { mockStudents, getMyChild } from '../data/mockData';
import { UserRole } from '../types';
import { Calendar as CalendarIcon, Check, X, Clock, Save, UserCheck, CalendarPlus, AlertCircle } from 'lucide-react';

interface AttendanceProps {
  role?: UserRole;
}

export const Attendance: React.FC<AttendanceProps> = ({ role }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  if (role === UserRole.PARENT) {
    const child = getMyChild();
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

    const handleLeaveSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Leave requested for ${child.name}!`);
      setShowLeaveModal(false);
    };

    return (
      <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Attendance Record</h2>
              <p className="text-slate-500">History for {child.name}</p>
            </div>
            <button onClick={() => setShowLeaveModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 justify-center w-full md:w-auto shadow-sm"><CalendarPlus className="w-4 h-4" /> Request Leave</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance</p><h3 className="text-3xl font-black text-slate-800">{child.attendance}%</h3></div>
               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Clock className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Present</p><h3 className="text-3xl font-black text-emerald-600">42</h3></div>
               <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><UserCheck className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Absent</p><h3 className="text-3xl font-black text-rose-600">3</h3></div>
               <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600"><AlertCircle className="w-6 h-6" /></div>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Recent History</div>
            <div className="divide-y divide-slate-100">
               {history.map((record: any, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{record.date.split(' ')[1]}</div>
                        <div><p className="font-bold text-slate-800 text-sm">{record.date}</p><p className="text-[10px] text-slate-400 uppercase font-bold">{record.time}</p></div>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : record.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{record.status}</span>
                  </div>
               ))}
            </div>
         </div>

         {showLeaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                  <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">Request Leave</h3><button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label><input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                     {/* FIXED: Changed setReason to setLeaveReason */}
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason</label><textarea required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Please detail the reason for leave..." className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
                     <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">Submit Request</button>
                  </form>
               </div>
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Daily Register</h2><p className="text-slate-500">Mark attendance for JOIS Preschool groups.</p></div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm flex-1 md:flex-none">
             <CalendarIcon className="w-4 h-4 text-slate-500" /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm text-slate-700 outline-none w-full bg-white" />
           </div>
           <button onClick={() => setIsSubmitted(true)} disabled={isSubmitted} className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 text-white ${isSubmitted ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{isSubmitted ? 'Submitted' : 'Save Register'}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-4 font-bold text-xs text-slate-500 uppercase tracking-widest">
            <div className="col-span-1">#</div><div className="col-span-5">Student</div><div className="col-span-6 text-center">Status</div>
          </div>
          <div className="p-2 space-y-1">
            {mockStudents.map((s, i) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="col-span-1 text-slate-400 font-bold">{i+1}</div>
                <div className="col-span-5 flex items-center gap-3"><img src={s.image} className="w-8 h-8 rounded-full border" /><div><p className="font-bold text-slate-800 text-sm">{s.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{s.grade}</p></div></div>
                <div className="col-span-6 flex justify-center gap-2">
                  <button onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Present'}))} className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all ${attendanceState[s.id] === 'Present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>Present</button>
                  <button onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Absent'}))} className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all ${attendanceState[s.id] === 'Absent' ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'}`}>Absent</button>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};
