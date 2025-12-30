import React, { useState, useEffect } from 'react';
import { UserRole, View, LeaveRequest, Staff, Student, Invoice } from '../types';
import { db } from '../services/persistence';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  Bus, 
  CheckCircle, 
  CalendarPlus, 
  X, 
  Check, 
  FileText, 
  Printer, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Sparkles,
  CalendarDays,
  Plus,
  CalendarCheck,
  Download,
  Database,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface DashboardProps {
  role: UserRole;
  onNavigate: (view: View) => void;
}

const schoolData = [
  { name: 'Jan', attendance: 92, fees: 85 },
  { name: 'Feb', attendance: 95, fees: 88 },
  { name: 'Mar', attendance: 91, fees: 92 },
  { name: 'Apr', attendance: 98, fees: 75 },
  { name: 'May', attendance: 96, fees: 95 },
  { name: 'Jun', attendance: 97, fees: 98 },
];

export const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate }) => {
  const isConnected = db.isConnected();

  const renderContent = () => {
    if (role === UserRole.PARENT) {
      return <ParentDashboard onNavigate={onNavigate} />;
    } else if (role === UserRole.TEACHER) {
      return <TeacherDashboard onNavigate={onNavigate} />;
    } else {
      return <AdminDashboard onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-smooth bg-slate-50/50">
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-lg pointer-events-none">
        <Database className={`w-3 h-3 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          {isConnected ? 'Supabase Live' : 'Local Persistence'}
        </span>
      </div>
      {renderContent()}
    </div>
  );
};

/* --- PARENT DASHBOARD --- */
const ParentDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [child, setChild] = useState<Student | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]); 
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const loadParentData = async () => {
    setLoading(true);
    const students = await db.getAll('students');
    // For demo, assume first student is ours if no CURRENT_USER_ID match
    const myChild = students.find(s => s.parentId === 'USR-PARENT-01') || students[0];
    setChild(myChild || null);

    if (myChild) {
      const [allInvoices, allLeaves] = await Promise.all([
        db.getAll('invoices'),
        db.getAll('leaveRequests')
      ]);
      setInvoices(allInvoices.filter(i => i.studentId === myChild.id));
      setMyLeaveRequests(allLeaves.filter(l => l.studentId === myChild.id).sort((a,b) => b.id.localeCompare(a.id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadParentData();
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else if (hour >= 17) setGreeting('Good Evening');
    else setGreeting('Good Morning');
  }, []);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    
    const newRequest: LeaveRequest = {
      id: `LR-${Date.now()}`,
      studentId: child.id,
      studentName: child.name,
      parentId: child.parentId,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0]
    };

    try {
      await db.create('leaveRequests', newRequest);
      setMyLeaveRequests([newRequest, ...myLeaveRequests]);
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
    } catch (err) {
      alert("Failed to submit leave request.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!child) return (
    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full space-y-4">
      <Users className="w-16 h-16 opacity-20" />
      <h3 className="text-xl font-black">No Student Linked</h3>
      <p>Please contact school administration to link your child's profile.</p>
    </div>
  );

  const pendingFee = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/10">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>JOIS Parent Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {greeting}, <br className="md:hidden" />
              <span className="text-blue-100">{child.parentName.split(' ')[0]}!</span>
            </h1>
            <p className="text-blue-100/80 text-lg font-medium max-w-md">
              Your child, <span className="text-white font-bold underline decoration-yellow-400 underline-offset-4">{child.name}</span>, is enrolled in {child.grade}.
            </p>
          </div>
          <div onClick={() => onNavigate(View.TRANSPORT)} className="group cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                <Bus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Live Bus Tracking</p>
                <p className="text-xl font-black flex items-center gap-2"><span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>Active</p>
                <div className="flex items-center text-sm font-medium text-blue-100 gap-1 group-hover:gap-2 transition-all">Track now <ChevronRight className="w-4 h-4" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate(View.ATTENDANCE)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><CheckCircle className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Attendance</p>
            <div className="flex items-baseline gap-2"><h3 className="text-4xl font-black text-slate-900">{child.attendance}%</h3></div>
          </div>
        </div>
        <div onClick={() => onNavigate(View.ACADEMICS)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><BookOpen className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Academics</p>
            <h3 className="text-4xl font-black text-slate-900">Portal</h3>
          </div>
        </div>
        <div onClick={() => onNavigate(View.FEES)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><DollarSign className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Fees Due</p>
            <h3 className="text-3xl font-black text-slate-900">₹{pendingFee.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div onClick={() => setShowLeaveModal(true)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><CalendarPlus className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Leave</p>
            <h3 className="text-4xl font-black text-slate-900">Request</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3 mb-8"><Clock className="w-6 h-6 text-blue-600" />Schedule</h3>
           <p className="text-slate-400 italic">No schedule data provided by administration yet.</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3"><Calendar className="w-6 h-6 text-purple-600" />Leave Log</h3>
           <div className="space-y-4">
              {myLeaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                   <p className="text-slate-400 font-bold">No recent requests</p>
                </div>
              ) : (
                myLeaveRequests.map((req) => (
                  <div key={req.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-purple-200 transition-colors">
                     <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${req.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-slate-900'}`}>{req.status}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{req.requestDate}</span>
                     </div>
                     <p className="text-sm font-black text-slate-800">{req.startDate} → {req.endDate}</p>
                  </div>
                ))
              )}
           </div>
           <button onClick={() => setShowLeaveModal(true)} className="w-full mt-8 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 transition-all group">Apply for Leave <Plus className="w-4 h-4" /></button>
        </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900">Request Leave</h3><button onClick={() => setShowLeaveModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleLeaveSubmit} className="space-y-5">
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" required value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold bg-white" /></div>
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label><input type="date" required value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold bg-white" /></div>
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason</label><textarea required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold h-28 resize-none"></textarea></div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95 mt-4">Submit Request</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

/* --- TEACHER DASHBOARD --- */
const TeacherDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
         <h1 className="text-3xl font-black text-slate-900">Teacher Dashboard</h1>
         <p className="text-slate-500 font-medium mt-2">Manage your assigned groups and daily activities here.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div onClick={() => onNavigate(View.ATTENDANCE)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer">
            <h3 className="text-xl font-black text-slate-800">Attendance</h3>
            <p className="text-sm text-slate-500 mt-2">Take daily roll call</p>
         </div>
         <div onClick={() => onNavigate(View.ACADEMICS)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer">
            <h3 className="text-xl font-black text-slate-800">Academics</h3>
            <p className="text-sm text-slate-500 mt-2">Lesson plans & tasks</p>
         </div>
         <div onClick={() => onNavigate(View.COMMUNICATION)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer">
            <h3 className="text-xl font-black text-slate-800">Messaging</h3>
            <p className="text-sm text-slate-500 mt-2">Parent communications</p>
         </div>
      </div>
    </div>
  );
};

/* --- ADMIN DASHBOARD --- */
const AdminDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminStats = async () => {
    setLoading(true);
    const [sData, stData, iData, lData] = await Promise.all([
      db.getAll('students'),
      db.getAll('staff'),
      db.getAll('invoices'),
      db.getAll('leaveRequests')
    ]);
    setStudents(sData);
    setStaff(stData);
    setInvoices(iData);
    setLeaveRequests(lData);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminStats();
    const studentSub = db.subscribe('students', loadAdminStats);
    const invoiceSub = db.subscribe('invoices', loadAdminStats);
    const leaveSub = db.subscribe('leaveRequests', loadAdminStats);
    return () => { studentSub.unsubscribe(); invoiceSub.unsubscribe(); leaveSub.unsubscribe(); };
  }, []);

  const handleLeaveAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await db.update('leaveRequests', id, { status: action });
      setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
    } catch (e) {
      alert("Failed to update leave request");
    }
  };

  const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending');
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-400 w-10 h-10" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div><h1 className="text-3xl font-black text-slate-900 leading-tight">Admin Console</h1><p className="text-slate-500 font-medium">Real-time school performance monitoring.</p></div>
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-sm font-black text-emerald-700 uppercase tracking-widest">System Healthy</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate(View.STUDENTS)} className="cursor-pointer"><StatCard icon={Users} label="Total Students" value={students.length.toString()} trend="Live Count" color="blue" /></div>
        <div onClick={() => onNavigate(View.STAFF)} className="cursor-pointer"><StatCard icon={Users} label="Total Staff" value={staff.length.toString()} trend="Live Count" color="purple" /></div>
        <div onClick={() => onNavigate(View.FEES)} className="cursor-pointer"><StatCard icon={DollarSign} label="Revenue" value={`₹${(totalRevenue/100000).toFixed(1)}L`} trend="Actual Sum" color="yellow" /></div>
        <div onClick={() => onNavigate(View.SAFETY)} className="cursor-pointer"><StatCard icon={AlertTriangle} label="Safety Alerts" value="0" trend="All Clear" color="emerald" /></div>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900">Pending Leave Requests</h3><span className="bg-yellow-100 text-yellow-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">{pendingLeaves.length} To Action</span></div>
         {pendingLeaves.length === 0 ? (
           <div className="text-center py-20 text-slate-300"><CalendarCheck className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-bold">No pending leave requests.</p></div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLeaves.map(req => (
                <div key={req.id} className="border-2 border-slate-50 rounded-[2rem] p-6 hover:border-blue-100 transition-all bg-slate-50/50 group">
                   <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 shadow-sm">{req.studentName.charAt(0)}</div><div><h4 className="font-black text-slate-800 leading-tight">{req.studentName}</h4><p className="text-[10px] text-slate-400 uppercase tracking-widest">{req.studentId}</p></div></div><span className="text-[10px] text-slate-400 font-bold">{req.requestDate}</span></div>
                   <div className="mb-6"><p className="text-xs text-slate-500 font-medium">"{req.reason}"</p></div>
                   <div className="flex gap-3"><button onClick={() => handleLeaveAction(req.id, 'Approved')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95"><Check className="w-4 h-4 stroke-[3]" /> Approve</button><button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 flex items-center justify-center gap-2 transition-all active:scale-95"><X className="w-4 h-4 stroke-[3]" /> Reject</button></div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => {
  const colorClasses: {[key: string]: string} = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-emerald-50 text-emerald-600 border-emerald-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100', purple: 'bg-purple-50 text-purple-600 border-purple-100', };
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group overflow-hidden relative"><div className={`absolute top-0 right-0 w-2 h-full opacity-0 group-hover:opacity-100 transition-opacity ${colorClasses[color].split(' ')[1]}`}></div><div className="flex items-center justify-between mb-6"><div className={`p-4 rounded-2xl shadow-sm ${colorClasses[color]}`}><Icon className="w-7 h-7" /></div><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100`}>{trend}</span></div><h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3><p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</p></div>
  );
};
