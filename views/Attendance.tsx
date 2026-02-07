
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import { UserRole, Student, AttendanceRecord, AttendanceLog, ProgramType, Staff } from '../types';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Save, 
  UserCheck, 
  Loader2, 
  Search, 
  History, 
  FileText, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Users, 
  PieChart, 
  Download, 
  FileSpreadsheet, 
  FileDown, 
  ClipboardList,
  LayoutGrid,
  FileWarning,
  Table as TableIcon,
  Activity,
  Lock,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileBarChart,
  CalendarDays
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface AttendanceProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

const SummaryStat = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 md:gap-4 shrink-0 flex-1 min-w-[100px] md:min-w-[150px]">
     <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${color} text-white shadow-sm`}>
       <Icon className="w-4 h-4 md:w-5 md:h-5" />
     </div>
     <div className="min-w-0">
        <p className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 leading-none truncate">{label}</p>
        <p className="text-sm md:text-xl font-black text-slate-900 leading-none truncate">{value}</p>
     </div>
  </div>
);

export const Attendance: React.FC<AttendanceProps> = ({ role, showToast }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [showReportModal, setShowReportModal] = useState(false);

  const isParent = role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER;
  const isAdmin = role === UserRole.ADMIN;
  const isFounder = role === UserRole.FOUNDER;
  const canManage = isAdmin || isFounder || isTeacher;

  const loadData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    try {
      const [allStudents, allLogsData, allLeaves, allStaff] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceLogs'),
        db.getAll('leaveRequests'),
        db.getAll('staff')
      ]);

      if (isTeacher) {
        const currentTeacher = allStaff.find((s: Staff) => s.role === 'Teacher');
        if (currentTeacher?.classAssigned) {
          setActiveProgram(currentTeacher.classAssigned as ProgramType);
        }
      }

      setStudents(allStudents);
      setAllLogs(allLogsData);
      
      const initial: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      const existingLogsForDate = allLogsData.filter(l => l.date === selectedDate);
      
      allStudents.forEach(s => {
        const log = existingLogsForDate.find(l => l.studentId === s.id);
        if (log) {
          initial[s.id] = log.status as any;
        } else {
          const approvedLeave = allLeaves.find(lv => 
            lv.studentId === s.id && 
            lv.status === 'Approved' && 
            selectedDate >= lv.startDate && 
            selectedDate <= lv.endDate
          );
          initial[s.id] = approvedLeave ? 'Absent' : 'Present';
        }
      });

      setAttendanceState(initial);
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => { loadData(date); }, [date, loadData]);

  const handleSaveRegister = async () => {
    setSaving(true);
    try {
      const recordsToSave = activeProgram === 'All' 
        ? attendanceState 
        : Object.keys(attendanceState).reduce((acc, id) => {
            const student = students.find(s => s.id === id);
            if (student && (student.program === activeProgram)) acc[id] = attendanceState[id];
            return acc;
          }, {} as any);

      await schoolService.markAttendance(date, recordsToSave);
      showToast?.("Attendance Saved", "success", `Records for ${date} have been updated.`);
      loadData(date);
    } catch (e) {
      showToast?.("Error Saving", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = activeProgram === 'All' || s.program === activeProgram;
      return matchesSearch && matchesProgram;
    });
  }, [students, searchTerm, activeProgram]);

  const stats = useMemo(() => {
    const relevantIds = new Set(filteredStudents.map(s => s.id));
    const statuses = Object.entries(attendanceState)
      .filter(([id]) => relevantIds.has(id))
      .map(([, status]) => status);

    return {
      present: statuses.filter(s => s === 'Present').length,
      absent: statuses.filter(s => s === 'Absent').length,
      total: filteredStudents.length
    };
  }, [filteredStudents, attendanceState]);

  const historyList = useMemo(() => {
    const dayMap: Record<string, { present: number, absent: number }> = {};
    allLogs.forEach(log => {
      if (!dayMap[log.date]) dayMap[log.date] = { present: 0, absent: 0 };
      if (log.status === 'Present') dayMap[log.date].present++;
      else dayMap[log.date].absent++;
    });
    return Object.entries(dayMap).map(([dateKey, counts]) => ({
      date: dateKey,
      ...counts,
      label: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [allLogs]);

  // Report Download Functions
  const downloadCSV = (rows: string[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDailyClassReport = (customDate?: string, customProgram?: string) => {
    const targetDate = customDate || date;
    const targetProgram = customProgram || activeProgram;
    
    const headers = ["Student ID", "Student Name", "Class", "Date", "Status"];
    
    // If it's a history date, we need to fetch logs for that day
    const dayLogs = allLogs.filter(l => l.date === targetDate);
    const targetStudents = targetProgram === 'All' ? students : students.filter(s => s.program === targetProgram);

    const rows = targetStudents.map(s => {
      const log = dayLogs.find(l => l.studentId === s.id);
      return [
        s.id,
        s.name,
        s.program,
        targetDate,
        log ? log.status : "No Record"
      ];
    });

    downloadCSV([headers, ...rows], `Attendance_Daily_${targetProgram}_${targetDate}.csv`);
    showToast?.("Report Downloaded", "success", `Daily report for ${targetProgram} generated.`);
  };

  const downloadMonthlyClassReport = (customMonth?: string, customProgram?: string) => {
    const yearMonth = customMonth || date.substring(0, 7); 
    const targetProgram = customProgram || activeProgram;
    const headers = ["Student ID", "Student Name", "Class", "Date", "Status"];
    
    const monthlyLogs = allLogs.filter(l => 
      l.date.startsWith(yearMonth) && 
      (targetProgram === 'All' || students.find(s => s.id === l.studentId)?.program === targetProgram)
    );
    
    const rows = monthlyLogs.map(l => {
      const s = students.find(st => st.id === l.studentId);
      return [l.studentId, s?.name || "Unknown", s?.program || "Unknown", l.date, l.status];
    });
    
    downloadCSV([headers, ...rows], `Attendance_Monthly_${targetProgram}_${yearMonth}.csv`);
    showToast?.("Report Downloaded", "success", `Monthly report for ${yearMonth} generated.`);
  };

  const downloadIndividualReport = (student: Student) => {
    const headers = ["Date", "Status"];
    const childLogs = allLogs
      .filter(l => l.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    const rows = childLogs.map(l => [l.date, l.status]);
    downloadCSV([headers, ...rows], `Attendance_History_${student.name.replace(/\s+/g, '_')}.csv`);
    showToast?.("Report Downloaded", "success", `History for ${student.name} generated.`);
  };

  if (isParent) {
    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const childLogs = allLogs.filter(l => l.studentId === myChild?.id).sort((a, b) => b.date.localeCompare(a.date));
    
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 h-full overflow-y-auto no-scrollbar pb-24 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <img src={myChild?.image} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-slate-100" alt="Student" />
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">{myChild?.name}</h2>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">{myChild?.program} • Academic Year 2025</p>
          </div>
          <button 
            onClick={() => myChild && downloadIndividualReport(myChild)}
            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-200 transition-all active:scale-95"
            title="Download History"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" /> Attendance Ledger
              </h3>
           </div>
           <div className="divide-y divide-slate-100">
              {childLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No logs found</p>
                </div>
              ) : childLogs.slice(0, 20).map((log) => (
                 <div key={log.id} className="p-4 md:p-5 flex items-center justify-between group hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${log.status === 'Present' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        {log.status === 'Present' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800 leading-none">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Checked In: 08:30 AM</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${log.status === 'Present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'}`}>{log.status}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-slate-50 animate-in fade-in duration-300 min-h-full pb-8">
      {/* Tab Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
             <button onClick={() => setActiveTab('register')} className={`flex-1 md:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mark Register</button>
             <button onClick={() => setActiveTab('history')} className={`flex-1 md:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>History</button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {activeTab === 'register' && (
              <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
                <button onClick={() => setActiveProgram('All')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeProgram === 'All' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
                {PROGRAMS.map(prog => (
                  <button key={prog} onClick={() => setActiveProgram(prog)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeProgram === prog ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{prog}</button>
                ))}
              </div>
            )}
            
            {activeTab === 'register' && (
              <div className="md:hidden flex-1 relative min-w-[120px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select 
                  value={activeProgram}
                  onChange={(e) => setActiveProgram(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-700 outline-none appearance-none shadow-sm"
                >
                  <option value="All">All Classes</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {canManage && (
              <div className="flex items-center gap-1 md:gap-2">
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
                >
                  <FileBarChart className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Reports</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-6 space-y-6">
        {activeTab === 'register' ? (
          <>
            {/* Stats & Search Row - Optimized for Mobile visibility */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2 md:gap-4 flex-1 overflow-x-auto no-scrollbar">
                <SummaryStat icon={Users} label="Enrolled" value={stats.total} color="bg-blue-600" />
                <SummaryStat icon={CheckCircle2} label="Present" value={stats.present} color="bg-emerald-600" />
                <SummaryStat icon={AlertCircle} label="Absent" value={stats.absent} color="bg-rose-500" />
              </div>
              <div className="relative md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search roster..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Date and Action Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg"><CalendarIcon className="w-5 h-5 md:w-6 md:h-6" /></div>
                 <div>
                    <h2 className="text-sm md:text-lg font-black text-slate-900 leading-none">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Roll Call Management</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                />
                <button onClick={handleSaveRegister} disabled={saving} className="flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} <span className="hidden sm:inline">Save Register</span><span className="sm:hidden">Save</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Compiling Roster...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records match the filter</p>
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-4 md:p-5 hover:bg-slate-50/80 transition-all gap-4">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <img src={s.image} className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover border border-slate-100 shadow-sm" alt="Student" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{s.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">{s.program}</span>
                          <span className="text-[8px] font-mono text-slate-400 uppercase">ID: {s.id}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadIndividualReport(s)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {['Present', 'Absent'].map((status) => (
                        <button 
                          key={status}
                          onClick={() => setAttendanceState(p => ({...p, [s.id]: status as any}))} 
                          className={`flex-1 md:flex-none md:w-32 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                            attendanceState[s.id] === status 
                              ? `${status === 'Present' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100'}` 
                              : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Attendance Archive</h3>
             </div>
             
             {/* Desktop Table */}
             <div className="hidden md:block">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-slate-100 text-slate-400">
                     <tr>
                       <th className="px-8 py-4">Session Date</th>
                       <th className="px-8 py-4 text-center">Present</th>
                       <th className="px-8 py-4 text-center">Absent</th>
                       <th className="px-8 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {historyList.map((rec) => (
                        <tr key={rec.date} className="hover:bg-slate-50/80 transition-all group">
                           <td className="px-8 py-5">
                             <p className="font-bold text-slate-900 text-sm leading-none mb-1">{rec.label}</p>
                             <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">{rec.date}</p>
                           </td>
                           <td className="px-8 py-5 text-center text-emerald-600 font-black text-sm">
                              <span className="bg-emerald-50 px-3 py-1 rounded-full">{rec.present}</span>
                           </td>
                           <td className="px-8 py-5 text-center text-rose-600 font-black text-sm">
                              <span className="bg-rose-50 px-3 py-1 rounded-full">{rec.absent}</span>
                           </td>
                           <td className="px-8 py-5 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => downloadDailyClassReport(rec.date)}
                                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setDate(rec.date); setActiveTab('register'); }} 
                                  className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Mobile Card List */}
             <div className="md:hidden divide-y divide-slate-100">
                {historyList.map((rec) => (
                  <div key={rec.date} className="p-5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100" onClick={() => { setDate(rec.date); setActiveTab('register'); }}>
                    <div className="flex flex-col">
                      <p className="font-black text-slate-900 text-sm leading-none mb-2">{rec.label}</p>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{rec.present} Present</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{rec.absent} Absent</span>
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={(e) => { e.stopPropagation(); downloadDailyClassReport(rec.date); }}
                         className="p-2 bg-slate-50 text-slate-400 rounded-lg"
                        >
                         <Download className="w-4 h-4" />
                       </button>
                       <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                ))}
             </div>

             {historyList.length === 0 && (
                <div className="py-24 text-center">
                  <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No historical data found</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* COMPREHENSIVE REPORT GENERATION MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Generate Reports</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Export attendance spreadsheets</p>
                 </div>
                 <button onClick={() => setShowReportModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition-all border border-slate-100">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="space-y-8">
                 {/* DAILY REPORT GENERATOR */}
                 <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                          <CalendarIcon className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-sm">Daily Class Report</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Attendance for a specific day</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <input 
                         type="date" 
                         defaultValue={date}
                         id="report-daily-date"
                         className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                       />
                       <select 
                         id="report-daily-program"
                         className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none"
                       >
                         <option value="All">All Classes</option>
                         {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                    <button 
                      onClick={() => {
                        const d = (document.getElementById('report-daily-date') as HTMLInputElement).value;
                        const p = (document.getElementById('report-daily-program') as HTMLSelectElement).value;
                        downloadDailyClassReport(d, p);
                      }}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                       <Download className="w-4 h-4" /> Download Daily
                    </button>
                 </div>

                 {/* MONTHLY REPORT GENERATOR */}
                 <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                          <FileBarChart className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-sm">Monthly Summary</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Consolidated monthly report</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <input 
                         type="month" 
                         defaultValue={date.substring(0, 7)}
                         id="report-monthly-date"
                         className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                       />
                       <select 
                         id="report-monthly-program"
                         className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase outline-none"
                       >
                         <option value="All">All Classes</option>
                         {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                    <button 
                      onClick={() => {
                        const m = (document.getElementById('report-monthly-date') as HTMLInputElement).value;
                        const p = (document.getElementById('report-monthly-program') as HTMLSelectElement).value;
                        downloadMonthlyClassReport(m, p);
                      }}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                       <Download className="w-4 h-4" /> Download Monthly
                    </button>
                 </div>

                 {/* INDIVIDUAL SEARCH REPORT */}
                 <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md">
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-sm">Individual Search</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Export single student history</p>
                       </div>
                    </div>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                       <select 
                         id="report-individual-id"
                         className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none appearance-none"
                       >
                         <option value="">Select Student...</option>
                         {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                       </select>
                    </div>
                    <button 
                      onClick={() => {
                        const sid = (document.getElementById('report-individual-id') as HTMLSelectElement).value;
                        const student = students.find(s => s.id === sid);
                        if (student) downloadIndividualReport(student);
                        else showToast?.("Error", "error", "Please select a student.");
                      }}
                      className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                       <Download className="w-4 h-4" /> Export History
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
