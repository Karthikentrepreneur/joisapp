import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, View, Student, Staff, ProgramType, LeaveRequest } from '../types';
import { db } from '../services/persistence';
import { 
  Users, 
  Loader2, 
  CalendarCheck,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Briefcase,
  GraduationCap,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  role: UserRole;
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate, onFilterNavigate }) => {
  const renderContent = () => {
    switch (role) {
      case UserRole.PARENT: return <ParentDashboard onNavigate={onNavigate} />;
      case UserRole.TEACHER: return <TeacherDashboard onNavigate={onNavigate} />;
      default: return <AdminDashboard onNavigate={onNavigate} onFilterNavigate={onFilterNavigate} />;
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12">
      {renderContent()}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, onClick, subValue }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 cursor-pointer group flex items-center gap-4 hover:shadow-lg transition-all duration-200 border border-slate-200 rounded-2xl shadow-sm active:scale-[0.98]"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate leading-none">{value}</h3>
      {subValue && <p className="text-[11px] font-medium text-slate-400 mt-1.5 truncate">{subValue}</p>}
    </div>
  </div>
);

const AdminDashboard = ({ onNavigate, onFilterNavigate }: { onNavigate: (view: View) => void, onFilterNavigate?: (program: ProgramType) => void }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [s, st, lv] = await Promise.all([
        db.getAll('students'), 
        db.getAll('staff'),
        db.getAll('leaveRequests')
      ]);
      setStudents(s || []);
      setStaff(st || []);
      setLeaves(lv || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">School Overview</h1>
          <p className="text-slate-500 text-xs font-medium">Monitoring academic and administrative activity</p>
        </div>
        <button 
          onClick={() => { setLoading(true); loadData(); }} 
          className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard icon={Users} label="Total Students" value={students.length} color="bg-blue-600" onClick={() => onNavigate(View.STUDENTS)} />
         <StatCard icon={Briefcase} label="Working Staff" value={staff.length} color="bg-indigo-600" onClick={() => onNavigate(View.STAFF)} />
         <StatCard icon={CalendarDays} label="Leave Requests" value={pendingLeavesCount} subValue="Pending your review" color="bg-orange-500" onClick={() => onNavigate(View.LEAVE)} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrolled Capacity by Class</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROGRAMS.map((p, i) => {
                const count = students.filter(s => s.program === p).length;
                const capacity = 40;
                const fillPercent = (count / capacity) * 100;

                return (
                  <div 
                    key={p} 
                    className="p-5 rounded-xl bg-slate-50 hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-md cursor-pointer"
                    onClick={() => onFilterNavigate?.(p)}
                  >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-900">{p}</span>
                        <span className="text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded">
                          {count}/{capacity}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full ${i % 2 === 0 ? 'bg-blue-600' : 'bg-slate-800'} rounded-full transition-all duration-700`} 
                          style={{ width: `${Math.max(5, Math.min(100, fillPercent))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-slate-400">Class Occupancy</p>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                  </div>
                );
              })}
          </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [presenceToday, setPresenceToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ProgramType | 'N/A'>('N/A');

  const loadTeacherData = useCallback(async () => {
    try {
      const [allStudents, allStaff, allLogs] = await Promise.all([
        db.getAll('students'),
        db.getAll('staff'),
        db.getAll('attendanceLogs')
      ]);

      const currentTeacher = allStaff.find(s => s.role === 'Teacher');
      const assignedProgram = currentTeacher?.classAssigned as ProgramType || 'Little Seeds';
      setProgram(assignedProgram);

      const myStudents = allStudents.filter(s => s.program === assignedProgram);
      setAssignedStudents(myStudents);

      const today = new Date().toISOString().split('T')[0];
      const studentIds = new Set(myStudents.map(s => s.id));
      const presentCount = allLogs.filter(l => 
        l.date === today && 
        studentIds.has(l.studentId) && 
        (l.status === 'Present' || l.status === 'Late')
      ).length;
      
      setPresenceToday(presentCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeacherData(); }, [loadTeacherData]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
         <div className="z-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Teacher Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium">
               Assigned Class: <span className="text-blue-600 font-bold">{program}</span>
            </p>
         </div>
         <div className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-sm flex items-center gap-3 z-10">
            <Clock className="w-5 h-5" />
            <div>
               <p className="text-sm font-bold leading-none mb-1">Session Active</p>
               <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Attendance window is open</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatCard 
            icon={Users} 
            label="Class Roster" 
            value={assignedStudents.length} 
            color="bg-blue-600" 
            onClick={() => onNavigate(View.STUDENTS)} 
         />
         <StatCard 
            icon={CalendarCheck} 
            label="Attendance Marked" 
            value={`${presenceToday} / ${assignedStudents.length}`} 
            color="bg-emerald-600" 
            subValue="For current date"
            onClick={() => onNavigate(View.ATTENDANCE)} 
         />
      </div>
    </div>
  );
};

const ParentDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [child, setChild] = useState<Student | null>(null);
  const [pendingFees, setPendingFees] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadParentData = useCallback(async () => {
    try {
      const [students, invoices] = await Promise.all([
        db.getAll('students'),
        db.getAll('invoices')
      ]);
      
      const myChild = students[0]; 
      setChild(myChild || null);

      if (myChild) {
         const dues = invoices
           .filter(i => i.studentId === myChild.id && i.status !== 'Paid')
           .reduce((sum, i) => sum + i.amount, 0);
         setPendingFees(dues);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadParentData(); }, [loadParentData]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;
  
  if (!child) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest bg-white rounded-2xl border border-slate-200 shadow-sm mx-4">No linked student found.</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="bg-white p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
         <div className="shrink-0">
            <img src={child.image} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt="Student" />
         </div>
         <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">Student Account</span>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">{child.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
               <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 uppercase tracking-wider">{child.program}</span>
               <span className="bg-blue-50 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 uppercase tracking-wider">ID: {child.id}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatCard 
            icon={CalendarCheck} 
            label="Attendance Rate" 
            value={`${child.attendance}%`} 
            color="bg-emerald-600" 
            onClick={() => onNavigate(View.ATTENDANCE)} 
         />
         <StatCard 
            icon={CreditCard} 
            label="Pending Fees" 
            value={`₹${pendingFees.toLocaleString('en-IN')}`} 
            subValue={pendingFees > 0 ? "Outstanding Balance" : "Account Up-to-date"}
            color={pendingFees > 0 ? "bg-orange-500" : "bg-blue-600"} 
            onClick={() => onNavigate(View.FEES)} 
         />
      </div>
    </div>
  );
};