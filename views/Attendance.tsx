
import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import { UserRole, Student, AttendanceRecord } from '../types';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Save, 
  UserCheck, 
  CalendarPlus, 
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';
import { getMyChild } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface AttendanceProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

export const Attendance: React.FC<AttendanceProps> = ({ role, showToast }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentChild, setParentChild] = useState<Student | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('students');
      setStudents(data);
      
      if (role === UserRole.PARENT) {
        // Real-time lookup for parent's specific child
        const child = getMyChild();
        if (child) {
          const freshChild = data.find(s => s.id === child.id);
          setParentChild(freshChild || child);
        }
      }

      const initial: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      data.forEach(s => initial[s.id] = 'Present');
      setAttendanceState(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const sub = db.subscribe('students', loadData, loadData, loadData);
    return () => { sub.unsubscribe(); };
  }, [role]);

  const handleSaveRegister = async () => {
    setSaving(true);
    try {
      await schoolService.markAttendance(date, attendanceState);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      showToast?.("Attendance Saved", "success", "Daily register has been updated successfully.");
    } catch (e) {
      showToast?.("Save Failed", "error", "Could not sync register with database.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role === UserRole.PARENT) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Attendance Log</h2>
            <p className="text-slate-500 font-medium">Monitoring {parentChild?.name || 'Student'}'s presence in school.</p>
          </div>
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Live Rate</p>
              <p className="text-2xl font-black">{parentChild?.attendance || 100}%</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
              <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-3">
                 <CalendarIcon className="w-6 h-6 text-blue-500" /> Attendance History
              </h3>
              <div className="space-y-4">
                 {/* This section would ideally pull from an attendance_logs table. 
                     For this implementation, we show recent status calculated from profile data */}
                 <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="font-bold text-sm">Detailed day-by-day logs are archived by the teacher. Please contact the front desk for official certificates.</p>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <h4 className="text-2xl font-black mb-2">Leave Summary</h4>
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                       <p className="text-xl font-black uppercase">{parentChild?.attendance && parentChild.attendance > 85 ? 'Healthy' : 'Warning'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Enrolled</p>
                       <p className="text-xl font-black uppercase">{parentChild?.grade || 'N/A'}</p>
                    </div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-start gap-4 shadow-sm">
                 <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                 </div>
                 <div>
                    <h5 className="font-black text-slate-800">Attendance Policy</h5>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">A minimum of 75% attendance is required for progress to the next group. Current profile reflects the latest teacher entries.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Register</h2>
          <p className="text-slate-500 font-medium mt-1">Mark student attendance for {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm hover:border-blue-100 transition-colors focus-within:ring-4 focus-within:ring-blue-50">
             <CalendarIcon className="w-5 h-5 text-slate-400" />
             <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm font-bold text-slate-700 outline-none bg-transparent" />
           </div>
           <button 
             onClick={handleSaveRegister} 
             disabled={saving || isSubmitted} 
             className={`px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2 text-white transition-all active:scale-95 ${
               isSubmitted ? 'bg-emerald-500 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
             }`}
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSubmitted ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
             {saving ? 'Syncing...' : isSubmitted ? 'Register Saved' : 'Save Register'}
           </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search students by name or group..." 
          className="flex-1 outline-none text-sm font-bold text-slate-700 bg-white" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
        <div className="hidden md:flex items-center gap-6 px-6 border-l border-slate-100">
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Present</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Absent</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Child Details</div>
            <div className="col-span-6 text-center">Status Control</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Accessing Database...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                  <UserCheck className="w-16 h-16 opacity-10 mb-4" />
                  <p className="font-bold">No matching student records found.</p>
               </div>
            ) : (
              filteredStudents.map((s, i) => (
                <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-slate-50/50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                  <div className="col-span-1 text-slate-300 font-black text-xs">{i+1}</div>
                  <div className="col-span-5 flex items-center gap-4">
                    <img src={s.image} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-black text-slate-800 text-sm">{s.name}</p>
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{s.grade} • {s.section}</p>
                    </div>
                  </div>
                  <div className="col-span-6 flex justify-center gap-3">
                    <button 
                      onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Present'}))} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        attendanceState[s.id] === 'Present' 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'
                      }`}
                    >
                      Present
                    </button>
                    <button 
                      onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Absent'}))} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        attendanceState[s.id] === 'Absent' 
                          ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200'
                      }`}
                    >
                      Absent
                    </button>
                    <button 
                      onClick={() => setAttendanceState(p => ({...p, [s.id]: 'Late'}))} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        attendanceState[s.id] === 'Late' 
                          ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-amber-200'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
};
