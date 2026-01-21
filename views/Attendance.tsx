
import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink, 
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
  CalendarDays
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface AttendanceProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const Attendance: React.FC<AttendanceProps> = ({ role, showToast }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [leaveNotes, setLeaveNotes] = useState<Record<string, string>>({});
  const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Modal States
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [monthlyReportData, setMonthlyReportData] = useState<any[]>([]);
  const [reportDates, setReportDates] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const isParent = role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER;
  const isAdmin = role === UserRole.ADMIN;

  const loadData = async (selectedDate: string) => {
    setLoading(true);
    try {
      const [allStudents, allRecords, logs, allLeaves, allStaff] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceRecords'),
        db.getAll('attendanceLogs'),
        db.getAll('leaveRequests'),
        db.getAll('staff')
      ]);

      if (isTeacher) {
        const currentTeacher = allStaff.find((s: Staff) => s.role === 'Teacher');
        if (currentTeacher && currentTeacher.classAssigned) {
          setActiveProgram(currentTeacher.classAssigned as ProgramType);
        } else if (activeProgram === 'All') {
          setActiveProgram('Little Seeds');
        }
      }

      setStudents(allStudents);
      setSavedRecords(allRecords.sort((a, b) => b.date.localeCompare(a.date)));
      setAllLogs(logs);
      
      const initial: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      const notes: Record<string, string> = {};
      const existingLogsForDate = logs.filter(l => l.date === selectedDate);
      
      const latestLogsMap: Record<string, AttendanceLog> = {};
      existingLogsForDate.forEach(l => {
        latestLogsMap[l.studentId] = l;
      });

      allStudents.forEach(s => {
        const log = latestLogsMap[s.id];
        if (log) {
          initial[s.id] = log.status as any;
        } else {
          const approvedLeave = allLeaves.find(lv => 
            lv.studentId === s.id && 
            lv.status === 'Approved' && 
            selectedDate >= lv.startDate && 
            selectedDate <= lv.endDate
          );
          if (approvedLeave) {
            initial[s.id] = 'Absent';
            notes[s.id] = "Approved Leave";
          } else {
            initial[s.id] = 'Present';
          }
        }
      });

      setAttendanceState(initial);
      setLeaveNotes(notes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(date); }, [date, role]);

  const handleDownloadParentMonthly = () => {
    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    if (!myChild) return;

    setExporting(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const monthLogs = allLogs.filter(l => 
        l.studentId === myChild.id && 
        l.date.startsWith(selectedMonth)
      );

      const csvRows = [
        [`JUNIOR ODYSSEY INTERNATIONAL - STUDENT ATTENDANCE LOG`],
        [`Student: ${myChild.name} (${myChild.id})`],
        [`Period: ${monthLabel}`],
        [],
        ['Date', 'Day', 'Status', 'Verification'],
      ];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.toLocaleString('default', { weekday: 'long' });
        const log = monthLogs.find(l => l.date === dateStr);
        csvRows.push([dateStr, dayOfWeek, log?.status || 'No Record', log ? 'System Verified' : '-']);
      }

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${myChild.name.replace(/\s/g, '_')}_Attendance_${monthLabel.replace(/\s/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.("Download Started", "success", `Monthly report for ${monthLabel} is ready.`);
    } catch (err) {
      showToast?.("Export Error", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveRegister = async () => {
    setSaving(true);
    try {
      const recordsToSave = activeProgram === 'All' 
        ? attendanceState 
        : Object.keys(attendanceState).reduce((acc, id) => {
            const student = students.find(s => s.id === id);
            if (student && student.program === activeProgram) acc[id] = attendanceState[id];
            return acc;
          }, {} as any);

      await schoolService.markAttendance(date, recordsToSave);
      showToast?.("Sync Successful", "success", `Attendance for ${date} in ${activeProgram} has been posted.`);
      loadData(date);
    } catch (e) {
      showToast?.("Sync Error", "error");
    } finally {
      setSaving(false);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = activeProgram === 'All' || s.program === activeProgram;
      return matchesSearch && matchesProgram;
    });
  }, [students, searchTerm, activeProgram]);

  const stats = useMemo(() => {
    const relevantIds = new Set(filteredStudents.map(s => s.id));
    const relevantStatuses = Object.entries(attendanceState)
      .filter(([id]) => relevantIds.has(id))
      .map(([, status]) => status);

    return {
      present: relevantStatuses.filter(s => s === 'Present').length,
      absent: relevantStatuses.filter(s => s === 'Absent').length,
      late: relevantStatuses.filter(s => s === 'Late').length,
      total: filteredStudents.length
    };
  }, [filteredStudents, attendanceState]);

  const historyLedger = useMemo(() => {
    const programStudentIds = activeProgram === 'All' 
      ? new Set(students.map(s => s.id))
      : new Set(students.filter(s => s.program === activeProgram).map(s => s.id));

    const dayMap: Record<string, Record<string, 'Present' | 'Absent' | 'Late'>> = {};

    allLogs.forEach(log => {
      if (programStudentIds.has(log.studentId)) {
        if (!dayMap[log.date]) dayMap[log.date] = {};
        dayMap[log.date][log.studentId] = log.status as any;
      }
    });

    return Object.entries(dayMap).map(([dateKey, studentStatuses]) => {
      const counts = Object.values(studentStatuses).reduce((acc, status) => {
        if (status === 'Present') acc.present++;
        else if (status === 'Absent') acc.absent++;
        else if (status === 'Late') acc.late++;
        return acc;
      }, { present: 0, absent: 0, late: 0 });

      return {
        id: dateKey,
        date: dateKey,
        ...counts,
        status: 'Submitted' as const,
        label: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [activeProgram, allLogs, students]);

  const handleExportDaily = (targetDate: string) => {
    setExporting(true);
    try {
      const dayLogs = allLogs.filter(l => l.date === targetDate);
      const programLabel = activeProgram === 'All' ? 'All Classes' : activeProgram;
      
      const csvRows = [
        [`JUNIOR ODYSSEY INTERNATIONAL - ATTENDANCE AUDIT`],
        [`Report Date: ${targetDate}`],
        [`Program Scope: ${programLabel}`],
        [],
        ['Student ID', 'Legal Name', 'Assigned Program', 'Attendance Status', 'Verified Date'],
        ...dayLogs
          .filter(l => {
             if (activeProgram === 'All') return true;
             const s = students.find(st => st.id === l.studentId);
             return s?.program === activeProgram;
          })
          .map(l => {
            const s = students.find(st => st.id === l.studentId);
            return [`"${l.studentId}"`, `"${s?.name || 'Unknown'}"`, `"${s?.program || 'N/A'}"`, `"${l.status}"`, `"${l.date}"`];
          })
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Daily_Attendance_${activeProgram.replace(/\s/g, '_')}_${targetDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.("Daily Report Downloaded", "success");
    } finally {
      setExporting(false);
    }
  };

  const prepareMonthlyReport = () => {
    setExporting(true);
    const selectedDate = new Date(date);
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    const datesOfMonth = Array.from({ length: lastDay }, (_, i) => 
      `${currentMonthKey}-${String(i + 1).padStart(2, '0')}`
    );
    setReportDates(datesOfMonth);

    const monthLogs = allLogs.filter(l => l.date.startsWith(currentMonthKey));
    
    const report = students
      .filter(s => activeProgram === 'All' || s.program === activeProgram)
      .map(s => {
        const studentLogs = monthLogs.filter(l => l.studentId === s.id);
        const dayMap: Record<string, string> = {};
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        const latestPerDay: Record<string, string> = {};
        studentLogs.forEach(l => { latestPerDay[l.date] = l.status; });

        Object.entries(latestPerDay).forEach(([day, status]) => {
          dayMap[day] = status;
          if (status === 'Present') presentCount++;
          else if (status === 'Absent') absentCount++;
          else if (status === 'Late') lateCount++;
        });

        const totalMarked = presentCount + absentCount + lateCount;
        const percentage = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : '0';

        return {
          id: s.id,
          name: s.name,
          program: s.program,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          totalDays: totalMarked,
          percentage: `${percentage}%`,
          image: s.image,
          dayMap
        };
      });

    setMonthlyReportData(report);
    setShowReportPreview(true);
    setExporting(false);
  };

  const downloadMonthlyCSV = () => {
    const selectedDate = new Date(date);
    const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const programLabel = activeProgram === 'All' ? 'Whole School' : activeProgram;

    const dateHeaders = reportDates.map(d => new Date(d).getDate());
    const csvRows = [
      [`JUNIOR ODYSSEY INTERNATIONAL - MONTHLY ATTENDANCE REGISTER`],
      [`Period: ${monthLabel}`],
      [`Program Scope: ${programLabel}`],
      [],
      ['ID', 'Student Name', 'Program', ...dateHeaders, 'Present', 'Absent', 'Late', '%'],
      ...monthlyReportData.map(r => {
        const rowStatuses = reportDates.map(d => {
          const status = r.dayMap[d];
          if (!status) return '-';
          return status.charAt(0); // P, A, or L
        });
        return [
          `"${r.id}"`, 
          `"${r.name}"`, 
          `"${r.program}"`, 
          ...rowStatuses,
          r.present, 
          r.absent, 
          r.late, 
          `"${r.percentage}"`
        ];
      }),
      [],
      ['LEGEND: P = Present, A = Absent, L = Late, - = No Record'],
      ['Report Generated:', new Date().toLocaleString()],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Monthly_Register_${activeProgram.replace(/\s/g, '_')}_${monthLabel.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.("Monthly Register Exported", "success");
  };

  if (isParent) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
          <p className="font-black uppercase tracking-[0.2em] text-xs">Authenticating Profile</p>
        </div>
      );
    }

    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    
    const childLogsMap: Record<string, AttendanceLog> = {};
    allLogs
      .filter(l => l.studentId === myChild?.id)
      .forEach(l => {
        childLogsMap[l.date] = l;
      });
    const childLogs = Object.values(childLogsMap).sort((a, b) => b.date.localeCompare(a.date));
    
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto pb-24 h-full no-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
          <div className="flex items-center gap-6">
            <img src={myChild?.image} className="w-20 h-20 rounded-3xl object-cover shadow-xl border-4 border-slate-50" />
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{myChild?.name}</h2>
              <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">{myChild?.program} • {myChild?.id}</p>
            </div>
          </div>
          <div className="bg-emerald-500 text-white p-6 rounded-[2rem] shadow-2xl shadow-emerald-100 flex items-center gap-6 self-stretch md:self-auto">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-2">Overall Score</p>
              <p className="text-4xl font-black leading-none">{myChild?.attendance || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <PieChart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-3">
                 <ClipboardList className="w-5 h-5 text-blue-600" /> Academic Presence Record
              </h3>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest px-3 py-2 outline-none"
                />
                <button 
                  onClick={handleDownloadParentMonthly} 
                  disabled={exporting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Download CSV
                </button>
              </div>
           </div>
           <div className="divide-y divide-slate-50">
              {childLogs.slice(0, 30).map((log) => (
                 <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                         log.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 
                         log.status === 'Absent' ? 'bg-rose-100 text-rose-600' : 
                         'bg-amber-100 text-amber-600'
                      }`}>
                         {new Date(log.date).getDate()}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-800">{new Date(log.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Verified System Entry</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       log.status === 'Present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                       log.status === 'Absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 
                       'bg-amber-400 text-slate-900 shadow-lg shadow-amber-100'
                    }`}>
                       {log.status}
                    </span>
                 </div>
              ))}
              {childLogs.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                  <Activity className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No presence logs detected for this cycle.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-w-[1500px] mx-auto w-full overflow-hidden bg-slate-50/50">
      
      <div className="px-8 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setActiveTab('register')}
                className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <UserCheck className="w-4 h-4" /> Roll Call
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <History className="w-4 h-4" /> History Ledger
              </button>
           </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar max-w-full">
           {isAdmin ? (
             <>
               <button 
                 onClick={() => setActiveProgram('All')} 
                 className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeProgram === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
               >
                 All Programs
               </button>
               {PROGRAMS.map(prog => (
                 <button 
                   key={prog}
                   onClick={() => setActiveProgram(prog)} 
                   className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeProgram === prog ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
                 >
                   {prog}
                 </button>
               ))}
             </>
           ) : (
             <div className="px-8 py-2 text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Dedicated Program: {activeProgram}
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
        {activeTab === 'register' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
               <SummaryCard icon={Users} label="Program Cohort" value={stats.total} color="bg-blue-50 text-blue-600" />
               <SummaryCard icon={Check} label="Present Today" value={stats.present} color="bg-emerald-50 text-emerald-600" />
               <SummaryCard icon={X} label="Absent Today" value={stats.absent} color="bg-rose-50 text-rose-600" />
               <SummaryCard icon={Clock} label="Late Count" value={stats.late} color="bg-amber-50 text-amber-600" />
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><CalendarIcon className="w-6 h-6" /></div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                    <p className="text-slate-500 font-medium text-sm uppercase tracking-widest text-[10px]">Registry Control • {activeProgram}</p>
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                 <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                   <button onClick={() => shiftDate(-1)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                   <input type="date" value={date} max={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)} className="px-4 py-1.5 text-[12px] font-black text-slate-800 outline-none bg-transparent cursor-pointer" />
                   <button onClick={() => shiftDate(1)} disabled={date === new Date().toISOString().split('T')[0]} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 disabled:opacity-20 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                 </div>
                 <button onClick={handleSaveRegister} disabled={saving} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Post Entry
                 </button>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input type="text" placeholder="Search in your assigned cohort..." className="w-full pl-14 pr-6 py-3.5 outline-none text-sm font-medium text-slate-700 bg-slate-50/50 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 space-y-1">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                      <Loader2 className="w-10 h-10 animate-spin mb-6 text-blue-500" />
                      <p className="font-black uppercase tracking-[0.2em] text-[10px]">Accessing Cohort</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 text-slate-300 gap-4">
                        <FileWarning className="w-16 h-16 opacity-10" />
                        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">No students found in {activeProgram}</p>
                    </div>
                  ) : (
                    filteredStudents.map((s) => (
                      <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-5 hover:bg-slate-50/80 rounded-[1.8rem] transition-all group gap-6 border-b border-slate-50 last:border-none">
                        <div className="flex items-center gap-6 flex-1 w-full cursor-pointer" onClick={() => setSelectedStudent(s)}>
                          <div className="relative">
                             <img src={s.image} className="w-14 h-14 rounded-[1.5rem] object-cover border-2 border-slate-50 shadow-md group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-black text-slate-900 text-[16px] truncate tracking-tight">{s.name}</p>
                              {leaveNotes[s.id] && <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-100 uppercase flex items-center gap-1"><Info className="w-3 h-3" /> {leaveNotes[s.id]}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{s.program}</span>
                               <span className="text-slate-200">|</span>
                               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {s.id}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto justify-center bg-slate-100/50 p-2 rounded-[1.5rem]">
                          {['Present', 'Absent', 'Late'].map((status) => (
                            <button 
                              key={status}
                              onClick={() => setAttendanceState(p => ({...p, [s.id]: status as any}))} 
                              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                                attendanceState[s.id] === status 
                                  ? `${status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100' : status === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-100' : 'bg-amber-400 text-slate-900 border-amber-400 shadow-xl shadow-amber-100'} shadow-lg` 
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col animate-in slide-in-from-bottom duration-500">
              <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                       <TableIcon className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="font-black text-slate-900 text-xl tracking-tight">Ledger: {activeProgram}</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{historyLedger.length} Historical Records Available</p>
                       </div>
                    </div>
                 </div>
                 
                 <button 
                   onClick={prepareMonthlyReport}
                   className="bg-slate-900 text-white px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                 >
                   <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Generate Performance Audit
                 </button>
              </div>
              
              <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left">
                    <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                       <tr>
                          <th className="px-10 py-6">Audit Date</th>
                          <th className="px-10 py-6">Presence</th>
                          <th className="px-10 py-6">Absences</th>
                          <th className="px-10 py-6">Late Entry</th>
                          <th className="px-10 py-6 text-right">Reporting Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {historyLedger.length === 0 ? (
                         <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No historical logs found for {activeProgram}.</td></tr>
                       ) : (
                         historyLedger.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                             <td className="px-10 py-8" onClick={() => { setDate(rec.date); setActiveTab('register'); }}>
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-200 group-hover:border-blue-600">
                                      <CalendarIcon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                                   </div>
                                   <div>
                                      <span className="text-[15px] font-black text-slate-900 leading-none">{rec.label}</span>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Ref ID: {rec.id.slice(-6)}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-8"><span className="text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">{rec.present}</span></td>
                             <td className="px-10 py-8"><span className="text-rose-600 font-black text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">{rec.absent}</span></td>
                             <td className="px-10 py-8"><span className="text-amber-600 font-black text-sm bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">{rec.late}</span></td>
                             <td className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => { setDate(rec.date); setActiveTab('register'); }} className="p-4 text-slate-300 hover:text-blue-600 bg-slate-50 rounded-2xl hover:shadow-lg transition-all" title="Review Register">
                                      <FileText className="w-5 h-5" />
                                   </button>
                                   <button onClick={() => handleExportDaily(rec.date)} className="p-4 text-slate-300 hover:text-emerald-600 bg-slate-50 rounded-2xl hover:shadow-lg transition-all" title="Export CSV Audit">
                                      <FileDown className="w-5 h-5" />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))
                       )}
                    </tbody>
                 </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showReportPreview && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col border border-white/20">
              <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-3xl shadow-blue-200">
                       <ClipboardList className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Performance Audit Preview</h3>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <LayoutGrid className="w-3 h-3" /> {activeProgram} Scope • {new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setShowReportPreview(false)} className="w-14 h-14 bg-white text-slate-300 hover:text-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-100 hover:shadow-lg transition-all"><X className="w-7 h-7" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-slate-50/30">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthlyReportData.map(r => (
                       <div key={r.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-200/50 flex flex-col group hover:shadow-xl hover:border-blue-100 transition-all">
                          <div className="flex items-center gap-4 mb-6">
                             <img src={r.image} className="w-14 h-14 rounded-[1.5rem] object-cover shadow-md" />
                             <div>
                                <h4 className="font-black text-slate-900 text-sm truncate max-w-[150px]">{r.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{r.id}</p>
                             </div>
                             <div className="ml-auto text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Score</p>
                                <p className="text-2xl font-black text-blue-600 leading-none">{r.percentage}</p>
                             </div>
                          </div>
                          
                          <div className="mb-6 flex flex-wrap gap-1">
                             {reportDates.map(d => {
                                const status = r.dayMap[d];
                                return (
                                   <div 
                                      key={d} 
                                      title={`${new Date(d).getDate()}: ${status || 'No Record'}`}
                                      className={`w-3.5 h-3.5 rounded-sm border ${
                                         status === 'Present' ? 'bg-emerald-500 border-emerald-600' :
                                         status === 'Absent' ? 'bg-rose-500 border-rose-600' :
                                         status === 'Late' ? 'bg-amber-400 border-amber-500' :
                                         'bg-slate-100 border-slate-200'
                                      }`}
                                   />
                                );
                             })}
                          </div>

                          <div className="flex justify-between items-end gap-4 mt-auto">
                             <div className="flex gap-2 text-right">
                                <div className="px-2 py-1 bg-emerald-50 rounded-lg"><p className="text-[8px] font-black text-emerald-400 uppercase">P</p><p className="text-xs font-black text-emerald-600">{r.present}</p></div>
                                <div className="px-2 py-1 bg-rose-50 rounded-lg"><p className="text-[8px] font-black text-rose-400 uppercase">A</p><p className="text-xs font-black text-rose-600">{r.absent}</p></div>
                                <div className="px-2 py-1 bg-slate-50 rounded-lg"><p className="text-[8px] font-black text-slate-400 uppercase">T</p><p className="text-xs font-black text-slate-600">{r.totalDays}</p></div>
                             </div>
                             <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Audit Ready
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="px-12 py-8 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Master Audit Pool: <span className="text-slate-900 font-black">{monthlyReportData.length} Valid Profiles</span></p>
                 <div className="flex gap-4">
                    <button onClick={() => setShowReportPreview(false)} className="px-8 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-900">Close Preview</button>
                    <button onClick={downloadMonthlyCSV} className="bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3"><FileDown className="w-4 h-4" /> Export Date-Matrix CSV</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/80 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] shadow-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border border-white/20">
              <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-3xl shadow-blue-200">
                       <User className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{selectedStudent.name}</h3>
                       <div className="flex items-center gap-3"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Master Database Profile • {selectedStudent.id}</p></div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedStudent(null)} className="w-16 h-16 bg-white text-slate-300 hover:text-slate-900 rounded-[2rem] flex items-center justify-center border border-slate-100 hover:shadow-2xl transition-all"><X className="w-8 h-8" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-16 space-y-20 no-scrollbar">
                 <div className="flex flex-col lg:flex-row gap-20 items-start">
                    <div className="shrink-0 relative">
                       <img src={selectedStudent.image} className="w-64 h-64 rounded-[4rem] object-cover shadow-2xl border-8 border-white" />
                       <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-3 rounded-[1.5rem] shadow-3xl border border-white/10 z-20"><p className="text-[11px] font-black uppercase tracking-[0.3em]">{selectedStudent.program}</p></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-16 gap-y-12 flex-1">
                       <ProfileBlock label="Legal First Name" value={selectedStudent.firstName} />
                       <ProfileBlock label="Legal Last Name" value={selectedStudent.lastName} />
                       <ProfileBlock label="Joining Date" value={selectedStudent.dateOfJoining} />
                       <ProfileBlock label="Blood Group" value={selectedStudent.bloodGroup || "O+"} />
                       <ProfileBlock label="Enrollment Offer" value={selectedStudent.offer} />
                       <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Performance</p>
                          <p className="text-5xl font-black text-emerald-600 leading-none">{selectedStudent.attendance}%</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="px-12 py-10 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setSelectedStudent(null)} className="bg-slate-900 text-white px-16 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-3xl active:scale-95 transition-all">Close Official Record</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}><Icon className="w-7 h-7" /></div>
     <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 leading-none">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
     </div>
  </div>
);

const ProfileBlock = ({ label, value }: { label: string, value: string | number | undefined }) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-xl font-black text-slate-800 leading-tight truncate">{value || "---"}</p>
  </div>
);
