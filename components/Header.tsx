import React from 'react';
import { UserRole } from '../types';
import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ role, setRole, toggleMobileMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-slate-500 hover:text-slate-700">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search students, fees..." 
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Role Switcher for Demo Purposes */}
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs md:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>{r} View</option>
          ))}
        </select>

        <button className="relative p-2 rounded-full hover:bg-slate-50 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800">Jane Doe</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
          <img 
            src="https://picsum.photos/100/100" 
            alt="Profile" 
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" 
          />
        </div>
      </div>
    </header>
  );
};
