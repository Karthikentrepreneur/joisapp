
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, View, Student, Staff, AttendanceLog, ProgramType, LeaveRequest } from '../types';
import { db } from '../services/persistence';
import { 
  Users, 
  CheckCircle, 
  Loader2, 
  TrendingUp,
  CalendarCheck,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Briefcase,
  GraduationCap,
  CreditCard,
  AlertCircle,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';

interface DashboardProps {
  role: UserRole;
  onNavigate: (view: View) => void;
  onFilterNavigate?: (program: ProgramType) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate, onFilterNavigate }) => {
  const isConnected = db.isConnected();

  const renderContent = () => {
    switch (role) {
      case UserRole.PARENT: return <ParentDashboard onNavigate={onNavigate} />;
      case UserRole.TEACHER: return <TeacherDashboard onNavigate={onNavigate} />;
      default: return <AdminDashboard onNavigate={onNavigate} onFilterNavigate={onFilterNavigate} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] scroll-smooth no-scrollbar">
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-lg pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
          {isConnected ? 'Vault Connected' : 'Offline Mode'}
        </span>
      </div>
      {renderContent()}
    </div>
  );
};

const CompactStat = ({ icon: Icon, label, value, color, onClick, subValue }: any) => (
  <div 
    onClick={onClick}
    className="pro-card p-6 cursor-pointer group flex items-center gap-5 hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-white"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-7 h-7" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate">{value}</h3>
      {subValue && <p className="text-[11px] font-bold text-slate-400 mt-1">{subValue}</p>}
    </div>
    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 transition-all">
      <ArrowUpRight className="w-4 h-4 text-slate-400" />
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
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    const studentSub = db.subscribe('students', () => loadData(), () => loadData(), () => loadData());
    const staffSub = db.subscribe('staff', () => loadData(), () => loadData(), () => loadData());
    const leaveSub = db.subscribe('leaveRequests', () => loadData(), () => loadData(), () => loadData());
    
    return () => {
      studentSub.unsubscribe();
      staffSub.unsubscribe();
      leaveSub.unsubscribe();
    };
  }, [loadData]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Administrative Command</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Global monitoring for <span className="text-blue-600 font-bold">Junior Odyssey Hub</span>
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); loadData(); }} 
          className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Force Sync
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <CompactStat icon={Users} label="Current Enrollment" value={students.length} color="bg-blue-600" onClick={() => onNavigate(View.STUDENTS)} />
         <CompactStat icon={Briefcase} label="Active Personnel" value={staff.length} color="bg-slate-900" onClick={() => onNavigate(View.STAFF)} />
         <CompactStat icon={CalendarDays} label="Approval Queue" value={pendingLeavesCount} subValue="Pending leave apps" color="bg-rose-500" onClick={() => onNavigate(View.LEAVE)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-12 pro-card p-8 bg-white">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Enrollment Matrix
               </h4>
               <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">Live Load Balance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {PROGRAMS.map((p, i) => {
                  const programCount = students.filter(s => s.program === p).length;
                  const capacity = 40;
                  const fillPercent = (programCount / capacity) * 100;

                  return (
                    <div 
                      key={p} 
                      className="space-y-3 cursor-pointer group/prog p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      onClick={() => onFilterNavigate?.(p)}
                    >
                       <div className="flex justify-between items-center">
                          <span className="text-[13px] font-black text-slate-900 tracking-tight">{p}</span>
                          <span className="text-blue-600 text-xs font-black flex items-center gap-2">
                            {programCount} <span className="text-slate-300 font-medium">/ {capacity}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/prog:opacity-100 transition-opacity" />
                          </span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-white">
                          <div 
                            className={`h-full ${i % 2 === 0 ? 'bg-blue-600' : 'bg-slate-900'} rounded-full transition-all duration-1000`} 
                            style={{ width: `${Math.min(100, fillPercent)}%` }}
                          />
                       </div>
                    </div>
                  );
               })}
            </div>
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
    } catch (err) {
      console.error("Teacher dash error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherData();
    
    const studentSub = db.subscribe('students', () => loadTeacherData(), () => loadTeacherData(), () => loadTeacherData());
    const attendanceSub = db.subscribe('attendanceLogs', () => loadTeacherData(), () => loadTeacherData(), () => loadTeacherData());
    
    return () => {
      studentSub.unsubscribe();
      attendanceSub.unsubscribe();
    };
  }, [loadTeacherData]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Faculty Hub</h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
               Currently directing <span className="text-blue-600 font-bold uppercase tracking-widest">{program}</span> cohort
            </p>
         </div>
         <div className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-blue-100 flex items-center gap-4 relative z-10 group hover:scale-105 transition-all">
            <Clock className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Morning Shift</p>
               <p className="text-lg font-black leading-none">Active Session</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <CompactStat 
            icon={Users} 
            label="Enrolled Learners" 
            value={assignedStudents.length} 
            color="bg-blue-600" 
            onClick={() => onNavigate(View.STUDENTS)} 
         />
         <CompactStat 
            icon={CalendarCheck} 
            label="Presence Audit" 
            value={`${presenceToday} / ${assignedStudents.length}`} 
            color="bg-emerald-500" 
            subValue="Verified checked-in today"
            onClick={() => onNavigate(View.ATTENDANCE)} 
         />
      </div>

      <div className="pro-card p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[3rem]">
         <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] leading-none">End of Morning Brief</p>
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
      
      let myChild = students.find(s => s.parentId === CURRENT_USER_ID);
      if (!myChild && students.length > 0) {
        myChild = students.find(s => invoices.some(i => i.studentId === s.id)) || students[0];
      }
      setChild(myChild || null);

      if (myChild) {
         const dues = invoices
           .filter(i => i.studentId === myChild.id && i.status !== 'Paid')
           .reduce((sum, i) => sum + i.amount, 0);
         setPendingFees(dues);
      }
    } catch (err) {
      console.error("Parent dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParentData();
    const studentSub = db.subscribe('students', () => loadParentData(), () => loadParentData(), () => loadParentData());
    const invoiceSub = db.subscribe('invoices', () => loadParentData(), () => loadParentData(), () => loadParentData());
    return () => {
      studentSub.unsubscribe();
      invoiceSub.unsubscribe();
    };
  }, [loadParentData]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;
  
  if (!child) return (
    <div className="p-24 text-center flex flex-col items-center justify-center h-full">
       <AlertCircle className="w-16 h-16 text-slate-200 mb-8" />
       <h3 className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Identity Not Found</h3>
       <p className="text-slate-500 max-w-sm font-medium">Please contact the central office to link your parent profile to a student ID.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="pro-card p-12 flex flex-col md:flex-row items-center gap-10 bg-white border-none shadow-2xl rounded-[3.5rem] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-80"></div>
         <div className="relative z-10">
            <img src={child.image} className="w-40 h-40 rounded-[3rem] object-cover border-8 border-slate-50 shadow-2xl group-hover:scale-105 transition-transform" />
            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white p-3 rounded-2xl shadow-xl border-4 border-white">
               <GraduationCap className="w-6 h-6" />
            </div>
         </div>
         <div className="flex-1 text-center md:text-left relative z-10">
            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4 block">Child Profile Linked</span>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">{child.name}</h1>
            <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest">{child.program} • UID: {child.id}</p>
         </div>
         <div className="bg-slate-50 px-10 py-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-center md:items-end relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Vault Security</p>
            <div className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-emerald-500" />
               <span className="text-[12px] font-black text-emerald-600 uppercase tracking-widest">Verified Account</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <CompactStat 
            icon={CalendarCheck} 
            label="Attendance Score" 
            value={`${child.attendance}%`} 
            subValue="Verified academic presence"
            color="bg-emerald-500" 
            onClick={() => onNavigate(View.ATTENDANCE)} 
         />

         <CompactStat 
            icon={CreditCard} 
            label="Account Standing" 
            value={`₹${pendingFees.toLocaleString('en-IN')}`} 
            subValue={pendingFees > 0 ? "Outstanding Balance" : "Cleared for Cycle"}
            color={pendingFees > 0 ? "bg-rose-500" : "bg-blue-600"} 
            onClick={() => onNavigate(View.FEES)} 
         />
      </div>

      {pendingFees > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-pulse shadow-xl shadow-rose-500/5">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-rose-500 shadow-lg">
                 <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                 <h4 className="text-2xl font-black text-rose-900 tracking-tight leading-none mb-2">Financial Alert</h4>
                 <p className="text-sm text-rose-700 font-bold opacity-80 uppercase tracking-widest">Please settle ₹{pendingFees.toLocaleString('en-IN')} to prevent service suspension.</p>
              </div>
           </div>
           <button 
             onClick={() => onNavigate(View.FEES)}
             className="bg-rose-500 text-white px-12 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
           >
             Settle Dues
           </button>
        </div>
      )}

      <div className="flex items-center gap-4 py-10 opacity-40 justify-center">
         <div className="h-px w-20 bg-slate-200"></div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Junior Odyssey Cloud Hub</p>
         <div className="h-px w-20 bg-slate-200"></div>
      </div>
    </div>
  );
};
