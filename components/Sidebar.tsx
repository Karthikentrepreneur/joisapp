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
    { view: View.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { view: View.STUDENTS, label: 'Student List', icon: Users },
    { view: View.STAFF, label: 'Teacher List', icon: Briefcase },
    { view: View.ACADEMICS, label: 'Academic', icon: GraduationCap },
    { view: View.ATTENDANCE, label: 'Attendance', icon: CalendarCheck },
    { view: View.LEAVE, label: 'Leave Management', icon: CalendarDays },
    { view: View.FEES, label: 'Finance', icon: CreditCard },
    { view: View.TRANSPORT, label: 'Bus Tracking', icon: Bus },
    { view: View.SAFETY, label: 'Cameras', icon: ShieldCheck },
    { view: View.COMMUNICATION, label: 'Messages', icon: MessageSquare },
    { view: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const allowedViews = permissions[role] || [];
  const filteredItems = allMenuItems.filter(item => allowedViews.includes(item.view));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col z-50 shrink-0 shadow-lg md:shadow-sm">
      {/* Sidebar Header - Compact Vertical Branding */}
      <div className="px-4 pt-6 pb-4 border-b border-slate-100 flex flex-col items-center bg-gradient-to-b from-slate-50/30 to-transparent relative">
        {onClose && (
          <button onClick={onClose} className="md:hidden absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
        
        <button 
          onClick={() => { onChangeView(View.DASHBOARD); if (onClose) onClose(); }} 
          className="flex flex-col items-center gap-1 hover:opacity-90 transition-all group w-full text-center"
        >
          {/* Logo Top - Size maintained, spacing tightened */}
          <div className="w-36 h-32 flex items-center justify-center transition-all duration-500">
            <img 
              src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" 
              alt="JOIS Logo" 
              className="w-full h-auto object-contain transform group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
          
          {/* School Name Below - Compact spacing as per design */}
          <div className="flex flex-col items-center mt-[-10px]">
            <h1 className="text-[17px] font-[900] text-[#1e293b] uppercase leading-tight tracking-tight">Junior Odyssey</h1>
            <h2 className="text-[11px] font-[800] text-[#3b82f6] uppercase tracking-[0.1em] mt-0.5 leading-none">International School</h2>
            <div className="flex justify-center mt-3">
              <div className="h-1 w-6 bg-[#3b82f6] rounded-full group-hover:w-full transition-all duration-500 opacity-20 group-hover:opacity-100"></div>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation */}
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-200/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full"></div>
              )}
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
              <span className="text-[14px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-100">
         <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-center backdrop-blur-sm">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Platform Version 2.5</p>
         </div>
      </div>
    </aside>
  );
};