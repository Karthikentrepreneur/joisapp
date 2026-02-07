
import React, { useState, useEffect } from 'react';
import { UserRole, Student, Staff } from '../types';
import { Bell, Search, Menu, X, ShieldCheck, ChevronRight, LogOut, Key, Save, Loader2 } from 'lucide-react';
import { db } from '../services/persistence';
import { CURRENT_USER_ID } from '../data/mockData';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleMobileMenu: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ role, setRole, toggleMobileMenu, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('JOIS_AUTH_SESSION');
    if (session) {
      setUserProfile(JSON.parse(session).user);
    }
  }, [showProfile]);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsUpdating(true);
    try {
      const collection = role === UserRole.PARENT ? 'students' : 'staff';
      await db.update(collection, userProfile.id, { password: newPassword });
      
      // Update local session
      const updatedUser = { ...userProfile, password: newPassword };
      setUserProfile(updatedUser);
      localStorage.setItem('JOIS_AUTH_SESSION', JSON.stringify({ user: updatedUser, role }));
      
      alert("Password updated successfully!");
      setNewPassword('');
    } catch (e) {
      alert("Failed to update password.");
    } finally {
      setIsUpdating(false);
    }
  };

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
              <p className="text-[13px] font-semibold text-slate-900 leading-none truncate max-w-[120px]">{userProfile?.name || userProfile?.firstName || 'User'}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">{role}</p>
           </div>
           <img src={userProfile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.id || 'Jane'}`} alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
        </div>
      </div>

      {showProfile && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
               <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-full transition-colors border border-slate-50"><X className="w-5 h-5" /></button>
               
               <div className="space-y-8">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                     <img src={userProfile?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm" />
                     <div className="flex-1">
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">User Account</p>
                       <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{userProfile?.name || userProfile?.firstName}</h3>
                       <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{role} Level Access</p>
                     </div>
                  </div>

                  {/* Security Section for Teachers and Parents */}
                  {(role === UserRole.TEACHER || role === UserRole.PARENT) && (
                    <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" /> Security & Privacy
                      </h4>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Change Password</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="New password..." 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                            />
                            <button 
                              onClick={handleUpdatePassword}
                              disabled={isUpdating}
                              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Update
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setShowProfile(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Close Profile</button>
                    <button onClick={onLogout} className="flex-1 bg-rose-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 flex items-center justify-center gap-2 hover:bg-rose-600 transition-all active:scale-95">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </header>
  );
};
