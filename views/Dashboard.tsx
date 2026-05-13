import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, View, Student, Staff, ProgramType, LeaveRequest, Homework } from '../types';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import {
  Users,
  Loader2,
  CalendarCheck,
  ArrowUpRight,
  CalendarDays,
  BookOpen,
  Clock,
  Briefcase,
  GraduationCap,
  CreditCard,
  RefreshCw,
  School,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ─── Jois Brand Palette ───────────────────────────────────────────────────────
// Pink   #FF4B8B  light #FFF0F5  text #CC1A5A  border #FFB3CE
// Yellow #FFB800  light #FFFBEA  text #A07000  border #FFE080
// Green  #4BC83A  light #F0FBF0  text #217A15  border #A8E8A2
// Blue   #3BB5F0  light #EEF8FE  text #1270A0  border #99D8F8
// Orange #FF8C1A  light #FFF4EA  text #A05010  border #FFD0A0
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardProps {
  role: UserRole;
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
  currentUser?: any;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

const PROGRAM_META: Record<string, { bar: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { bar: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE' },
  'Curiosity Cubs': { bar: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080' },
  'Odyssey Owls':   { bar: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2' },
  'Future Makers':  { bar: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' },
};

// ─── Shared Primitives ────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="animate-spin w-8 h-8" style={{ color: '#FF4B8B' }} />
  </div>
);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  accentColor: string;
  lightColor: string;
  onClick?: () => void;
}

const StatCard = ({ icon: Icon, label, value, subValue, accentColor, lightColor, onClick }: StatCardProps) => (
  <button
    onClick={onClick}
    className="relative bg-white rounded-2xl p-5 text-left w-full group overflow-hidden
               hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 focus:outline-none"
    style={{ border: `1.5px solid ${accentColor}28`, boxShadow: `0 2px 14px ${accentColor}14` }}
  >
    <span
      className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
      style={{ background: accentColor }}
    />
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
      style={{ background: lightColor }}
    >
      <Icon className="w-5 h-5" style={{ color: accentColor }} />
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 leading-none" style={{ color: '#9AA5B4' }}>
      {label}
    </p>
    <h3 className="text-[26px] font-bold leading-none tracking-tight truncate" style={{ color: '#1A2340' }}>
      {value}
    </h3>
    {subValue && (
      <p className="text-[11px] font-medium mt-2 truncate" style={{ color: '#9AA5B4' }}>{subValue}</p>
    )}
  </button>
);

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = ({
  onNavigate,
  onFilterNavigate,
}: {
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [leaves, setLeaves]     = useState<LeaveRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st, lv] = await Promise.all([
        db.getAll('students'),
        db.getAll('staff'),
        db.getAll('leaveRequests'),
      ]);
      setStudents(s || []);
      setStaff(st || []);
      setLeaves(lv || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const recentLeaves  = leaves.slice(0, 4);

  const leaveStatusStyle = (status: string) => {
    if (status === 'Pending')  return { bg: '#FFFBEA', color: '#A07000' };
    if (status === 'Approved') return { bg: '#F0FBF0', color: '#217A15' };
    return { bg: '#F5F5F5', color: '#6B7280' };
  };

  const avatarColors = ['#FF4B8B', '#FFB800', '#4BC83A', '#3BB5F0'];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-7" style={{ animation: 'fadeUp .4s ease' }}>

      {/* Header Banner — white */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
        style={{ background: '#FFFFFF', border: '1.5px solid #F0F4F8', boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FFF0F5' }}>
            <School className="w-6 h-6" style={{ color: '#FF4B8B' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#1A2340' }}>School Overview</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#9AA5B4' }}>Monitoring academic & administrative activity</p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                     transition-all active:scale-95 hover:opacity-80"
          style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#FF4B8B' }} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={students.length}
          subValue="Across all programs"
          accentColor="#3BB5F0"
          lightColor="#EEF8FE"
          onClick={() => onNavigate(View.STUDENTS)}
        />
        <StatCard
          icon={Briefcase}
          label="Active Staff"
          value={staff.length}
          subValue="Teachers & support"
          accentColor="#4BC83A"
          lightColor="#F0FBF0"
          onClick={() => onNavigate(View.STAFF)}
        />
        <StatCard
          icon={CalendarDays}
          label="Pending Leaves"
          value={pendingLeaves.length}
          subValue="Requires your review"
          accentColor="#FFB800"
          lightColor="#FFFBEA"
          onClick={() => onNavigate(View.LEAVE)}
        />
      </div>

      {/* Enrollment + Leave side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Enrollment by Program */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6" style={{ border: '1.5px solid #F0F4F8' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                <GraduationCap className="w-4 h-4" style={{ color: '#3BB5F0' }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: '#1A2340' }}>Enrollment by Program</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Capacity: 40</span>
          </div>

          <div className="space-y-5">
            {PROGRAMS.map(p => {
              const count    = students.filter(s => s.program === p).length;
              const capacity = 40;
              const pct      = Math.min(100, Math.round((count / capacity) * 100));
              const meta     = PROGRAM_META[p] ?? PROGRAM_META['Little Seeds'];
              return (
                <button key={p} onClick={() => onFilterNavigate?.(p)} className="w-full text-left group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold group-hover:opacity-75 transition-opacity" style={{ color: '#1A2340' }}>{p}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: meta.light, color: meta.text, border: `1px solid ${meta.border}` }}
                      >
                        {count}/{capacity}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" style={{ color: meta.bar }} />
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0F4F8' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(4, pct)}%`, background: meta.bar }}
                    />
                  </div>
                  <p className="text-[10px] font-medium mt-1" style={{ color: '#9AA5B4' }}>{pct}% occupied</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col" style={{ border: '1.5px solid #F0F4F8' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEA' }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#FFB800' }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: '#1A2340' }}>Leave Requests</h2>
            </div>
            <button onClick={() => onNavigate(View.LEAVE)} className="text-[11px] font-bold hover:underline" style={{ color: '#3BB5F0' }}>
              View all →
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {recentLeaves.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: '#9AA5B4' }}>No leave requests.</p>
            )}
            {recentLeaves.map((l: any, i: number) => {
              const c  = avatarColors[i % avatarColors.length];
              const ss = leaveStatusStyle(l.status);
              return (
                <div
                  key={l.id ?? i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#F8FAFC' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
                    style={{ background: c }}
                  >
                    {(l.name ?? l.staffName ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#1A2340' }}>{l.name ?? l.staffName ?? 'Staff'}</p>
                    <p className="text-[10px] font-medium truncate" style={{ color: '#9AA5B4' }}>{l.reason ?? l.type ?? 'Leave'}</p>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: ss.bg, color: ss.color }}
                  >
                    {l.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Teacher Dashboard ────────────────────────────────────────────────────────

const TeacherDashboard = ({
  onNavigate,
  currentUser,
}: {
  onNavigate: (view: View) => void;
  currentUser?: any;
}) => {
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [presenceToday, setPresenceToday]       = useState(0);
  const [lateToday, setLateToday]               = useState(0);
  const [weeklyAtt, setWeeklyAtt]               = useState<number[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [program, setProgram]                   = useState<ProgramType | 'N/A'>('N/A');

  const loadData = useCallback(async () => {
    try {
      const [allStudents, allLogs] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceLogs'),
      ]);
      const ap = currentUser?.classAssigned as ProgramType || 'N/A';
      setProgram(ap);
      const myStudents = allStudents.filter((s: Student) => s.program === ap);
      setAssignedStudents(myStudents);

      const today = new Date().toISOString().split('T')[0];
      const ids   = new Set(myStudents.map((s: Student) => s.id));
      setPresenceToday(allLogs.filter((l: any) => l.date === today && ids.has(l.studentId) && l.status === 'Present').length);
      setLateToday(allLogs.filter((l: any) => l.date === today && ids.has(l.studentId) && l.status === 'Late').length);

      const days: number[] = [];
      for (let d = 4; d >= 0; d--) {
        const dt = new Date(); dt.setDate(dt.getDate() - d);
        const ds = dt.toISOString().split('T')[0];
        const p  = allLogs.filter((l: any) => l.date === ds && ids.has(l.studentId) && (l.status === 'Present' || l.status === 'Late')).length;
        days.push(myStudents.length > 0 ? Math.round((p / myStudents.length) * 100) : 0);
      }
      setWeeklyAtt(days);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;

  const total    = assignedStudents.length;
  const present  = presenceToday + lateToday;
  const todayPct = total > 0 ? Math.round((present / total) * 100) : 0;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const barColors = ['#FF4B8B', '#FFB800', '#4BC83A', '#3BB5F0', '#FF8C1A'];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-7" style={{ animation: 'fadeUp .4s ease' }}>

      {/* Hero — white */}
      <div
        className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
        style={{ background: '#FFFFFF', border: '1.5px solid #F0F4F8', boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#F0FBF0' }}>
            <GraduationCap className="w-6 h-6" style={{ color: '#4BC83A' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#9AA5B4' }}>Teacher Portal</p>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#1A2340' }}>
              {currentUser?.name ?? 'Teacher'}'s Classroom
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#9AA5B4' }}>
              Assigned: <span className="font-bold" style={{ color: '#4BC83A' }}>{program}</span>
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-3"
          style={{ background: '#F0FBF0', border: '1.5px solid #A8E8A2' }}
        >
          <Clock className="w-5 h-5" style={{ color: '#4BC83A' }} />
          <div>
            <p className="text-sm font-bold leading-none mb-0.5" style={{ color: '#217A15' }}>Session Active</p>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#4BC83A' }}>Attendance window open</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Class Roster"
          value={total}
          subValue={program !== 'N/A' ? program : 'No class assigned'}
          accentColor="#3BB5F0"
          lightColor="#EEF8FE"
          onClick={() => onNavigate(View.STUDENTS)}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Today"
          value={`${present} / ${total}`}
          subValue={`${lateToday} late · ${total - present} absent`}
          accentColor="#4BC83A"
          lightColor="#F0FBF0"
          onClick={() => onNavigate(View.ATTENDANCE)}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Rate"
          value={`${todayPct}%`}
          subValue={todayPct >= 80 ? 'Good attendance' : 'Below average'}
          accentColor={todayPct >= 80 ? '#4BC83A' : '#FFB800'}
          lightColor={todayPct >= 80 ? '#F0FBF0' : '#FFFBEA'}
        />
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #F0F4F8' }}>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F0FBF0' }}>
            <CalendarCheck className="w-4 h-4" style={{ color: '#4BC83A' }} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: '#1A2340' }}>Weekly Attendance — {program}</h2>
        </div>
        <div className="flex items-end gap-3" style={{ height: '120px' }}>
          {dayLabels.map((day, i) => {
            const pct = weeklyAtt[i] ?? 0;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: '#6B7280' }}>{pct}%</span>
                <div className="w-full rounded-t-xl relative overflow-hidden" style={{ height: '80px', background: '#F0F4F8' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700"
                    style={{ height: `${Math.max(6, pct)}%`, background: barColors[i % barColors.length] }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9AA5B4' }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Parent Dashboard ─────────────────────────────────────────────────────────

const ParentDashboard = ({
  onNavigate,
  currentUser,
}: {
  onNavigate: (view: View) => void;
  currentUser?: any;
}) => {
  const [child, setChild]             = useState<Student | null>(null);
  const [homework, setHomework]       = useState<Homework[]>([]);
  const [pendingFees, setPendingFees] = useState(0);
  const [loading, setLoading]         = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const myChild = currentUser;
      setChild(myChild || null);
      if (myChild) {
        const [invoices, homeworkData] = await Promise.all([
          db.getAll('invoices'),
          schoolService.getHomework(UserRole.PARENT, [myChild.program], [myChild.id]),
        ]);
        const dues = invoices
          .filter((i: any) => i.studentId === myChild.id && i.status !== 'Paid')
          .reduce((sum: number, i: any) => sum + i.amount, 0);
        setPendingFees(dues);
        setHomework(homeworkData.sort((a: Homework, b: Homework) =>
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        ));
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;
  if (!child) return (
    <div
      className="m-6 p-12 text-center text-xs font-bold uppercase tracking-widest rounded-2xl"
      style={{ background: '#FFF0F5', color: '#FF4B8B', border: '1.5px solid #FFB3CE' }}
    >
      No linked student found.
    </div>
  );

  const pendingHW = homework.filter(h => h.status !== 'Closed');
  const attNum    = parseFloat(String(child.attendance)) || 0;
  const attGood   = attNum >= 85;
  const hwColors  = ['#FF4B8B', '#3BB5F0', '#FFB800', '#4BC83A', '#FF8C1A'];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6" style={{ animation: 'fadeUp .4s ease' }}>

      {/* Student Hero — white */}
      <div
        className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: '#FFFFFF', border: '1.5px solid #F0F4F8', boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0">
            {child.image ? (
              <img
                src={child.image}
                alt={child.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-xl"
                style={{ border: '3px solid #F0F4F8' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold select-none"
                style={{ background: '#FFF0F5', border: '3px solid #FFB3CE', color: '#FF4B8B' }}
              >
                {child.name?.[0] ?? '?'}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9AA5B4' }}>Student Account</p>
            <h1 className="text-2xl font-bold tracking-tight mb-3" style={{ color: '#1A2340' }}>{child.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                style={{ background: '#FFF0F5', color: '#CC1A5A', border: '1px solid #FFB3CE' }}
              >
                {child.program}
              </span>
              <span
                className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                style={{ background: '#EEF8FE', color: '#1270A0', border: '1px solid #99D8F8' }}
              >
                ID: {child.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Attendance Rate"
          value={`${child.attendance}%`}
          subValue={attGood ? 'Above class average' : 'Below class average'}
          accentColor={attGood ? '#4BC83A' : '#FFB800'}
          lightColor={attGood ? '#F0FBF0' : '#FFFBEA'}
          onClick={() => onNavigate(View.ATTENDANCE)}
        />
        <StatCard
          icon={CreditCard}
          label="Pending Fees"
          value={`₹${pendingFees.toLocaleString('en-IN')}`}
          subValue={pendingFees > 0 ? 'Outstanding balance' : 'Account up-to-date'}
          accentColor={pendingFees > 0 ? '#FF4B8B' : '#4BC83A'}
          lightColor={pendingFees > 0 ? '#FFF0F5' : '#F0FBF0'}
          onClick={() => onNavigate(View.FEES)}
        />
        <StatCard
          icon={BookOpen}
          label="Pending Homework"
          value={pendingHW.length}
          subValue={pendingHW.length > 0 ? `Next: ${pendingHW[0]?.title}` : 'All caught up!'}
          accentColor="#3BB5F0"
          lightColor="#EEF8FE"
          onClick={() => onNavigate(View.ACADEMICS)}
        />
      </div>

      {/* Attendance + Homework */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Attendance Breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6" style={{ border: '1.5px solid #F0F4F8' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F0FBF0' }}>
              <CalendarCheck className="w-4 h-4" style={{ color: '#4BC83A' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: '#1A2340' }}>Attendance Breakdown</h2>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
              style={{
                border: `4px solid ${attGood ? '#4BC83A' : '#FFB800'}`,
                background: attGood ? '#F0FBF0' : '#FFFBEA',
              }}
            >
              <span className="text-2xl font-bold" style={{ color: attGood ? '#217A15' : '#A07000' }}>
                {child.attendance}%
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Overall Rate</p>
          </div>
          {[
            { label: 'Present', pct: attNum,                          color: '#4BC83A' },
            { label: 'Late',    pct: Math.min(8, (100 - attNum) / 2), color: '#FFB800' },
            { label: 'Absent',  pct: Math.max(0, 100 - attNum - 4),   color: '#FF4B8B' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11px] font-medium w-12" style={{ color: '#6B7280' }}>{row.label}</span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F0F4F8' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
                />
              </div>
              <span className="text-[11px] font-bold w-8 text-right" style={{ color: '#1A2340' }}>
                {Math.round(row.pct)}%
              </span>
            </div>
          ))}
        </div>

        {/* Upcoming Homework */}
        <div className="md:col-span-3 bg-white rounded-2xl p-6 flex flex-col" style={{ border: '1.5px solid #F0F4F8' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                <BookOpen className="w-4 h-4" style={{ color: '#3BB5F0' }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: '#1A2340' }}>Upcoming Assignments</h2>
            </div>
            <button onClick={() => onNavigate(View.ACADEMICS)} className="text-[11px] font-bold hover:underline" style={{ color: '#3BB5F0' }}>
              View all →
            </button>
          </div>

          {pendingHW.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="w-10 h-10" style={{ color: '#4BC83A' }} />
              <p className="text-sm font-medium" style={{ color: '#9AA5B4' }}>No pending homework!</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              {pendingHW.slice(0, 4).map((hw, i) => (
                <div
                  key={hw.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl group transition-colors"
                  style={{ background: '#F8FAFC' }}
                >
                  <div
                    className="w-1.5 h-10 rounded-full flex-shrink-0"
                    style={{ background: hwColors[i % hwColors.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#1A2340' }}>{hw.title}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#9AA5B4' }}>
                      {hw.subject} · Due{' '}
                      <span className="font-bold" style={{ color: '#6B7280' }}>
                        {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate(View.ACADEMICS)}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0
                               opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: '#EEF8FE', color: '#3BB5F0' }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingHW.length > 0 && (
            <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid #F0F4F8' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FFB800' }} />
              <p className="text-[11px] font-medium" style={{ color: '#9AA5B4' }}>
                {pendingHW.length} assignment{pendingHW.length > 1 ? 's' : ''} pending · Stay on top of deadlines
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate, onFilterNavigate, currentUser }) => {
  const renderContent = () => {
    switch (role) {
      case UserRole.PARENT:  return <ParentDashboard  onNavigate={onNavigate} currentUser={currentUser} />;
      case UserRole.TEACHER: return <TeacherDashboard onNavigate={onNavigate} currentUser={currentUser} />;
      default:               return <AdminDashboard   onNavigate={onNavigate} onFilterNavigate={onFilterNavigate} />;
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ background: '#F8FAFC' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {renderContent()}
    </div>
  );
};
