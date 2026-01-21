
import React from 'react';
import { UserRole, View } from '../types';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Bus, 
  ShieldCheck, 
  CreditCard, 
  MessageSquare, 
  CalendarCheck,
  Users,
  Briefcase,
  Settings,
  CalendarDays,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  role: UserRole;
  permissions: Record<UserRole, View[]>;
  onChangeView: (view: View) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, role, permissions, onChangeView, onClose }) => {
  
  const allMenuItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: View.STUDENTS, label: 'Students', icon: Users },
    { view: View.STAFF, label: 'Staff Directory', icon: Briefcase },
    { view: View.ACADEMICS, label: 'Academics', icon: GraduationCap },
    { view: View.ATTENDANCE, label: 'Attendance', icon: CalendarCheck },
    { view: View.LEAVE, label: 'Leaves', icon: CalendarDays },
    { view: View.FEES, label: 'Finance', icon: CreditCard },
    { view: View.TRANSPORT, label: 'Transport', icon: Bus },
    { view: View.SAFETY, label: 'Security', icon: ShieldCheck },
    { view: View.COMMUNICATION, label: 'Messages', icon: MessageSquare },
    { view: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const allowedViews = permissions[role] || [];
  const filteredItems = allMenuItems.filter(item => allowedViews.includes(item.view));

  return (
    <aside className="w-60 bg-white border-r border-slate-200 h-full flex flex-col z-50 shrink-0 shadow-sm transition-all duration-300">
      {/* Tightened Logo Section */}
      <div className="px-5 py-8 border-b border-slate-100 flex flex-col items-center justify-center gap-3 bg-slate-50/20">
        <button onClick={() => onChangeView(View.DASHBOARD)} className="flex flex-col items-center gap-3 hover:opacity-85 transition-all">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 overflow-hidden border border-slate-200 shadow-md">
            <img 
              src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" 
              alt="JOIS Logo" 
              className="w-full h-auto object-contain" 
            />
          </div>
          <div className="text-center">
            <h1 className="text-xs font-extrabold text-slate-900 tracking-tight uppercase leading-none">Junior Odyssey</h1>
            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1.5">International</p>
          </div>
        </button>
        {onClose && (
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {filteredItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => {
                onChangeView(item.view);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
              <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100">
         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">Enterprise 2.4</p>
         </div>
      </div>
    </aside>
  );
};
