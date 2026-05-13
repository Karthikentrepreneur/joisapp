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
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 shrink-0 flex-1 min-w-[150px]">
     <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${color} bg-opacity-10`}>
       <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-').replace('-600', '-600').replace('-500', '-600')}`} />
     </div>
     <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1 truncate">{label}</p>
        <p className="text-xl font-semibold text-gray-900 leading-none truncate">{value}</p>
     </div>
  </div>
);

export const Attendance: React.FC<AttendanceProps> = ({ role, showToast }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late' | undefined>>({});
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

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
      
      const initial: Record<string, 'Present' | 'Absent' | 'Late' | undefined> = {};
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
          if (approvedLeave) {
            initial[s.id] = 'Absent';
          }
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
      const recordsToSave: Record<string, 'Present' | 'Absent' | 'Late'> = {};

      for (const studentId in attendanceState) {
        const status = attendanceState[studentId];
        if (status) {
          const student = students.find(s => s.id === studentId);
          if (student && (activeProgram === 'All' || student.program === activeProgram)) {
            recordsToSave[studentId] = status;
          }
        }
      }

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
      present: statuses.filter(s => s === 'Present' || s === 'Late').length,
      absent: statuses.filter(s => s === 'Absent').length,
      late: statuses.filter(s => s === 'Late').length,
      total: filteredStudents.length,
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

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
  };

  const handleBulkStatusUpdate = (status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceState(prev => {
      const next = { ...prev };
      selectedStudents.forEach(id => next[id] = status);
      return next;
    });
    setSelectedStudents(new Set());
  };

  if (isParent) {
    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const childLogs = allLogs.filter(l => l.studentId === myChild?.id).sort((a, b) => b.date.localeCompare(a.date));
    
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto bg-gray-50 pb-24">
        <div className="flex items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <img src={myChild?.image} className="w-16 h-16 rounded-full object-cover border border-gray-200" alt="Student" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{myChild?.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{myChild?.program} • Academic Year 2025</p>
          </div>
          <button 
            onClick={() => myChild && downloadIndividualReport(myChild)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md border border-gray-300 transition-colors text-sm font-medium"
            title="Download History"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export History</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" /> Attendance Ledger
              </h3>
           </div>
           <div className="divide-y divide-gray-200">
              {childLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No attendance records found</p>
                </div>
              ) : childLogs.slice(0, 20).map((log) => (
                 <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.status === 'Present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status === 'Present' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-sm font-semibold text-gray-900">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                         <p className="text-xs text-gray-500 mt-0.5">Checked In: 08:30 AM</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${log.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {log.status}
                    </span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-gray-50 min-h-full pb-8">
      {/* Tab Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex bg-gray-100 p-1 rounded-md w-full md:w-auto">
             <button onClick={() => setActiveTab('register')} className={`flex-1 md:px-6 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Daily Register</button>
             <button onClick={() => setActiveTab('history')} className={`flex-1 md:px-6 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>History & Reports</button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {activeTab === 'register' && (
              <div className="hidden md:flex items-center gap-1 bg-white border border-gray-300 p-1 rounded-md">
                <button onClick={() => setActiveProgram('All')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeProgram === 'All' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>All</button>
                {PROGRAMS.map(prog => (
                  <button key={prog} onClick={() => setActiveProgram(prog)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${activeProgram === prog ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{prog}</button>
                ))}
              </div>
            )}
            
            {activeTab === 'register' && (
              <div className="md:hidden flex-1 relative min-w-[120px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select 
                  value={activeProgram}
                  onChange={(e) => setActiveProgram(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 outline-none appearance-none"
                >
                  <option value="All">All Classes</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {canManage && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shrink-0"
                >
                  <FileBarChart className="w-4 h-4 text-gray-500" /> 
                  <span className="hidden sm:inline">Export Reports</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 space-y-6">
        {activeTab === 'register' ? (
          <>
            {/* Stats Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="w-full overflow-x-auto pb-2 md:pb-0">
                <div className="flex gap-4 min-w-max md:min-w-0">
                  <SummaryStat icon={Users} label="Enrolled" value={stats.total} color="bg-blue-600" />
                  <SummaryStat icon={CheckCircle2} label="Present" value={stats.present} color="bg-green-600" />
                  <SummaryStat icon={AlertCircle} label="Absent" value={stats.absent} color="bg-red-500" />
                  <SummaryStat icon={Clock} label="Late" value={stats.late} color="bg-yellow-500" />
                </div>
              </div>
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Date and Bulk Actions Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-md flex items-center justify-center border border-gray-200">
                    <CalendarIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-lg font-semibold text-gray-900 leading-none">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                    <p className="text-sm text-gray-500 mt-1">Today's Attendance</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleSaveRegister} 
                  disabled={saving} 
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                   <span>Save Register</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 md:p-3 rounded-lg border border-gray-200 shadow-sm">
               <button onClick={handleSelectAll} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                 {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All'}
               </button>
               <div className="h-5 w-px bg-gray-300 mx-2"></div>
               <button onClick={() => handleBulkStatusUpdate('Present')} disabled={selectedStudents.size === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-green-200">
                 <CheckCircle2 className="w-4 h-4" /> Mark Present
               </button>
               <button onClick={() => handleBulkStatusUpdate('Absent')} disabled={selectedStudents.size === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-red-200">
                 <AlertCircle className="w-4 h-4" /> Mark Absent
               </button>
               <button onClick={() => handleBulkStatusUpdate('Late')} disabled={selectedStudents.size === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-yellow-200">
                 <Clock className="w-4 h-4" /> Mark Late
               </button>
               <span className="ml-auto text-sm text-gray-500 px-2 font-medium">
                 {selectedStudents.size} Selected
               </span>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm font-medium">Loading Roster...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="col-span-full py-16 text-center border border-dashed border-gray-300 rounded-lg bg-white">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No records match the current filters.</p>
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudents.has(s.id);
                  const status = attendanceState[s.id];
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => toggleSelection(s.id)}
                      className={`group cursor-pointer flex flex-col bg-white p-4 rounded-lg border transition-all relative ${
                        isSelected 
                          ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center transition-colors border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex flex-col items-center mt-2">
                        <img 
                          src={s.image} 
                          className="w-16 h-16 rounded-full object-cover border border-gray-200 mb-3" 
                          alt={s.name} 
                        />
                        <h3 className="text-sm font-semibold text-gray-900 text-center leading-tight truncate w-full">{s.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{s.id}</p>
                        
                        {/* Status Text */}
                        <div className={`mt-3 w-full text-center px-2 py-1 rounded text-xs font-medium border ${
                          status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : 
                          status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : 
                          status === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {status || 'Not Marked'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Attendance Archive</h3>
             </div>
             
             {/* Desktop Table */}
             <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-white text-xs font-medium text-gray-500 border-b border-gray-200">
                     <tr>
                       <th className="px-6 py-3 font-medium">Session Date</th>
                       <th className="px-6 py-3 font-medium text-center">Present</th>
                       <th className="px-6 py-3 font-medium text-center">Absent</th>
                       <th className="px-6 py-3 font-medium text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {historyList.map((rec) => (
                        <tr key={rec.date} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-6 py-4">
                             <p className="font-medium text-gray-900 text-sm">{rec.label}</p>
                             <p className="text-xs text-gray-500 mt-0.5">{rec.date}</p>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {rec.present}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {rec.absent}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => downloadDailyClassReport(rec.date)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Download Report"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setDate(rec.date); setActiveTab('register'); }} 
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="View Details"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Mobile Card List */}
             <div className="md:hidden divide-y divide-gray-100">
                {historyList.map((rec) => (
                  <div key={rec.date} className="p-4 flex items-center justify-between hover:bg-gray-50" onClick={() => { setDate(rec.date); setActiveTab('register'); }}>
                    <div className="flex flex-col">
                      <p className="font-medium text-gray-900 text-sm mb-1">{rec.label}</p>
                      <div className="flex gap-3">
                         <span className="text-xs font-medium text-green-600">{rec.present} Present</span>
                         <span className="text-xs font-medium text-red-600">{rec.absent} Absent</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); downloadDailyClassReport(rec.date); }}
                         className="p-2 text-gray-400 rounded-md border border-gray-200 hover:bg-gray-50"
                       >
                         <Download className="w-4 h-4" />
                       </button>
                       <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
             </div>

             {historyList.length === 0 && (
                <div className="py-20 text-center">
                  <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No historical data available.</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* FULLY RESPONSIVE REPORT GENERATION MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl p-6 md:p-8 max-w-lg w-full shadow-xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6 sticky top-0 bg-white z-10 pb-2">
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900">Export Reports</h3>
                    <p className="text-sm text-gray-500 mt-1">Download attendance records as CSV</p>
                 </div>
                 <button onClick={() => setShowReportModal(false)} className="w-8 h-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors shrink-0">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="space-y-6 pb-2">
                 {/* DAILY REPORT GENERATOR */}
                 <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-md flex items-center justify-center shadow-sm">
                          <CalendarIcon className="w-4 h-4" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Daily Class Report</h4>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Select Date</label>
                          <input 
                            type="date" 
                            defaultValue={date}
                            id="report-daily-date"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Select Class</label>
                          <select 
                            id="report-daily-program"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          >
                            <option value="All">All Classes</option>
                            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const d = (document.getElementById('report-daily-date') as HTMLInputElement).value;
                        const p = (document.getElementById('report-daily-program') as HTMLSelectElement).value;
                        downloadDailyClassReport(d, p);
                      }}
                      className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                       <Download className="w-4 h-4" /> Export Daily CSV
                    </button>
                 </div>

                 {/* MONTHLY REPORT GENERATOR */}
                 <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-md flex items-center justify-center shadow-sm">
                          <FileBarChart className="w-4 h-4" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Monthly Summary</h4>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Select Month</label>
                          <input 
                            type="month" 
                            defaultValue={date.substring(0, 7)}
                            id="report-monthly-date"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Select Class</label>
                          <select 
                            id="report-monthly-program"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          >
                            <option value="All">All Classes</option>
                            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const m = (document.getElementById('report-monthly-date') as HTMLInputElement).value;
                        const p = (document.getElementById('report-monthly-program') as HTMLSelectElement).value;
                        downloadMonthlyClassReport(m, p);
                      }}
                      className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                       <Download className="w-4 h-4" /> Export Monthly CSV
                    </button>
                 </div>

                 {/* INDIVIDUAL SEARCH REPORT */}
                 <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-md flex items-center justify-center shadow-sm">
                          <User className="w-4 h-4" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-gray-900 text-sm">Individual Record</h4>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-medium text-gray-700">Search Student</label>
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <select 
                            id="report-individual-id"
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          >
                            <option value="">Select Student...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                          </select>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const sid = (document.getElementById('report-individual-id') as HTMLSelectElement).value;
                        const student = students.find(s => s.id === sid);
                        if (student) downloadIndividualReport(student);
                        else showToast?.("Error", "error", "Please select a student.");
                      }}
                      className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                       <Download className="w-4 h-4" /> Export Student CSV
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
