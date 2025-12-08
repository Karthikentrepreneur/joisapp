import React from 'react';
import { UserRole, View } from '../types';
import { getMyChild, getMyChildHomework, getMyChildInvoices, mockStudents, mockStaff } from '../data/mockData';
import { Users, AlertTriangle, Calendar, Clock, DollarSign, BookOpen, Bus, Star, CheckCircle } from 'lucide-react';
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
  // Render different dashboards based on role
  if (role === UserRole.PARENT) {
    return <ParentDashboard onNavigate={onNavigate} />;
  } else if (role === UserRole.TEACHER) {
    return <TeacherDashboard onNavigate={onNavigate} />;
  } else {
    return <AdminDashboard onNavigate={onNavigate} />;
  }
};

/* --- PARENT DASHBOARD (Child Specific) --- */
const ParentDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const child = getMyChild();
  const homework = getMyChildHomework();
  const invoices = getMyChildInvoices();
  const pendingFee = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);

  if (!child) return <div className="p-8">No student linked to this account.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="z-10 relative">
           <h1 className="text-2xl md:text-3xl font-bold mb-2">Good Morning, {child.parentName.split(' ')[0]}! ☀️</h1>
           <p className="text-blue-100 text-sm md:text-base">Here is the daily update for <span className="font-bold text-yellow-300">{child.name}</span>.</p>
        </div>
        <div className="mt-6 md:mt-0 flex items-center gap-4 cursor-pointer z-10 relative bg-white/10 md:bg-transparent p-3 md:p-0 rounded-xl w-full md:w-auto" onClick={() => onNavigate(View.TRANSPORT)}>
           <div className="text-right flex-1 md:flex-none">
              <p className="text-xs text-blue-200 uppercase tracking-wide">Bus Status</p>
              <p className="font-bold flex items-center gap-2 justify-end text-sm md:text-base"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> On Route</p>
           </div>
           <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <Bus className="w-6 h-6 text-white" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         {/* Attendance Card */}
         <div 
           onClick={() => onNavigate(View.ATTENDANCE)}
           className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Clock className="w-16 h-16 text-emerald-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Attendance</p>
            <h3 className="text-3xl font-black text-slate-800">{child.attendance}%</h3>
            <p className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-lg">Present Today</p>
         </div>

         {/* Homework Card */}
         <div 
           onClick={() => onNavigate(View.ACADEMICS)}
           className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BookOpen className="w-16 h-16 text-pink-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Homework</p>
            <h3 className="text-3xl font-black text-slate-800">{homework.length}</h3>
            <p className="text-xs text-pink-500 font-bold mt-2 bg-pink-50 inline-block px-2 py-1 rounded-lg">Tasks Pending</p>
         </div>

         {/* Fees Card */}
         <div 
            onClick={() => onNavigate(View.FEES)}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <DollarSign className="w-16 h-16 text-yellow-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Fees Due</p>
            <h3 className="text-3xl font-black text-slate-800">₹{pendingFee.toLocaleString('en-IN')}</h3>
            {pendingFee > 0 ? (
               <button className="text-[10px] text-white font-bold mt-2 bg-yellow-500 hover:bg-yellow-600 transition-colors inline-block px-3 py-1.5 rounded-lg shadow-sm">
                 PAY NOW
               </button>
            ) : (
              <p className="text-xs text-green-600 font-bold mt-2">All Paid</p>
            )}
         </div>

         {/* Grade Card */}
         <div 
            onClick={() => onNavigate(View.ACADEMICS)}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Star className="w-16 h-16 text-blue-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Class</p>
            <h3 className="text-3xl font-black text-slate-800">{child.grade}-{child.section}</h3>
            <p className="text-xs text-blue-500 font-bold mt-2 bg-blue-50 inline-block px-2 py-1 rounded-lg">View Report</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child's Timetable */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Today's Schedule</h3>
           <div className="space-y-4">
              {[
                { time: '09:00 AM', subject: 'Maths', icon: '📐', color: 'bg-blue-100 text-blue-600' },
                { time: '10:00 AM', subject: 'Science', icon: '🔬', color: 'bg-green-100 text-green-600' },
                { time: '11:00 AM', subject: 'English', icon: '📖', color: 'bg-pink-100 text-pink-600' },
                { time: '01:00 PM', subject: 'Art', icon: '🎨', color: 'bg-yellow-100 text-yellow-600' }
              ].map((slot, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                   <div className="w-16 text-xs text-slate-500 font-bold">{slot.time}</div>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${slot.color}`}>
                     {slot.icon}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{slot.subject}</h4>
                      <p className="text-xs text-slate-500">Regular Session</p>
                   </div>
                   {i === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">Completed</span>}
                   {i === 1 && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">Now</span>}
                </div>
              ))}
           </div>
        </div>

        {/* Notices */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" onClick={() => onNavigate(View.COMMUNICATION)}>
           <h3 className="font-bold text-lg text-slate-800 mb-4 cursor-pointer hover:text-blue-600">School Notices</h3>
           <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold bg-white text-rose-500 px-2 py-0.5 rounded-full shadow-sm">Urgent</span>
                    <span className="text-[10px] text-rose-400">Today</span>
                 </div>
                 <p className="text-sm font-semibold text-rose-800 mt-2">Bus Route 5 delayed by 15 mins due to traffic.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold bg-white text-blue-500 px-2 py-0.5 rounded-full shadow-sm">Event</span>
                    <span className="text-[10px] text-blue-400">Tomorrow</span>
                 </div>
                 <p className="text-sm font-semibold text-blue-800 mt-2">Annual Science Fair registration closes tomorrow.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

/* --- TEACHER DASHBOARD --- */
const TeacherDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">Class 5-A Overview</h1>
            <p className="text-slate-500">You have 2 pending tasks today.</p>
         </div>
         <button 
           onClick={() => onNavigate(View.ACADEMICS)}
           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center"
         >
            <Calendar className="w-4 h-4" /> View Schedule
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Register Shortcut */}
         <div 
           onClick={() => onNavigate(View.ATTENDANCE)}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group"
         >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
               <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">Mark Attendance</h3>
            <p className="text-sm text-slate-500 mt-1">28/30 Students present</p>
         </div>

         {/* Homework Shortcut */}
         <div 
           onClick={() => onNavigate(View.ACADEMICS)}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-pink-200 transition-colors cursor-pointer group"
         >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
               <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">Homework & Tasks</h3>
            <p className="text-sm text-slate-500 mt-1">Review "Science Project"</p>
         </div>

         {/* Leave Requests */}
         <div 
           onClick={() => onNavigate(View.COMMUNICATION)}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-yellow-200 transition-colors cursor-pointer group"
         >
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 mb-4 group-hover:scale-110 transition-transform">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">Leave Requests</h3>
            <p className="text-sm text-slate-500 mt-1">2 Pending Approval</p>
         </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="font-bold text-slate-800 mb-4">Class Performance Trends</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                 { subject: 'Math', avg: 85 },
                 { subject: 'Science', avg: 78 },
                 { subject: 'English', avg: 92 },
                 { subject: 'History', avg: 88 }
              ]}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={40}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ec4899" />
                    <Cell fill="#f59e0b" />
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

/* --- ADMIN DASHBOARD --- */
const AdminDashboard = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
          <p className="text-slate-500">School-wide performance and financial health.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           <span className="text-sm font-semibold text-slate-700">System Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div onClick={() => onNavigate(View.STUDENTS)} className="cursor-pointer"><StatCard icon={Users} label="Total Students" value={mockStudents.length.toString()} trend="+5 New" color="blue" /></div>
        <div onClick={() => onNavigate(View.STAFF)} className="cursor-pointer"><StatCard icon={Users} label="Total Staff" value={mockStaff.length.toString()} trend="All Present" color="purple" /></div>
        <div onClick={() => onNavigate(View.FEES)} className="cursor-pointer"><StatCard icon={DollarSign} label="Revenue" value="₹42.5L" trend="+8% vs LY" color="yellow" /></div>
        <div onClick={() => onNavigate(View.SAFETY)} className="cursor-pointer"><StatCard icon={AlertTriangle} label="Safety Issues" value="0" trend="Clear" color="emerald" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Revenue & Attendance</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={schoolData}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="fees" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
               <button 
                 onClick={() => onNavigate(View.STUDENTS)}
                 className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all flex items-center gap-3"
               >
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700">Admit New Student</span>
               </button>
               <button 
                 onClick={() => onNavigate(View.FEES)}
                 className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-yellow-200 transition-all flex items-center gap-3"
               >
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><DollarSign className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700">Generate Fee Invoices</span>
               </button>
               <button 
                 onClick={() => onNavigate(View.ACADEMICS)}
                 className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-pink-200 transition-all flex items-center gap-3"
               >
                  <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Calendar className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700">Update Timetable</span>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => {
  const colorClasses: {[key: string]: string} = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600`}>
          {trend}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-1">{value}</h3>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};