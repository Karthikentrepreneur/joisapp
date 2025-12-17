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
  FileText,
  Briefcase,
  Settings,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  role: UserRole;
  permissions: Record<UserRole, View[]>;
  onChangeView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, role, permissions, onChangeView }) => {
  
  const allMenuItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: View.STUDENTS, label: 'Students', icon: Users },
    { view: View.STAFF, label: 'Staff Directory', icon: Briefcase },
    { view: View.ACADEMICS, label: 'Academics', icon: GraduationCap },
    { view: View.ATTENDANCE, label: 'Attendance', icon: CalendarCheck },
    { view: View.LEAVE, label: 'Leave Management', icon: CalendarDays },
    { view: View.FEES, label: 'Fees & Finance', icon: CreditCard },
    { view: View.TRANSPORT, label: 'Transport & GPS', icon: Bus },
    { view: View.SAFETY, label: 'Safety & CCTV', icon: ShieldCheck },
    { view: View.COMMUNICATION, label: 'Communication', icon: MessageSquare },
    { view: View.DOCUMENTS, label: 'Documents', icon: FileText },
    // Removed AI Assistant from menu items
    { view: View.SETTINGS, label: 'Settings', icon: Settings },
  ];

  // Filter items based on the permissions object for the current role
  const allowedViews = permissions[role] || [];
  const filteredItems = allMenuItems.filter(item => allowedViews.includes(item.view));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col z-10 shadow-sm">
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <button 
          onClick={() => onChangeView(View.DASHBOARD)}
          className="flex flex-col items-center hover:opacity-80 transition-opacity focus:outline-none w-full"
          title="Go to Dashboard"
        >
          <img 
            src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" 
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
         <div className="text-[10px] text-slate-400 text-center">
            v2.4.1 • EduNexus Systems
         </div>
      </div>
    </aside>
  );
};