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
  Activity,
  Lock,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileBarChart,
  CalendarDays,
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

// ─── Jois Brand Palette ───────────────────────────────────────────────────────
// Pink   #FF4B8B  light #FFF0F5  text #CC1A5A  border #FFB3CE
// Yellow #FFB800  light #FFFBEA  text #A07000  border #FFE080
// Green  #4BC83A  light #F0FBF0  text #217A15  border #A8E8A2
// Blue   #3BB5F0  light #EEF8FE  text #1270A0  border #99D8F8
// Orange #FF8C1A  light #FFF4EA  text #A05010  border #FFD0A0
// ─────────────────────────────────────────────────────────────────────────────

interface AttendanceProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

// Per-program Jois colors
const PROGRAM_COLORS: Record<string, { dot: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { dot: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE' },
  'Curiosity Cubs': { dot: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080' },
  'Odyssey Owls':   { dot: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2' },
  'Future Makers':  { dot: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' },
};

// ─── Summary Stat Card ────────────────────────────────────────────────────────

const SummaryStat = ({ icon: Icon, label, value, accentColor, lightColor }: any) => (
  <div
    className="bg-white p-3.5 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 shrink-0 flex-1 min-w-[125px] md:min-w-[150px] relative overflow-hidden"
    style={{ border: `1.5px solid ${accentColor}28`, boxShadow: `0 2px 10px ${accentColor}12` }}
  >
    <span className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: accentColor }} />
    <div
      className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
      style={{ background: lightColor }}
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: accentColor }} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5 leading-none truncate" style={{ color: '#9AA5B4' }}>{label}</p>
      <p className="text-base md:text-xl font-black leading-none truncate" style={{ color: '#1A2340' }}>{value}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Attendance: React.FC<AttendanceProps> = ({ role, showToast }) => {
  const [activeTab, setActiveTab]               = useState<'register' | 'history'>('register');
  const [date, setDate]                         = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents]                 = useState<Student[]>([]);
  const [attendanceState, setAttendanceState]   = useState<Record<string, 'Present' | 'Absent' | 'Late' | undefined>>({});
  const [allLogs, setAllLogs]                   = useState<AttendanceLog[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [searchTerm, setSearchTerm]             = useState('');
  const [activeProgram, setActiveProgram]       = useState<'All' | ProgramType>('All');
  const [showReportModal, setShowReportModal]   = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const isParent  = role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER;
  const isAdmin   = role === UserRole.ADMIN;
  const isFounder = role === UserRole.FOUNDER;
  const canManage = isAdmin || isFounder || isTeacher;

  const loadData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    try {
      const [allStudents, allLogsData, allLeaves, allStaff] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceLogs'),
        db.getAll('leaveRequests'),
        db.getAll('staff'),
      ]);

      if (isTeacher) {
        const currentTeacher = allStaff.find((s: Staff) => s.role === 'Teacher');
        if (currentTeacher?.classAssigned) setActiveProgram(currentTeacher.classAssigned as ProgramType);
      }

      setStudents(allStudents);
      setAllLogs(allLogsData);

      const initial: Record<string, 'Present' | 'Absent' | 'Late' | undefined> = {};
      const existingLogsForDate = allLogsData.filter((l: AttendanceLog) => l.date === selectedDate);

      allStudents.forEach((s: Student) => {
        const log = existingLogsForDate.find((l: AttendanceLog) => l.studentId === s.id);
        if (log) {
          initial[s.id] = log.status as any;
        } else {
          const approvedLeave = allLeaves.find((lv: any) =>
            lv.studentId === s.id &&
            lv.status === 'Approved' &&
            selectedDate >= lv.startDate &&
            selectedDate <= lv.endDate
          );
          if (approvedLeave) initial[s.id] = 'Absent';
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
        const status  = attendanceState[studentId];
        if (status) {
          const student = students.find(s => s.id === studentId);
          if (student && (activeProgram === 'All' || student.program === activeProgram)) {
            recordsToSave[studentId] = status;
          }
        }
      }
      await schoolService.markAttendance(date, recordsToSave);
      showToast?.('Attendance Saved', 'success', `Records for ${date} have been updated.`);
      loadData(date);
    } catch {
      showToast?.('Error Saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() =>
    students.filter(s => {
      const matchesSearch  = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = activeProgram === 'All' || s.program === activeProgram;
      return matchesSearch && matchesProgram;
    }),
  [students, searchTerm, activeProgram]);

  const stats = useMemo(() => {
    const relevantIds = new Set(filteredStudents.map(s => s.id));
    const statuses    = Object.entries(attendanceState)
      .filter(([id]) => relevantIds.has(id))
      .map(([, status]) => status);
    return {
      present: statuses.filter(s => s === 'Present' || s === 'Late').length,
      absent:  statuses.filter(s => s === 'Absent').length,
      late:    statuses.filter(s => s === 'Late').length,
      total:   filteredStudents.length,
    };
  }, [filteredStudents, attendanceState]);

  const historyList = useMemo(() => {
    const dayMap: Record<string, { present: number; absent: number }> = {};
    allLogs.forEach(log => {
      if (!dayMap[log.date]) dayMap[log.date] = { present: 0, absent: 0 };
      if (log.status === 'Present') dayMap[log.date].present++;
      else dayMap[log.date].absent++;
    });
    return Object.entries(dayMap).map(([dateKey, counts]) => ({
      date: dateKey, ...counts,
      label: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [allLogs]);

  // ─── Report Helpers ───────────────────────────────────────────────────────

  const downloadCSV = (rows: string[][], filename: string) => {
    const csvContent  = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri  = encodeURI(csvContent);
    const link        = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDailyClassReport = (customDate?: string, customProgram?: string) => {
    const targetDate    = customDate    || date;
    const targetProgram = customProgram || activeProgram;
    const headers       = ['Student ID', 'Student Name', 'Class', 'Date', 'Status'];
    const dayLogs       = allLogs.filter(l => l.date === targetDate);
    const targetStudents = targetProgram === 'All' ? students : students.filter(s => s.program === targetProgram);
    const rows = targetStudents.map(s => {
      const log = dayLogs.find(l => l.studentId === s.id);
      return [s.id, s.name, s.program, targetDate, log ? log.status : 'No Record'];
    });
    downloadCSV([headers, ...rows], `Attendance_Daily_${targetProgram}_${targetDate}.csv`);
    showToast?.('Report Downloaded', 'success', `Daily report for ${targetProgram} generated.`);
  };

  const downloadMonthlyClassReport = (customMonth?: string, customProgram?: string) => {
    const yearMonth     = customMonth   || date.substring(0, 7);
    const targetProgram = customProgram || activeProgram;
    const headers       = ['Student ID', 'Student Name', 'Class', 'Date', 'Status'];
    const monthlyLogs   = allLogs.filter(l =>
      l.date.startsWith(yearMonth) &&
      (targetProgram === 'All' || students.find(s => s.id === l.studentId)?.program === targetProgram)
    );
    const rows = monthlyLogs.map(l => {
      const s = students.find(st => st.id === l.studentId);
      return [l.studentId, s?.name || 'Unknown', s?.program || 'Unknown', l.date, l.status];
    });
    downloadCSV([headers, ...rows], `Attendance_Monthly_${targetProgram}_${yearMonth}.csv`);
    showToast?.('Report Downloaded', 'success', `Monthly report for ${yearMonth} generated.`);
  };

  const downloadIndividualReport = (student: Student) => {
    const headers  = ['Date', 'Status'];
    const childLogs = allLogs.filter(l => l.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
    const rows     = childLogs.map(l => [l.date, l.status]);
    downloadCSV([headers, ...rows], `Attendance_History_${student.name.replace(/\s+/g, '_')}.csv`);
    showToast?.('Report Downloaded', 'success', `History for ${student.name} generated.`);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
  };

  const handleBulkStatusUpdate = (status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceState(prev => {
      const next = { ...prev };
      selectedStudents.forEach(id => (next[id] = status));
      return next;
    });
    setSelectedStudents(new Set());
  };

  // ─── Status Helpers ───────────────────────────────────────────────────────

  const statusColors = {
    Present: { dot: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2', badge: '#4BC83A' },
    Absent:  { dot: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE', badge: '#FF4B8B' },
    Late:    { dot: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080', badge: '#FFB800' },
  };

  const getStatusStyle = (status: string | undefined) =>
    status === 'Present' ? statusColors.Present
    : status === 'Absent'  ? statusColors.Absent
    : status === 'Late'    ? statusColors.Late
    : { dot: '#CBD5E1', light: '#F8FAFC', text: '#64748B', border: '#E2E8F0', badge: '#94A3B8' };

  // ─── Parent View ──────────────────────────────────────────────────────────

  if (isParent) {
    const myChild   = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const childLogs = allLogs.filter(l => l.studentId === myChild?.id).sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 h-full overflow-y-auto no-scrollbar pb-24" style={{ animation: 'fadeUp .4s ease' }}>

        {/* Student Card */}
        <div
          className="bg-white p-5 md:p-8 rounded-2xl flex items-center gap-4"
          style={{ border: '1.5px solid #F0F4F8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <img src={myChild?.image} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover" style={{ border: '2px solid #F0F4F8' }} alt="Student" />
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight" style={{ color: '#1A2340' }}>{myChild?.name}</h2>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#9AA5B4' }}>
              {myChild?.program} • Academic Year 2025
            </p>
          </div>
          <button
            onClick={() => myChild && downloadIndividualReport(myChild)}
            className="p-3 rounded-xl transition-all active:scale-95"
            style={{ background: '#EEF8FE', color: '#3BB5F0', border: '1.5px solid #99D8F8' }}
            title="Download History"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F0F4F8', background: '#F8FAFC' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
              <ClipboardList className="w-4 h-4" style={{ color: '#3BB5F0' }} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#1A2340' }}>Attendance Ledger</h3>
          </div>

          <div className="divide-y" style={{ borderColor: '#F0F4F8' }}>
            {childLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: '#E2E8F0' }} />
                <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: '#9AA5B4' }}>No logs found</p>
              </div>
            ) : childLogs.slice(0, 20).map(log => {
              const sc = getStatusStyle(log.status);
              return (
                <div key={log.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc.light, border: `1.5px solid ${sc.border}` }}>
                      {log.status === 'Present'
                        ? <CheckCircle2 className="w-5 h-5" style={{ color: sc.dot }} />
                        : <AlertCircle  className="w-5 h-5" style={{ color: sc.dot }} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none" style={{ color: '#1A2340' }}>
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] font-bold uppercase mt-1 tracking-wider" style={{ color: '#9AA5B4' }}>Checked In: 08:30 AM</p>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
                    style={{ background: sc.badge }}
                  >
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Admin / Teacher View ─────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col min-h-full pb-8" style={{ background: '#F8FAFC', animation: 'fadeUp .4s ease' }}>

      {/* ── Tab Header ── */}
      <div className="bg-white px-4 md:px-6 py-4" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">

          {/* Tabs */}
          <div className="flex p-1 rounded-xl w-full md:w-auto" style={{ background: '#F0F4F8' }}>
            <button
              onClick={() => setActiveTab('register')}
              className="flex-1 md:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
              style={activeTab === 'register'
                ? { background: '#fff', color: '#FF4B8B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { background: 'transparent', color: '#9AA5B4' }}
            >
              Mark Register
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="flex-1 md:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
              style={activeTab === 'history'
                ? { background: '#fff', color: '#FF4B8B', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { background: 'transparent', color: '#9AA5B4' }}
            >
              History
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">

            {/* Program filter — desktop */}
            {activeTab === 'register' && (
              <div className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: '#fff', border: '1.5px solid #F0F4F8' }}>
                <button
                  onClick={() => setActiveProgram('All')}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={activeProgram === 'All'
                    ? { background: '#1A2340', color: '#fff' }
                    : { background: 'transparent', color: '#9AA5B4' }}
                >
                  All
                </button>
                {PROGRAMS.map(prog => {
                  const pc = PROGRAM_COLORS[prog];
                  return (
                    <button
                      key={prog}
                      onClick={() => setActiveProgram(prog)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all"
                      style={activeProgram === prog
                        ? { background: pc.dot, color: '#fff' }
                        : { background: 'transparent', color: '#9AA5B4' }}
                    >
                      {prog}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Program filter — mobile */}
            {activeTab === 'register' && (
              <div className="md:hidden flex-1 relative min-w-[120px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9AA5B4' }} />
                <select
                  value={activeProgram}
                  onChange={e => setActiveProgram(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none appearance-none"
                  style={{ background: '#fff', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
                >
                  <option value="All">All Classes</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {/* Reports button */}
            {canManage && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0 text-white"
                style={{ background: '#3BB5F0', boxShadow: '0 2px 8px #3BB5F030' }}
              >
                <FileBarChart className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-6 space-y-5">

        {activeTab === 'register' ? (
          <>
            {/* Stats + Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <div className="flex gap-3 md:gap-4 min-w-max md:min-w-0 md:flex-1">
                  <SummaryStat icon={Users}        label="Enrolled" value={stats.total}   accentColor="#3BB5F0" lightColor="#EEF8FE" />
                  <SummaryStat icon={CheckCircle2} label="Present"  value={stats.present} accentColor="#4BC83A" lightColor="#F0FBF0" />
                  <SummaryStat icon={AlertCircle}  label="Absent"   value={stats.absent}  accentColor="#FF4B8B" lightColor="#FFF0F5" />
                  <SummaryStat icon={Clock}        label="Late"     value={stats.late}    accentColor="#FFB800" lightColor="#FFFBEA" />
                </div>
              </div>
              <div className="relative md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9AA5B4' }} />
                <input
                  type="text"
                  placeholder="Search roster..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
                  style={{ background: '#fff', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Date + Save */}
            <div
              className="bg-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              style={{ border: '1.5px solid #F0F4F8', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center" style={{ background: '#FFF0F5', border: '1.5px solid #FFB3CE' }}>
                  <CalendarIcon className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#FF4B8B' }} />
                </div>
                <div>
                  <h2 className="text-sm md:text-lg font-black leading-none" style={{ color: '#1A2340' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: '#9AA5B4' }}>Today's Roll Call</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSaveRegister}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-white"
                  style={{ background: '#4BC83A', boxShadow: '0 4px 14px #4BC83A30' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden sm:inline">Save Register</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Toolbar */}
            <div
              className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl"
              style={{ border: '1.5px solid #F0F4F8' }}
            >
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{ background: '#F0F4F8', color: '#4A5568' }}
              >
                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <div className="h-6 w-px mx-1" style={{ background: '#E2E8F0' }} />
              <button
                onClick={() => handleBulkStatusUpdate('Present')}
                disabled={selectedStudents.size === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#F0FBF0', color: '#217A15' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Present
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('Absent')}
                disabled={selectedStudents.size === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#FFF0F5', color: '#CC1A5A' }}
              >
                <AlertCircle className="w-3.5 h-3.5" /> Mark Absent
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('Late')}
                disabled={selectedStudents.size === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#FFFBEA', color: '#A07000' }}
              >
                <Clock className="w-3.5 h-3.5" /> Mark Late
              </button>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: '#9AA5B4' }}>
                {selectedStudents.size} Selected
              </span>
            </div>

            {/* Student Grid */}
            <div
              className="bg-white rounded-2xl p-3 md:p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-5"
              style={{ border: '1.5px solid #F0F4F8' }}
            >
              {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4B8B' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Compiling Roster...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: '#E2E8F0' }} />
                  <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: '#9AA5B4' }}>No records match the filter</p>
                </div>
              ) : filteredStudents.map(s => {
                const isSelected = selectedStudents.has(s.id);
                const status     = attendanceState[s.id];
                const sc         = getStatusStyle(status);

                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSelection(s.id)}
                    className="group cursor-pointer flex flex-col items-center p-3 md:p-4 rounded-2xl transition-all duration-200 relative overflow-hidden"
                    style={{
                      border: isSelected ? `2px solid #3BB5F0` : `2px solid ${sc.border}`,
                      background: isSelected ? '#EEF8FE' : sc.light,
                    }}
                  >
                    {/* Selection indicator */}
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={isSelected
                        ? { background: '#3BB5F0', borderColor: '#3BB5F0' }
                        : { background: '#fff', borderColor: '#E2E8F0' }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Status dot */}
                    <div
                      className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full"
                      style={{ background: sc.dot }}
                    />

                    <div className="relative mb-2 md:mb-3 mt-2">
                      <img
                        src={s.image}
                        className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover shadow-sm"
                        style={{ border: `4px solid ${sc.border}` }}
                        alt={s.name}
                      />
                    </div>

                    <h3 className="text-[10px] md:text-sm font-bold text-center leading-tight line-clamp-2 min-h-[2.5em]" style={{ color: '#1A2340' }}>
                      {s.name}
                    </h3>
                    <p className="text-[8px] font-mono uppercase mt-1" style={{ color: '#9AA5B4' }}>{s.id}</p>

                    <div
                      className="mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
                      style={{ background: sc.light, color: sc.text, border: `1px solid ${sc.border}` }}
                    >
                      {status || 'Not Marked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ── History Tab ── */
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>
            <div className="p-6 flex items-center gap-2" style={{ borderBottom: '1px solid #F0F4F8', background: '#F8FAFC' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEA' }}>
                <History className="w-4 h-4" style={{ color: '#FFB800' }} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: '#1A2340' }}>Attendance Archive</h3>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F0F4F8' }}>
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#9AA5B4' }}>Session Date</th>
                    <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-center" style={{ color: '#9AA5B4' }}>Present</th>
                    <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-center" style={{ color: '#9AA5B4' }}>Absent</th>
                    <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-right" style={{ color: '#9AA5B4' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(rec => (
                    <tr key={rec.date} className="group hover:bg-slate-50 transition-all" style={{ borderBottom: '1px solid #F0F4F8' }}>
                      <td className="px-8 py-5">
                        <p className="font-bold text-sm leading-none mb-1" style={{ color: '#1A2340' }}>{rec.label}</p>
                        <p className="text-[9px] font-mono tracking-wider uppercase" style={{ color: '#9AA5B4' }}>{rec.date}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-sm px-3 py-1 rounded-full" style={{ background: '#F0FBF0', color: '#217A15' }}>
                          {rec.present}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-sm px-3 py-1 rounded-full" style={{ background: '#FFF0F5', color: '#CC1A5A' }}>
                          {rec.absent}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => downloadDailyClassReport(rec.date)}
                            className="p-2.5 rounded-xl transition-all"
                            style={{ color: '#9AA5B4', border: '1px solid #F0F4F8' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#3BB5F0'; (e.currentTarget as HTMLElement).style.background = '#EEF8FE'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9AA5B4'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDate(rec.date); setActiveTab('register'); }}
                            className="p-2.5 rounded-xl transition-all"
                            style={{ color: '#9AA5B4', border: '1px solid #F0F4F8' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#3BB5F0'; (e.currentTarget as HTMLElement).style.background = '#EEF8FE'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9AA5B4'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
            <div className="md:hidden" style={{ borderColor: '#F0F4F8' }}>
              {historyList.map(rec => (
                <div
                  key={rec.date}
                  className="p-5 flex items-center justify-between transition-all"
                  style={{ borderBottom: '1px solid #F0F4F8' }}
                  onClick={() => { setDate(rec.date); setActiveTab('register'); }}
                >
                  <div className="flex flex-col">
                    <p className="font-black text-sm leading-none mb-2" style={{ color: '#1A2340' }}>{rec.label}</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#4BC83A' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#217A15' }}>{rec.present} Present</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#FF4B8B' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#CC1A5A' }}>{rec.absent} Absent</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={e => { e.stopPropagation(); downloadDailyClassReport(rec.date); }}
                      className="p-2 rounded-lg"
                      style={{ background: '#EEF8FE', color: '#3BB5F0' }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5" style={{ color: '#CBD5E1' }} />
                  </div>
                </div>
              ))}
            </div>

            {historyList.length === 0 && (
              <div className="py-24 text-center">
                <History className="w-12 h-12 mx-auto mb-4" style={{ color: '#E2E8F0' }} />
                <p className="font-black uppercase tracking-widest text-[10px]" style={{ color: '#9AA5B4' }}>No historical data found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(15,30,60,0.5)', backdropFilter: 'blur(8px)', animation: 'fadeUp .25s ease' }}>
          <div className="bg-white rounded-3xl p-5 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar" style={{ border: '1.5px solid #F0F4F8' }}>

            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6 sticky top-0 bg-white z-10 pb-2">
              <div>
                <h3 className="text-xl md:text-2xl font-black leading-tight" style={{ color: '#1A2340' }}>Generate Reports</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#9AA5B4' }}>Export attendance spreadsheets</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0"
                style={{ background: '#FFF0F5', color: '#FF4B8B', border: '1.5px solid #FFB3CE' }}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-5 pb-4">

              {/* Daily Report */}
              <div className="p-4 md:p-5 rounded-2xl space-y-4" style={{ background: '#EEF8FE', border: '1.5px solid #99D8F8' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm text-white" style={{ background: '#3BB5F0' }}>
                    <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm" style={{ color: '#1A2340' }}>Daily Class Report</h4>
                    <p className="text-[9px] font-bold uppercase" style={{ color: '#9AA5B4' }}>Attendance for a specific day</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>Select Date</label>
                    <input
                      type="date"
                      defaultValue={date}
                      id="report-daily-date"
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-bold outline-none"
                      style={{ background: '#fff', border: '1.5px solid #99D8F8', color: '#1A2340' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>Select Class</label>
                    <select
                      id="report-daily-program"
                      className="w-full px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase outline-none"
                      style={{ background: '#fff', border: '1.5px solid #99D8F8', color: '#1A2340' }}
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
                  className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-white"
                  style={{ background: '#3BB5F0', boxShadow: '0 4px 14px #3BB5F030' }}
                >
                  <Download className="w-4 h-4" /> Download Daily
                </button>
              </div>

              {/* Monthly Report */}
              <div className="p-4 md:p-5 rounded-2xl space-y-4" style={{ background: '#FFFBEA', border: '1.5px solid #FFE080' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm text-white" style={{ background: '#FFB800' }}>
                    <FileBarChart className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm" style={{ color: '#1A2340' }}>Monthly Summary</h4>
                    <p className="text-[9px] font-bold uppercase" style={{ color: '#9AA5B4' }}>Consolidated monthly report</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>Select Month</label>
                    <input
                      type="month"
                      defaultValue={date.substring(0, 7)}
                      id="report-monthly-date"
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-bold outline-none"
                      style={{ background: '#fff', border: '1.5px solid #FFE080', color: '#1A2340' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>Select Class</label>
                    <select
                      id="report-monthly-program"
                      className="w-full px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase outline-none"
                      style={{ background: '#fff', border: '1.5px solid #FFE080', color: '#1A2340' }}
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
                  className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-white"
                  style={{ background: '#FFB800', boxShadow: '0 4px 14px #FFB80030' }}
                >
                  <Download className="w-4 h-4" /> Download Monthly
                </button>
              </div>

              {/* Individual Report */}
              <div className="p-4 md:p-5 rounded-2xl space-y-4" style={{ background: '#F0FBF0', border: '1.5px solid #A8E8A2' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm text-white" style={{ background: '#4BC83A' }}>
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm" style={{ color: '#1A2340' }}>Individual Search</h4>
                    <p className="text-[9px] font-bold uppercase" style={{ color: '#9AA5B4' }}>Export single student history</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9AA5B4' }} />
                    <select
                      id="report-individual-id"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-xs font-bold outline-none appearance-none"
                      style={{ background: '#fff', border: '1.5px solid #A8E8A2', color: '#1A2340' }}
                    >
                      <option value="">Select Student...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const sid     = (document.getElementById('report-individual-id') as HTMLSelectElement).value;
                    const student = students.find(s => s.id === sid);
                    if (student) downloadIndividualReport(student);
                    else showToast?.('Error', 'error', 'Please select a student.');
                  }}
                  className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all text-white"
                  style={{ background: '#4BC83A', boxShadow: '0 4px 14px #4BC83A30' }}
                >
                  <Download className="w-4 h-4" /> Export History
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
