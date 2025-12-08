import React from 'react';
import { UserRole, View } from '../types';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Bus, 
  ShieldCheck, 
  CreditCard, 
  MessageSquare, 
  Bot,
  CalendarCheck,
  Users,
  FileText,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  role: UserRole;
  onChangeView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, role, onChangeView }) => {
  
  const menuItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.TRANSPORT] },
    { view: View.STUDENTS, label: 'Students', icon: Users, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { view: View.STAFF, label: 'Staff Directory', icon: Briefcase, roles: [UserRole.ADMIN] },
    { view: View.ACADEMICS, label: 'Academics & Homework', icon: GraduationCap, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { view: View.ATTENDANCE, label: 'Attendance', icon: CalendarCheck, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { view: View.FEES, label: 'Fees & Finance', icon: CreditCard, roles: [UserRole.ADMIN, UserRole.PARENT] },
    { view: View.TRANSPORT, label: 'Transport & GPS', icon: Bus, roles: [UserRole.ADMIN, UserRole.PARENT, UserRole.TRANSPORT] },
    { view: View.SAFETY, label: 'Safety & CCTV', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.TRANSPORT] },
    { view: View.COMMUNICATION, label: 'Communication', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { view: View.DOCUMENTS, label: 'Documents', icon: FileText, roles: [UserRole.ADMIN, UserRole.PARENT] },
    { view: View.AI_ASSISTANT, label: 'AI Assistant', icon: Bot, roles: [UserRole.ADMIN, UserRole.TEACHER] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col z-10 shadow-sm">
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <button 
          onClick={() => onChangeView(View.DASHBOARD)}
          className="flex flex-col items-center hover:opacity-80 transition-opacity focus:outline-none w-full"
          title="Go to Dashboard"
        >
          <img 
            src="https://www.joischools.com/assets/school-logo-DyJSNuS_.jpeg" 
            alt="Junior Odyssey International School" 
            className="w-28 h-auto mb-3 object-contain"
          />
          <div className="text-center">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Junior Odyssey</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">International School</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${currentView === item.view 
                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.view ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5" />
            <h4 className="font-bold text-sm">Need Help?</h4>
          </div>
          <p className="text-xs text-pink-100 mb-3 leading-relaxed">Ask our AI to draft notices or check reports.</p>
          <button 
            onClick={() => onChangeView(View.AI_ASSISTANT)}
            className="w-full bg-white/20 hover:bg-white/30 text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>
    </aside>
  );
};