import React, { useState } from 'react';
import { mockStudents, getMyChild } from '../data/mockData';
import { UserRole } from '../types';
import { Calendar as CalendarIcon, Check, X, Clock, Save, UserCheck, CalendarPlus, AlertCircle } from 'lucide-react';

interface AttendanceProps {
  role?: UserRole;
}

export const Attendance: React.FC<AttendanceProps> = ({ role }) => {
  // Teacher/Admin State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parent State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Parent View Logic
  if (role === UserRole.PARENT) {
    const child = getMyChild();
    if (!child) return <div className="p-6">No student record linked to this account.</div>;

    // Mock Attendance History for Parent
    const history = Array.from({ length: 14 }).map((_, i) => {
       const d = new Date();
       d.setDate(d.getDate() - i);
       // Skip weekends
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
      alert(`Leave requested successfully for ${child.name}!\nFrom: ${leaveStartDate}\nTo: ${leaveEndDate}`);
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
    };

    return (
      <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Attendance Record</h2>
              <p className="text-slate-500">Viewing attendance history for <span className="font-semibold text-slate-700">{child.name}</span></p>
            </div>
            <button 
               onClick={() => setShowLeaveModal(true)}
               className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 w-full md:w-auto justify-center"
            >
               <CalendarPlus className="w-4 h-4" /> Request Leave
            </button>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Overall Attendance</p>
                  <h3 className="text-3xl font-black text-slate-800">{child.attendance}%</h3>
               </div>
               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Days Present</p>
                  <h3 className="text-3xl font-black text-emerald-600">42</h3>
               </div>
               <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <UserCheck className="w-6 h-6" />
               </div>
            </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Days Absent</p>
                  <h3 className="text-3xl font-black text-rose-600">3</h3>
               </div>
               <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-6 h-6" />
               </div>
            </div>
         </div>

         {/* History List */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
               Recent History
            </div>
            <div className="divide-y divide-slate-100">
               {history.map((record: any, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm
                           ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 
                             record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                           {record.date.split(' ')[1]}
                        </div>
                        <div>
                           <p className="font-bold text-slate-800">{record.date}</p>
                           <p className="text-xs text-slate-500">Check-in: {record.time}</p>
                        </div>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold 
                        ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 
                          record.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {record.status}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* Modal */}
         {showLeaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
               <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-slate-800">Request Leave</h3>
                     <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                        <textarea required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Please detail the reason for leave..." className="w-full px-4 py-2 border border-slate-200 rounded-xl h-24 resize-none"></textarea>
                     </div>
                     <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-2 shadow-lg">Submit Request</button>
                  </form>
               </div>
            </div>
         )}
      </div>
    );
  }

  // Teacher/Admin View Logic
  const handleMark = (id: string, status: 'Present' | 'Absent' | 'Late') => {
    if (isSubmitted) return;
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  const stats = {
    present: Object.values(attendanceState).filter(s => s === 'Present').length,
    absent: Object.values(attendanceState).filter(s => s === 'Absent').length,
    late: Object.values(attendanceState).filter(s => s === 'Late').length,
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live Attendance Register</h2>
          <p className="text-slate-500">Mark and view daily attendance for Grade 5-A.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm flex-1 md:flex-none">
             <CalendarIcon className="w-4 h-4 text-slate-500" />
             <input 
               type="date" 
               value={date} 
               onChange={(e) => setDate(e.target.value)}
               className="text-sm text-slate-700 outline-none w-full md:w-auto bg-transparent"
             />
           </div>
           <button 
             onClick={() => setIsSubmitted(true)}
             disabled={isSubmitted}
             className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 text-white transition-colors whitespace-nowrap ${isSubmitted ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700'}`}
           >
             {isSubmitted ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
             {isSubmitted ? 'Submitted' : 'Save Attendance'}
           </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase">Present</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-rose-600 font-semibold uppercase">Absent</p>
            <p className="text-2xl font-bold text-rose-700">{stats.absent}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase">Late</p>
            <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
          </div>
        </div>
      </div>

      {/* Register List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto flex-1">
             <div className="min-w-[600px] h-full flex flex-col">
                 <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-4 font-semibold text-sm text-slate-600">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Student Details</div>
                    <div className="col-span-6 text-center">Status</div>
                 </div>
                 <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {mockStudents.map((student, idx) => {
                      const status = attendanceState[student.id];
                      return (
                        <div key={student.id} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                           <div className="col-span-1 text-slate-500 font-medium pl-2">{idx + 1}</div>
                           <div className="col-span-5 flex items-center gap-3">
                              <img src={student.image} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.id}</p>
                              </div>
                           </div>
                           <div className="col-span-6 flex justify-center gap-2">
                              <button 
                                onClick={() => handleMark(student.id, 'Present')}
                                className={`flex-1 max-w-[100px] py-1.5 rounded text-xs font-semibold border transition-all ${status === 'Present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                              >
                                Present
                              </button>
                              <button 
                                onClick={() => handleMark(student.id, 'Absent')}
                                className={`flex-1 max-w-[100px] py-1.5 rounded text-xs font-semibold border transition-all ${status === 'Absent' ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                              >
                                Absent
                              </button>
                              <button 
                                onClick={() => handleMark(student.id, 'Late')}
                                className={`flex-1 max-w-[100px] py-1.5 rounded text-xs font-semibold border transition-all ${status === 'Late' ? 'bg-amber-400 text-white border-amber-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                              >
                                Late
                              </button>
                           </div>
                        </div>
                      );
                    })}
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};