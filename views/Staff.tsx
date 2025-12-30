import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { Search, Plus, Phone, Mail, X, Save, Loader2 } from 'lucide-react';
import { UserRole, Staff as StaffType } from '../types';

interface StaffProps {
  role?: UserRole;
}

export const Staff: React.FC<StaffProps> = ({ role }) => {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newStaff, setNewStaff] = useState<Partial<StaffType> & { basicSalary: number, allowances: number, deductions: number }>({
    name: '',
    role: 'Teacher',
    email: '',
    phone: '',
    status: 'Active',
    classAssigned: '',
    basicSalary: 0,
    allowances: 0,
    deductions: 0
  });

  const loadStaff = async () => {
    setLoading(true);
    const data = await db.getAll('staff');
    setStaffList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
    const sub = db.subscribe('staff', loadStaff);
    return () => { sub.unsubscribe(); };
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: StaffType = {
      id: `EMP-${String(staffList.length + 1).padStart(3, '0')}`,
      name: newStaff.name || '',
      role: newStaff.role as any,
      email: newStaff.email || '',
      phone: newStaff.phone || '',
      status: 'Active',
      image: `https://picsum.photos/seed/${newStaff.name}/200/200`,
      salaryDetails: {
        basic: newStaff.basicSalary,
        allowances: newStaff.allowances,
        deductions: newStaff.deductions,
        net: newStaff.basicSalary + newStaff.allowances - newStaff.deductions
      }
    };
    await db.create('staff', created);
    setShowAddModal(false);
    loadStaff();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Staff Management</h2><p className="text-slate-500">Directory of school educators and admins.</p></div>
        {role === UserRole.ADMIN && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"><Plus className="w-4 h-4" /> Add Staff Member</button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400" />
        <input type="text" placeholder="Search staff members..." className="flex-1 outline-none text-sm bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
           <Mail className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <p className="font-bold">The staff directory is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(staff => (
            <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col items-center relative group hover:shadow-xl transition-all">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${staff.role === 'Teacher' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              <img src={staff.image} className="w-20 h-20 rounded-full mb-4 border-2 border-slate-50 group-hover:scale-110 transition-transform" />
              <h3 className="font-black text-slate-800">{staff.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{staff.role}</p>
              <div className="w-full mt-4 pt-4 border-t border-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tight"><Phone className="w-3.5 h-3.5" /> {staff.phone}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tight"><Mail className="w-3.5 h-3.5" /> <span className="truncate">{staff.email}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-900">Add Staff Member</h3><button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleCreateStaff} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label><input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-50" /></div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Role</label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white"><option value="Teacher">Teacher</option><option value="Admin">Admin</option></select></div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email</label><input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white" /></div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Compensation</h4>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Basic Salary (₹)</label><input type="number" value={newStaff.basicSalary || ''} onChange={e => setNewStaff({...newStaff, basicSalary: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Allowances (₹)</label><input type="number" value={newStaff.allowances || ''} onChange={e => setNewStaff({...newStaff, allowances: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                       </div>
                    </div>
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3"><button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl text-slate-400 font-black uppercase tracking-widest text-xs">Cancel</button><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2"><Save className="w-4 h-4" /> Save Record</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
