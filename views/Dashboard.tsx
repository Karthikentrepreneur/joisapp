import React, { useState, useEffect } from 'react';
import { UserRole, View, LeaveRequest, Staff } from '../types';
import { getMyChild, getMyChildHomework, getMyChildInvoices, mockStudents, mockStaff, mockLeaveRequests } from '../data/mockData';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  Bus, 
  Star, 
  CheckCircle, 
  CalendarPlus, 
  X, 
  Check, 
  FileText, 
  Printer, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  CalendarDays,
  Plus,
  CalendarCheck,
  Download
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
      {renderContent()}
    </div>
  );
};

/* --- PARENT DASHBOARD --- */
const ParentDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const child = getMyChild();
  const homework = getMyChildHomework();
  const invoices = getMyChildInvoices();
  const pendingFee = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);

  const [greeting, setGreeting] = useState('Good Morning');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]); 

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else if (hour >= 17) setGreeting('Good Evening');
    else setGreeting('Good Morning');
  }, []);

  const handleLeaveSubmit = (e: React.FormEvent) => {
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

    setMyLeaveRequests([newRequest, ...myLeaveRequests]);
    mockLeaveRequests.push(newRequest);
    
    setShowLeaveModal(false);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    alert("Leave request submitted successfully!");
  };

  if (!child) return <div className="p-8 text-center text-slate-500">No student linked to this account.</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
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
              Your child, <span className="text-white font-bold underline decoration-yellow-400 underline-offset-4">{child.name}</span>, is having a wonderful day in {child.grade}.
            </p>
          </div>
          <div 
            onClick={() => onNavigate(View.TRANSPORT)}
            className="group cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 transition-all duration-300 shadow-xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                <Bus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Live Bus Tracking</p>
                <p className="text-xl font-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  On Route
                </p>
                <div className="flex items-center text-sm font-medium text-blue-100 gap-1 group-hover:gap-2 transition-all">
                  Track now <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate(View.ATTENDANCE)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><CheckCircle className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Attendance</p>
            <div className="flex items-baseline gap-2"><h3 className="text-4xl font-black text-slate-900">{child.attendance}%</h3><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Present Today</div>
          </div>
        </div>
        <div onClick={() => onNavigate(View.ACADEMICS)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><BookOpen className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Assignments</p>
            <h3 className="text-4xl font-black text-slate-900">{homework.length}</h3>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1.5 rounded-full w-fit">Due this week</div>
          </div>
        </div>
        <div onClick={() => onNavigate(View.FEES)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><DollarSign className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Fees Due</p>
            <h3 className="text-3xl font-black text-slate-900">₹{pendingFee.toLocaleString('en-IN')}</h3>
            {pendingFee > 0 ? (
              <button className="mt-4 w-full bg-slate-900 text-white text-xs font-black py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 uppercase tracking-widest">Pay Now</button>
            ) : (
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full w-fit">All Cleared</div>
            )}
          </div>
        </div>
        <div onClick={() => setShowLeaveModal(true)} className="group relative bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all cursor-pointer overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><CalendarPlus className="w-7 h-7" /></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide mb-1">Leave</p>
            <h3 className="text-4xl font-black text-slate-900">Request</h3>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full w-fit">Apply online</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3"><Clock className="w-6 h-6 text-blue-600" />Today's Schedule</h3>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
           </div>
           <div className="space-y-6">
              {[
                { time: '9:00 AM', subject: 'Circle Time & Greetings', icon: '🌈', color: 'bg-blue-50 text-blue-600', status: 'done' },
                { time: '10:45 AM', subject: 'Quick Bites Break', icon: '🍎', color: 'bg-green-50 text-green-600', status: 'active' },
                { time: '12:30 PM', subject: 'Storytime & Reflection', icon: '📖', color: 'bg-purple-50 text-purple-600', status: 'next' },
                { time: '1:00 PM', subject: 'Heading Home', icon: '👋', color: 'bg-yellow-50 text-yellow-600', status: 'next' }
              ].map((slot, i) => (
                <div key={i} className={`flex items-center gap-6 p-5 rounded-[2rem] transition-all duration-300 ${slot.status === 'active' ? 'bg-blue-50/50 border-2 border-blue-200 shadow-md ring-4 ring-blue-50' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'}`}>
                   <div className="w-20 text-xs text-slate-500 font-black uppercase tracking-tighter">{slot.time}</div>
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${slot.color}`}>{slot.icon}</div>
                   <div className="flex-1">
                      <h4 className={`font-black text-lg ${slot.status === 'active' ? 'text-blue-900' : 'text-slate-800'}`}>{slot.subject}</h4>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Preschool Activity</p>
                   </div>
                   {slot.status === 'done' && <div className="bg-emerald-500 text-white p-1 rounded-full"><Check className="w-3 h-3 stroke-[4]" /></div>}
                   {slot.status === 'active' && <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Now</div>}
                </div>
              ))}
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3"><Calendar className="w-6 h-6 text-purple-600" />Leave Log</h3>
           <div className="space-y-4">
              {myLeaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><CalendarDays className="w-10 h-10" /></div>
                   <div><p className="text-slate-400 font-bold">No recent requests</p><p className="text-xs text-slate-300 mt-1">History will appear here</p></div>
                </div>
              ) : (
                myLeaveRequests.map((req) => (
                  <div key={req.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-purple-200 transition-colors">
                     <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${req.status === 'Approved' ? 'bg-emerald-500 text-white' : req.status === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-yellow-400 text-slate-900'}`}>{req.status}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.requestDate}</span>
                     </div>
                     <p className="text-base font-black text-slate-800 flex items-center gap-2">{req.startDate} <ArrowRight className="w-3 h-3 text-slate-400" /> {req.endDate}</p>
                     <p className="text-xs text-slate-500 mt-2 italic font-medium">"{req.reason}"</p>
                  </div>
                ))
              )}
           </div>
           <button onClick={() => setShowLeaveModal(true)} className="w-full mt-8 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 transition-all group">Apply for Leave <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /></button>
        </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border border-white/20">
              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900">Request Leave</h3><button onClick={() => setShowLeaveModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleLeaveSubmit} className="space-y-5">
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label><input type="date" required value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white" /></div>
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label><input type="date" required value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white" /></div>
                 <div className="space-y-1.5"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason</label><textarea required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="e.g., Family event, medical appointment..." className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white h-28 resize-none"></textarea></div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4 active:scale-95">Submit Request</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

/* --- TEACHER DASHBOARD --- */
const TeacherDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [showPayslip, setShowPayslip] = useState(false);
  const currentTeacher = mockStaff.find(s => s.role === 'Teacher') || mockStaff[0]; 
  const adminStaff = mockStaff.find(s => s.role === 'Admin') || mockStaff[1]; 

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
         <div><h1 className="text-3xl font-black text-slate-900 leading-tight">Class 5-A Overview</h1><p className="text-slate-500 font-medium">Welcome back, {currentTeacher.name}! You have <span className="text-pink-600 font-bold">2 assignments</span> to review.</p></div>
         <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button onClick={() => setShowPayslip(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 flex-1 md:flex-none justify-center"><FileText className="w-4 h-4" /> My Payslip</button>
            <button onClick={() => onNavigate(View.ACADEMICS)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 flex-1 md:flex-none justify-center shadow-lg shadow-blue-100"><Calendar className="w-4 h-4" /> View Schedule</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div onClick={() => onNavigate(View.ATTENDANCE)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-150 transition-transform"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:rotate-12 transition-transform shadow-sm"><CheckCircle className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-800">Mark Attendance</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">28/30 Students present today</p>
            </div>
         </div>
         <div onClick={() => onNavigate(View.ACADEMICS)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-pink-50 rounded-full group-hover:scale-150 transition-transform"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:rotate-12 transition-transform shadow-sm"><BookOpen className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-800">Homework & Tasks</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Review "Science Project" submissions</p>
            </div>
         </div>
         <div onClick={() => onNavigate(View.COMMUNICATION)} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-50 rounded-full group-hover:scale-150 transition-transform"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mb-6 group-hover:rotate-12 transition-transform shadow-sm"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-800">Communication</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">2 Unread parent messages</p>
            </div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-900">Class Performance</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Average Score</div>
         </div>
         <div className="h-72">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[ { subject: 'Math', avg: 85 }, { subject: 'Science', avg: 78 }, { subject: 'English', avg: 92 }, { subject: 'History', avg: 88 } ]}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="avg" radius={[12, 12, 0, 0]} barSize={48}><Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#ec4899" /><Cell fill="#f59e0b" /></Bar>
              </BarChart>
           </ResponsiveContainer>
         </div>
      </div>

      {/* Salary Slip Modal with Download / Print signatures */}
      {showPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 print:p-0">
           <div id="payslip-modal-content" className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none">
              <div className="p-8 md:p-12 bg-white text-slate-900">
                <div className="flex flex-col items-center text-center mb-8">
                   <img src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" alt="Logo" className="h-20 w-auto mb-4" />
                   <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">Junior Odyssey International School</h1>
                   <div className="text-xs font-bold text-slate-400 mt-2 leading-relaxed uppercase tracking-widest">
                     <p>1/13, MR Radha Street, Pudupakkam, OMR, Chennai – 603103</p>
                   </div>
                </div>
                <div className="w-full h-px bg-slate-100 mb-8"></div>
                <div className="text-center mb-10">
                   <h2 className="text-xl font-black text-slate-900 uppercase inline-block border-b-4 border-slate-900 pb-1">Official Salary Slip</h2>
                   <p className="text-xs text-slate-400 mt-3 font-bold uppercase tracking-widest">For the month of March, 2024</p>
                </div>
                <div className="mb-10 text-sm">
                   <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                      <div><p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Employee Name</p><p className="font-black text-slate-900 text-base">{currentTeacher.name}</p></div>
                      <div><p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Designation</p><p className="font-black text-slate-900 text-base">{currentTeacher.role}</p></div>
                      <div><p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Employee ID</p><p className="font-black text-slate-900 text-base">{currentTeacher.id}</p></div>
                      <div><p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Pay Date</p><p className="font-black text-slate-900 text-base">31 March, 2024</p></div>
                   </div>
                </div>
                <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden mb-8 text-sm">
                   <div className="bg-slate-50 px-6 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">Earnings</div>
                   <div className="p-6 space-y-4 border-b border-slate-100">
                      <div className="flex justify-between items-center"><span className="text-slate-600 font-bold uppercase tracking-wide text-xs">Basic Salary</span><span className="font-black text-slate-900">₹{currentTeacher.salaryDetails?.basic?.toLocaleString() || '0'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-600 font-bold uppercase tracking-wide text-xs">Allowances (HRA/DA)</span><span className="font-black text-slate-900">₹{currentTeacher.salaryDetails?.allowances?.toLocaleString() || '0'}</span></div>
                   </div>
                   <div className="bg-slate-50 px-6 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">Deductions</div>
                   <div className="p-6 space-y-4 border-b border-slate-100"><div className="flex justify-between items-center"><span className="text-slate-600 font-bold uppercase tracking-wide text-xs">Tax / PF</span><span className="font-black text-slate-900">₹{currentTeacher.salaryDetails?.deductions?.toLocaleString() || '0'}</span></div></div>
                </div>
                <div className="bg-slate-900 rounded-[2rem] p-8 flex justify-between items-center mb-16 shadow-xl shadow-slate-200">
                   <span className="font-black text-white text-xl uppercase tracking-tighter">Net Payable Amount</span>
                   <span className="font-black text-white text-4xl">₹{currentTeacher.salaryDetails?.net?.toLocaleString() || '0'}</span>
                </div>
                
                {/* SIGNATURES SECTION - VISIBLE IN PRINT */}
                <div className="flex justify-between items-end mt-12 px-6">
                   <div className="flex flex-col items-center">
                      <div className="h-24 flex items-end justify-center mb-4">
                         {adminStaff?.signature && <img src={adminStaff.signature} alt="Principal Signature" className="h-20 w-auto object-contain mix-blend-multiply transition-opacity" />}
                      </div>
                      <div className="w-48 border-t-2 border-slate-900 pt-3 text-center">
                         <p className="font-black text-slate-900 text-xs uppercase tracking-widest">Authorized Principal</p>
                         <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{adminStaff?.name}</p>
                      </div>
                   </div>
                   <div className="flex flex-col items-center">
                      <div className="h-24 flex items-end justify-center mb-4">
                         {currentTeacher?.signature && <img src={currentTeacher.signature} alt="Employee Signature" className="h-20 w-auto object-contain mix-blend-multiply transition-opacity" />}
                      </div>
                      <div className="w-48 border-t-2 border-slate-900 pt-3 text-center">
                         <p className="font-black text-slate-900 text-xs uppercase tracking-widest">Employee Signature</p>
                         <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{currentTeacher?.name}</p>
                      </div>
                   </div>
                </div>
                <div className="text-center mt-20 pt-8 border-t border-slate-50 print:block hidden">
                   <p className="text-[10px] text-slate-400 italic">This is a computer-generated document and requires both authorized signatures to be valid.</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 bg-slate-50 no-print">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 font-black uppercase tracking-widest text-xs transition-all shadow-sm active:scale-95" onClick={() => window.print()}>
                    <Printer className="w-5 h-5 text-blue-500" /> Print Record
                 </button>
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-100 active:scale-95" onClick={() => window.print()}>
                    <Download className="w-5 h-5" /> Download Payslip (PDF)
                 </button>
                 <button onClick={() => setShowPayslip(false)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 font-black uppercase tracking-widest text-xs transition-all">
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

/* --- ADMIN DASHBOARD --- */
const AdminDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);

  const handleLeaveAction = (id: string, action: 'Approved' | 'Rejected') => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
    const req = mockLeaveRequests.find(r => r.id === id);
    if (req) req.status = action;
  };

  const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending');

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div><h1 className="text-3xl font-black text-slate-900 leading-tight">Admin Console</h1><p className="text-slate-500 font-medium">School-wide performance monitoring and operations.</p></div>
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span><span className="text-sm font-black text-emerald-700 uppercase tracking-widest">System Healthy</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate(View.STUDENTS)} className="cursor-pointer"><StatCard icon={Users} label="Total Students" value={mockStudents.length.toString()} trend="+5 New" color="blue" /></div>
        <div onClick={() => onNavigate(View.STAFF)} className="cursor-pointer"><StatCard icon={Users} label="Total Staff" value={mockStaff.length.toString()} trend="All Present" color="purple" /></div>
        <div onClick={() => onNavigate(View.FEES)} className="cursor-pointer"><StatCard icon={DollarSign} label="Revenue" value="₹42.5L" trend="+8% vs LY" color="yellow" /></div>
        <div onClick={() => onNavigate(View.SAFETY)} className="cursor-pointer"><StatCard icon={AlertTriangle} label="Safety Alerts" value="0" trend="All Clear" color="emerald" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Revenue & Attendance</h3>
            <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={schoolData}><defs><linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} /><Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="fees" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAtt)" /></AreaChart></ResponsiveContainer></div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Quick Actions</h3>
            <div className="space-y-4">
               {[ { label: 'Admit New Student', view: View.STUDENTS, icon: Users, color: 'bg-blue-50 text-blue-600', hover: 'hover:border-blue-200' }, { label: 'Generate Invoices', view: View.FEES, icon: DollarSign, color: 'bg-yellow-50 text-yellow-600', hover: 'hover:border-yellow-200' }, { label: 'Update Schedule', view: View.ACADEMICS, icon: Calendar, color: 'bg-pink-50 text-pink-600', hover: 'hover:border-pink-200' }, { label: 'System Reports', view: View.DOCUMENTS, icon: FileText, color: 'bg-purple-50 text-purple-600', hover: 'hover:border-purple-200' } ].map((action, i) => (
                  <button key={i} onClick={() => onNavigate(action.view)} className={`w-full text-left p-5 rounded-[1.5rem] border border-slate-100 ${action.hover} transition-all flex items-center gap-4 hover:shadow-md hover:bg-slate-50 group`}><div className={`p-3 rounded-2xl ${action.color} group-hover:scale-110 transition-transform shadow-sm`}><action.icon className="w-5 h-5" /></div><span className="text-sm font-black text-slate-700 uppercase tracking-widest">{action.label}</span></button>
               ))}
            </div>
         </div>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900">Pending Leave Requests</h3><span className="bg-yellow-100 text-yellow-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">{pendingLeaves.length} To Action</span></div>
         {pendingLeaves.length === 0 ? (
           <div className="text-center py-20 text-slate-300"><CalendarCheck className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-bold">No pending leave requests.</p></div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLeaves.map(req => (
                <div key={req.id} className="border-2 border-slate-50 rounded-[2rem] p-6 hover:border-blue-100 transition-all bg-slate-50/50 group">
                   <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 shadow-sm group-hover:text-blue-500 transition-colors">{req.studentName.charAt(0)}</div><div><h4 className="font-black text-slate-800 leading-tight">{req.studentName}</h4><p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{req.studentId}</p></div></div><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.requestDate}</span></div>
                   <div className="mb-6"><div className="inline-flex items-center gap-2 text-xs font-black text-slate-700 mb-2 bg-white px-3 py-1.5 rounded-full border border-slate-100"><Calendar className="w-3 h-3 text-blue-500" />{req.startDate} <span className="text-slate-300">→</span> {req.endDate}</div><p className="text-xs text-slate-500 mt-2 italic font-medium leading-relaxed bg-white/50 p-3 rounded-2xl border border-white">"{req.reason}"</p></div>
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