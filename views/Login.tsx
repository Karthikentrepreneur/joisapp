
import React, { useState } from 'react';
import { UserRole } from '../types';
import { db } from '../services/persistence';
import { Shield, Lock, Phone, Loader2, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any, role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    // 1. Check Hardcoded Credentials (First priority, works even if DB is down)
    if (cleanPhone === '9940455190' && password === 'JO!$@Future') {
      onLogin({ name: 'School Administrator', phone: phoneNumber }, UserRole.ADMIN);
      return;
    }

    if ((cleanPhone === '9363254437' || cleanPhone === '9500001656') && password === 'JO!$@Founder') {
      onLogin({ name: 'School Founder', phone: phoneNumber }, UserRole.FOUNDER);
      return;
    }

    // 2. Check Database for Staff & Students
    try {
      // Fetch concurrently to speed up
      const [staff, students] = await Promise.all([
        db.getAll('staff'),
        db.getAll('students')
      ]);

      // Check Staff
      const teacher = (staff || []).find(s => s && s.phone && s.phone.replace(/\s+/g, '') === cleanPhone && s.password === password);
      if (teacher) {
        onLogin(teacher, UserRole.TEACHER);
        return;
      }

      // Check Students (Parents)
      const student = (students || []).find(s => s && s.parentPhone && s.parentPhone.replace(/\s+/g, '') === cleanPhone && s.password === password);
      if (student) {
        onLogin(student, UserRole.PARENT);
        return;
      }

      setError('Invalid phone number or password. Please try again.');
    } catch (err: any) {
      console.error("Login Pipeline Critical Error:", err);
      setError('Connection error or database failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-slate-100 p-8 md:p-12">
          {/* Logo Branding */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-48 h-24 flex items-center justify-center mb-4">
               <img src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" alt="JOIS Logo" className="w-full h-auto object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Junior Odyssey</h1>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-2">Portal Access</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter registered phone..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4" /> Secure Login</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Authorized access only. By logging in, you agree to our security policies.
            </p>
          </div>
        </div>
        
        <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2025 EduNexus - powered by Gemini</p>
      </div>
    </div>
  );
};
