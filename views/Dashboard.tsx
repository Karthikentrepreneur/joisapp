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

interface DashboardProps {
  role: UserRole;
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
  currentUser?: any;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

const PROGRAM_COLORS: Record<string, { bar: string; accent: string; light: string; text: string }> = {
  'Little Seeds':    { bar: 'bg-blue-600',   accent: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700' },
  'Curiosity Cubs':  { bar: 'bg-slate-800',  accent: 'bg-slate-800',  light: 'bg-slate-100', text: 'text-slate-700' },
  'Odyssey Owls':    { bar: 'bg-amber-500',  accent: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700' },
  'Future Makers':   { bar: 'bg-emerald-600',accent: 'bg-emerald-600',light: 'bg-emerald-50',text: 'text-emerald-700' },
};

/* ─── Shared primitives ─────────────────────────────────── */

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 font-sans">{children}</div>
);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  accentClass: string;       // Tailwind bg color for the top accent bar
  iconBg: string;            // icon wrapper bg
  iconColor: string;         // icon color
  onClick?: () => void;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  accentClass,
  iconBg,
  iconColor,
  onClick,
}: StatCardProps) => (
  <button
    onClick={onClick}
    className="relative bg-white border border-slate-200 rounded-2xl p-5 text-left w-full group overflow-hidden
               hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus:outline-none"
  >
    {/* top accent bar */}
    <span className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl ${accentClass}`} />

    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
      <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
    </div>

    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 leading-none">{label}</p>
    <h3 className="text-[26px] font-semibold text-slate-900 leading-none tracking-tight truncate">{value}</h3>
    {subValue && (
      <p className="text-[11px] font-medium text-slate-400 mt-2 truncate">{subValue}</p>
    )}
  </button>
);

/* ─── Loading ───────────────────────────────────────────── */

const LoadingState = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="animate-spin w-8 h-8 text-slate-300" />
  </div>
);

/* ─── Admin Dashboard ───────────────────────────────────── */

const AdminDashboard = ({
  onNavigate,
  onFilterNavigate,
}: {
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
  const recentLeaves = leaves.slice(0, 4);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-7 animate-[fadeUp_0.4s_ease]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <School className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">School Overview</h1>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-10">Monitoring academic and administrative activity</p>
        </div>
        <button
          onClick={() => { loadData(); }}
          className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl border border-slate-200
                     hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
          accentClass="bg-blue-600"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => onNavigate(View.STUDENTS)}
        />
        <StatCard
          icon={Briefcase}
          label="Active Staff"
          value={staff.length}
          subValue="Teachers & support"
          accentClass="bg-slate-800"
          iconBg="bg-slate-100"
          iconColor="text-slate-700"
          onClick={() => onNavigate(View.STAFF)}
        />
        <StatCard
          icon={CalendarDays}
          label="Pending Leaves"
          value={pendingLeaves.length}
          subValue="Requires your review"
          accentClass="bg-amber-500"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate(View.LEAVE)}
        />
      </div>

      {/* Enrollment + Leave Requests side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Enrollment by Program */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-800">Enrollment by Program</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity: 40</span>
          </div>

          <div className="space-y-5">
            {PROGRAMS.map(p => {
              const count = students.filter(s => s.program === p).length;
              const capacity = 40;
              const pct = Math.min(100, Math.round((count / capacity) * 100));
              const colors = PROGRAM_COLORS[p] ?? PROGRAM_COLORS['Little Seeds'];

              return (
                <button
                  key={p}
                  onClick={() => onFilterNavigate?.(p)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{p}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.light} ${colors.text}`}>
                        {count}/{capacity}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{pct}% occupied</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800">Leave Requests</h2>
            </div>
            <button
              onClick={() => onNavigate(View.LEAVE)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {recentLeaves.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No leave requests.</p>
            )}
            {recentLeaves.map((l: any, i: number) => (
              <div key={l.id ?? i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 flex-shrink-0">
                  {(l.name ?? l.staffName ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{l.name ?? l.staffName ?? 'Staff'}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{l.reason ?? l.type ?? 'Leave'}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg flex-shrink-0
                  ${l.status === 'Pending' ? 'bg-amber-50 text-amber-600' : l.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Teacher Dashboard ─────────────────────────────────── */

const TeacherDashboard = ({
  onNavigate,
  currentUser,
}: {
  onNavigate: (view: View) => void;
  currentUser?: any;
}) => {
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [presenceToday, setPresenceToday] = useState(0);
  const [lateToday, setLateToday] = useState(0);
  const [weeklyAtt, setWeeklyAtt] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ProgramType | 'N/A'>('N/A');

  const loadData = useCallback(async () => {
    try {
      const [allStudents, allLogs] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceLogs'),
      ]);
      const assignedProgram = currentUser?.classAssigned as ProgramType || 'N/A';
      setProgram(assignedProgram);

      const myStudents = allStudents.filter((s: Student) => s.program === assignedProgram);
      setAssignedStudents(myStudents);

      const today = new Date().toISOString().split('T')[0];
      const ids = new Set(myStudents.map((s: Student) => s.id));

      const presentCount = allLogs.filter((l: any) =>
        l.date === today && ids.has(l.studentId) && l.status === 'Present'
      ).length;
      const lateCount = allLogs.filter((l: any) =>
        l.date === today && ids.has(l.studentId) && l.status === 'Late'
      ).length;

      setPresenceToday(presentCount);
      setLateToday(lateCount);

      // Build last 5 day attendance percentages
      const days: number[] = [];
      for (let d = 4; d >= 0; d--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - d);
        const dateStr = dt.toISOString().split('T')[0];
        const p = allLogs.filter((l: any) =>
          l.date === dateStr && ids.has(l.studentId) && (l.status === 'Present' || l.status === 'Late')
        ).length;
        days.push(myStudents.length > 0 ? Math.round((p / myStudents.length) * 100) : 0);
      }
      setWeeklyAtt(days);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const todayPct = assignedStudents.length > 0
    ? Math.round(((presenceToday + lateToday) / assignedStudents.length) * 100)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-7 animate-[fadeUp_0.4s_ease]">

      {/* Hero Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #c9952a 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Teacher Portal</p>
          <h1 className="text-xl font-semibold text-white tracking-tight mb-1">
            {currentUser?.name ?? 'Teacher'}'s Classroom
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Assigned class: <span className="text-amber-400 font-semibold">{program}</span>
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-white/10 border border-white/10 rounded-xl px-5 py-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-white leading-none mb-0.5">Session Active</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Attendance window open</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Class Roster"
          value={assignedStudents.length}
          subValue={program !== 'N/A' ? program : 'No class assigned'}
          accentClass="bg-slate-800"
          iconBg="bg-slate-100"
          iconColor="text-slate-700"
          onClick={() => onNavigate(View.STUDENTS)}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Today"
          value={`${presenceToday + lateToday} / ${assignedStudents.length}`}
          subValue={`${lateToday} late · ${assignedStudents.length - presenceToday - lateToday} absent`}
          accentClass="bg-emerald-600"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => onNavigate(View.ATTENDANCE)}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Rate"
          value={`${todayPct}%`}
          subValue={todayPct >= 80 ? 'Good attendance' : 'Below average'}
          accentClass={todayPct >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}
          iconBg={todayPct >= 80 ? 'bg-emerald-50' : 'bg-amber-50'}
          iconColor={todayPct >= 80 ? 'text-emerald-600' : 'text-amber-600'}
        />
      </div>

      {/* Weekly Attendance Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-slate-800">Weekly Attendance — {program}</h2>
        </div>
        <div className="flex items-end gap-3 h-28">
          {dayLabels.map((day, i) => {
            const pct = weeklyAtt[i] ?? 0;
            const isGood = pct >= 80;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
                <div className="w-full rounded-t-lg relative overflow-hidden bg-slate-100" style={{ height: '72px' }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 ${isGood ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ height: `${Math.max(6, pct)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Parent Dashboard ──────────────────────────────────── */

const ParentDashboard = ({
  onNavigate,
  currentUser,
}: {
  onNavigate: (view: View) => void;
  currentUser?: any;
}) => {
  const [child, setChild] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [pendingFees, setPendingFees] = useState(0);
  const [loading, setLoading] = useState(true);

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
    <div className="m-6 p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-2xl border border-slate-200">
      No linked student found.
    </div>
  );

  const pendingHW = homework.filter(h => h.status !== 'Closed');
  const attNum = parseFloat(String(child.attendance)) || 0;
  const attGood = attNum >= 85;

  const hwColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease]">

      {/* Student Hero Card */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, #c9952a 0%, transparent 60%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0">
            {child.image ? (
              <img
                src={child.image}
                alt={child.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/10 flex items-center justify-center text-3xl font-semibold text-amber-400 select-none">
                {child.name?.[0] ?? '?'}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Student Account</p>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-3">{child.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-white/10 px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                {child.program}
              </span>
              <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider">
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
          accentClass={attGood ? 'bg-emerald-600' : 'bg-amber-500'}
          iconBg={attGood ? 'bg-emerald-50' : 'bg-amber-50'}
          iconColor={attGood ? 'text-emerald-600' : 'text-amber-600'}
          onClick={() => onNavigate(View.ATTENDANCE)}
        />
        <StatCard
          icon={CreditCard}
          label="Pending Fees"
          value={`₹${pendingFees.toLocaleString('en-IN')}`}
          subValue={pendingFees > 0 ? 'Outstanding balance' : 'Account up-to-date'}
          accentClass={pendingFees > 0 ? 'bg-rose-500' : 'bg-emerald-600'}
          iconBg={pendingFees > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
          iconColor={pendingFees > 0 ? 'text-rose-600' : 'text-emerald-600'}
          onClick={() => onNavigate(View.FEES)}
        />
        <StatCard
          icon={BookOpen}
          label="Pending Homework"
          value={pendingHW.length}
          subValue={pendingHW.length > 0 ? `Next: ${pendingHW[0]?.title}` : 'All caught up!'}
          accentClass="bg-purple-600"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => onNavigate(View.ACADEMICS)}
        />
      </div>

      {/* Attendance Visual + Upcoming Homework */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Attendance Breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-800">Attendance Breakdown</h2>
          </div>

          {/* Big ring-style display */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 mb-2
              ${attGood ? 'border-emerald-500' : 'border-amber-400'}`}>
              <span className={`text-2xl font-semibold ${attGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                {child.attendance}%
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Overall Rate</p>
          </div>

          {/* Breakdown bars */}
          {[
            { label: 'Present', pct: attNum, color: 'bg-emerald-500' },
            { label: 'Late',    pct: Math.min(10, 100 - attNum) / 2, color: 'bg-amber-400' },
            { label: 'Absent',  pct: Math.max(0, 100 - attNum - 2), color: 'bg-rose-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11px] font-medium text-slate-500 w-12">{row.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.max(2, row.pct)}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">{Math.round(row.pct)}%</span>
            </div>
          ))}
        </div>

        {/* Upcoming Homework */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-semibold text-slate-800">Upcoming Assignments</h2>
            </div>
            <button
              onClick={() => onNavigate(View.ACADEMICS)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              View all →
            </button>
          </div>

          {pendingHW.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm text-slate-400 font-medium">No pending homework!</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              {pendingHW.slice(0, 4).map((hw, i) => (
                <div
                  key={hw.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${hwColors[i % hwColors.length]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{hw.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {hw.subject} · Due{' '}
                      <span className="font-semibold text-slate-600">
                        {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate(View.ACADEMICS)}
                    className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg
                               opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingHW.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-slate-400 font-medium">
                {pendingHW.length} assignment{pendingHW.length > 1 ? 's' : ''} pending · Stay on top of deadlines
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Root Dashboard ────────────────────────────────────── */

export const Dashboard: React.FC<DashboardProps> = ({
  role,
  onNavigate,
  onFilterNavigate,
  currentUser,
}) => {
  const renderContent = () => {
    switch (role) {
      case UserRole.PARENT:
        return <ParentDashboard onNavigate={onNavigate} currentUser={currentUser} />;
      case UserRole.TEACHER:
        return <TeacherDashboard onNavigate={onNavigate} currentUser={currentUser} />;
      default:
        return <AdminDashboard onNavigate={onNavigate} onFilterNavigate={onFilterNavigate} />;
    }
  };

  return (
    <PageShell>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {renderContent()}
    </PageShell>
  );
};
