import React, { useState } from 'react';
import { mockStaff } from '../data/mockData';
import { Search, Plus, Phone, Mail, X, Save, DollarSign } from 'lucide-react';
import { UserRole, Staff as StaffType } from '../types';

interface StaffProps {
  role?: UserRole;
}

export const Staff: React.FC<StaffProps> = ({ role }) => {
  const [staffList, setStaffList] = useState<StaffType[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Staff Form State
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

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const createdStaff: StaffType = {
      id: `EMP-${String(staffList.length + 1).padStart(3, '0')}`,
      name: newStaff.name || 'Unknown',
      role: newStaff.role as any,
      email: newStaff.email || '',
      phone: newStaff.phone || '',
      status: 'Active',
      classAssigned: newStaff.role === 'Teacher' ? newStaff.classAssigned : undefined,
      image: `https://picsum.photos/seed/${newStaff.name}staff/200/200`,
      salaryDetails: {
        basic: newStaff.basicSalary,
        allowances: newStaff.allowances,
        deductions: newStaff.deductions,
        net: newStaff.basicSalary + newStaff.allowances - newStaff.deductions
      }
    };
    
    setStaffList([...staffList, createdStaff]);
    setShowAddModal(false);
    setNewStaff({
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
  };

  const netSalary = (newStaff.basicSalary || 0) + (newStaff.allowances || 0) - (newStaff.deductions || 0);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
          <p className="text-slate-500">Directory of teachers, admins, and support staff.</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input 
            type="text" 
            placeholder="Search by name or role..." 
            className="flex-1 outline-none text-sm text-slate-700 min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${staff.role === 'Teacher' ? 'bg-blue-500' : staff.role === 'Admin' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative mb-4 mt-2">
                <img src={staff.image} alt={staff.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                <div className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${staff.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{staff.name}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">{staff.role}</p>
              {staff.classAssigned && (
                 <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-semibold mb-3">Class {staff.classAssigned}</span>
              )}
              
              <div className="w-full space-y-3 mt-2 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <Phone className="w-4 h-4" />
                    </div>
                    <span>{staff.phone}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">{staff.email}</span>
                 </div>
                 {staff.salaryDetails && role === UserRole.ADMIN && (
                   <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                         <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-emerald-600">₹{staff.salaryDetails.net.toLocaleString('en-IN')}/mo</span>
                   </div>
                 )}
              </div>
            </div>
            <div className="bg-slate-50 p-3 flex justify-center border-t border-slate-100">
               <button className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide">View Profile</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">Add Staff Member</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleCreateStaff} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Personal Details</h4>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white">
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                            <option value="Driver">Driver</option>
                            <option value="Clerk">Clerk</option>
                        </select>
                     </div>
                     {newStaff.role === 'Teacher' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Class</label>
                            <input type="text" value={newStaff.classAssigned} onChange={e => setNewStaff({...newStaff, classAssigned: e.target.value})} placeholder="e.g. 5-A" className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                        </div>
                     )}
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                     </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Salary & Compensation</h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Basic Salary (Monthly)</label>
                            <div className="relative">
                               <span className="absolute left-3 top-2 text-slate-400">₹</span>
                               <input required type="number" min="0" value={newStaff.basicSalary || ''} onChange={e => setNewStaff({...newStaff, basicSalary: Number(e.target.value)})} className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Allowances (HRA, TA, etc.)</label>
                            <div className="relative">
                               <span className="absolute left-3 top-2 text-slate-400">₹</span>
                               <input required type="number" min="0" value={newStaff.allowances || ''} onChange={e => setNewStaff({...newStaff, allowances: Number(e.target.value)})} className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Deductions (Tax, PF)</label>
                            <div className="relative">
                               <span className="absolute left-3 top-2 text-slate-400">₹</span>
                               <input required type="number" min="0" value={newStaff.deductions || ''} onChange={e => setNewStaff({...newStaff, deductions: Number(e.target.value)})} className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0" />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                           <span className="font-bold text-slate-700 text-sm">Net Pay</span>
                           <span className="font-black text-emerald-600 text-lg">₹{netSalary.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                   </div>
                 </div>

                 <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                       <Save className="w-4 h-4" /> Create Staff
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};