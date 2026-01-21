
import React, { useState, useEffect } from 'react';
import { UserRole, Student } from '../types';
import { Bell, Search, Menu, X, ShieldCheck, ChevronRight } from 'lucide-react';
import { db } from '../services/persistence';
import { CURRENT_USER_ID } from '../data/mockData';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ role, setRole, toggleMobileMenu }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (role === UserRole.PARENT) {
      db.getAll('students').then(stds => {
        const myChild = stds.find(s => s.parentId === CURRENT_USER_ID) || stds[0];
        setStudent(myChild || null);
      });
    }
  }, [role]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleMobileMenu} className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Menu className="w-5 h-5" /></button>
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-80 group focus-within:w-96 focus-within:bg-white focus-within:border-blue-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-900 w-full placeholder-slate-400" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:block relative">
           <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)} 
              className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider rounded-lg border border-slate-200 px-3 py-1.5 outline-none cursor-pointer pr-8 hover:bg-white transition-colors"
           >
             {Object.values(UserRole).map((r) => <option key={r} value={r}>{r} Mode</option>)}
           </select>
           <ShieldCheck className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div onClick={() => setShowProfile(true)} className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
           <div className="text-right hidden sm:block">
              <p className="text-[13px] font-semibold text-slate-900 leading-none">Jane Doe</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">{role}</p>
           </div>
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
        </div>
      </div>

      {showProfile && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl relative">
               <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                     <img src={student?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'} className="w-20 h-20 rounded-xl object-cover border border-slate-100 shadow-sm" />
                     <div>
                       <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">User Account</p>
                       <h3 className="text-xl font-bold text-slate-900 leading-none mb-1">Jane Doe</h3>
                       <p className="text-[12px] text-slate-500 font-medium">System Role: {role}</p>
                     </div>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="w-full btn-primary py-2.5 rounded-lg text-sm">Close Profile</button>
               </div>
            </div>
         </div>
      )}
    </header>
  );
};

const ProfileItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50">
     <span className="font-semibold text-slate-400 uppercase tracking-widest text-[9px]">{label}</span>
     <span className="font-semibold text-slate-900 text-[13px]">{value || '---'}</span>
  </div>
);
