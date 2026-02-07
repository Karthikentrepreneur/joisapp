
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../services/persistence';
/* Added missing CheckCircle2 import */
import { 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Briefcase,
  MoreHorizontal,
  Mail,
  Phone,
  UserCheck,
  CreditCard,
  User,
  ShieldAlert,
  Edit,
  Save,
  Camera,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Filter,
  Calendar,
  Fingerprint,
  Heart,
  Users,
  ShieldCheck,
  Award,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { UserRole, Staff as StaffType, ProgramType } from '../types';
import { ToastType } from '../components/Toast';

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const ROLES = ['Teacher', 'Admin', 'Driver', 'Clerk', 'Principal'];
const MARITAL_STATUS = ['Married', 'Unmarried'];

interface StaffProps {
  role?: UserRole;
  showToast?: (t: string, ty: ToastType, d?: string) => void;
}

const SummaryStat = ({ icon: Icon, label, value, color, trend }: any) => (
  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0 min-w-[160px] flex-1">
     <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color} text-white shadow-sm`}>
       <Icon className="w-4.5 h-4.5" />
     </div>
     <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 leading-none">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-base font-bold text-slate-900 leading-none">{value}</p>
          {trend && <span className="text-[8px] font-bold text-emerald-500">{trend}</span>}
        </div>
     </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }: { label: string, value: string | undefined | number, icon?: any }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate">{value || "—"}</p>
    </div>
  </div>
);

const Input = ({ label, required, value, onChange, type = "text", placeholder, options }: any) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {options ? (
      <select 
        value={value || ''} 
        required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
      >
        <option value="" disabled>Select {label}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        required={required} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm" 
        placeholder={placeholder || `Enter ${label}`}
      />
    )}
  </div>
);

export const Staff: React.FC<StaffProps> = ({ role, showToast }) => {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | string>('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = role === UserRole.ADMIN;

  const initialFormData: Partial<StaffType> = {
    firstName: '', middleName: '', lastName: '', phone: '', aadhaarNumber: '', email: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    classAssigned: 'Little Seeds', maritalStatus: 'Unmarried', status: 'Active', role: 'Teacher', 
    image: '', emergencyContact: { firstName: '', lastName: '', relationship: '', phone: '' }
  };

  const [formData, setFormData] = useState<Partial<StaffType>>(initialFormData);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('staff');
      setStaffList(data || []);
    } catch (e) {
      console.error("Staff fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'All' || s.role === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [staffList, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: staffList.length,
      teachers: staffList.filter(s => s.role === 'Teacher').length,
      active: staffList.filter(s => s.status === 'Active').length
    };
  }, [staffList]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${formData.firstName || ''} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName || ''}`.replace(/\s+/g, ' ').trim();
      
      const payload = {
        ...formData,
        name: fullName,
      };

      if (isEditing && formData.id) {
        await db.update('staff', formData.id, payload);
        showToast?.("Staff Profile Updated", "success", `${fullName}'s record saved.`);
      } else {
        const staffId = `EMP${Date.now().toString().slice(-6)}`;
        const newStaff: StaffType = {
          ...payload as any,
          id: staffId,
          image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffId}`,
        };
        await db.create('staff', newStaff);
        showToast?.("New Staff Registered", "success", `${fullName} added to system.`);
      }
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.("Error", "error", "Failed to save staff data.");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!formData.id) return;
    try {
      await db.delete('staff', formData.id);
      showToast?.("Staff Removed", "info", "Record deleted from database.");
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.("Error", "error", "Deletion failed.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 animate-in fade-in duration-300 min-h-full pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-0.5 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Professional Staff
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredStaff.length} Employees found</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full pl-8.5 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => { setFormData(initialFormData); setIsEditing(false); setShowFormModal(true); }}
                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 hover:bg-black transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Add Staff</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Filters & Summary */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-3 flex-1 overflow-x-auto no-scrollbar">
            <SummaryStat icon={Users} label="Total Workforce" value={stats.total} color="bg-blue-600" />
            <SummaryStat icon={Award} label="Teaching Staff" value={stats.teachers} color="bg-indigo-600" />
            <SummaryStat icon={ShieldCheck} label="Active Duty" value={stats.active} color="bg-emerald-600" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveFilter('All')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === 'All' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                All
              </button>
              {ROLES.map(r => (
                <button 
                  key={r} 
                  onClick={() => setActiveFilter(r)} 
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === r ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {r}s
                </button>
              ))}
            </div>
            
            <div className="md:hidden flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-700 outline-none appearance-none shadow-sm"
              >
                <option value="All">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}s</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Workforce...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-16 text-center p-8">
              <Briefcase className="w-10 h-10 text-slate-100 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No staff found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3 w-10 text-center">#</th>
                    <th className="px-5 py-3">Employee Name</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Role / Class</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Joining</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStaff.map((s, idx) => (
                    <tr 
                      key={s.id} 
                      onClick={() => setSelectedStaff(s)} 
                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-2.5 text-xs text-slate-300 font-bold text-center">{idx + 1}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <img src={s.image} className="w-8 h-8 rounded-lg border border-slate-100 object-cover shadow-sm" alt="Avatar" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{s.name}</p>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">EMP: {s.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1">{s.role}</span>
                          <span className="text-[9px] text-slate-400 font-medium">{s.classAssigned || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                          s.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="text-xs font-bold text-slate-800">{s.dateOfJoining}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-blue-500 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Staff Detailed Profile Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Professional Employee Record
              </h3>
              <button onClick={() => setSelectedStaff(null)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><X className="w-4.5 h-4.5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-white">
              {/* Profile Header */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={selectedStaff.image} className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt="Avatar" />
                  <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${selectedStaff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">{selectedStaff.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{selectedStaff.role}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">UID: {selectedStaff.id}</span>
                  </div>
                </div>
              </div>

              {/* Administrative Details */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <Briefcase className="w-3 h-3" /> Professional Assignment
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   <DetailItem label="Class Assigned" value={selectedStaff.classAssigned} icon={Award} />
                   <DetailItem label="Date of Joining" value={selectedStaff.dateOfJoining} icon={Calendar} />
                   <DetailItem label="Status" value={selectedStaff.status} icon={ShieldCheck} />
                   <DetailItem label="Email" value={selectedStaff.email} icon={Mail} />
                   <DetailItem label="Phone" value={selectedStaff.phone} icon={Phone} />
                   <DetailItem label="Aadhaar No." value={selectedStaff.aadhaarNumber} icon={Fingerprint} />
                </div>
              </section>

              {/* Personal Details */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <User className="w-3 h-3" /> Personal Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   <DetailItem label="Marital Status" value={selectedStaff.maritalStatus} icon={Heart} />
                   <DetailItem label="Basic Salary" value={`₹${selectedStaff.salaryDetails?.basic?.toLocaleString() || '—'}`} icon={Wallet} />
                   <DetailItem label="Net Pay" value={`₹${selectedStaff.salaryDetails?.net?.toLocaleString() || '—'}`} icon={Wallet} />
                </div>
              </section>

              {/* Emergency Contact */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <ShieldAlert className="w-3 h-3" /> Emergency Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                   <DetailItem label="Contact Person" value={`${selectedStaff.emergencyContact?.firstName} ${selectedStaff.emergencyContact?.lastName}`} icon={User} />
                   <DetailItem label="Relationship" value={selectedStaff.emergencyContact?.relationship} icon={Heart} />
                   <DetailItem label="Emergency Phone" value={selectedStaff.emergencyContact?.phone} icon={Phone} />
                </div>
              </section>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
               <button onClick={() => setSelectedStaff(null)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-700 transition-colors">Close View</button>
               {isAdmin && (
                  <button onClick={() => { setFormData({ ...selectedStaff }); setIsEditing(true); setShowFormModal(true); setSelectedStaff(null); }} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Enrollment Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 max-h-[95vh]">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{isEditing ? 'Modify Staff Profile' : 'Register New Staff'}</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar bg-white">
               {/* Section 1: Professional Profile */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Professional Record</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="First Name" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                    <Input label="Middle Name" value={formData.middleName} onChange={(v: string) => setFormData({...formData, middleName: v})} />
                    <Input label="Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Input label="Role" options={ROLES} required value={formData.role} onChange={(v: string) => setFormData({...formData, role: v as any})} />
                    <Input label="Class Assignment" options={PROGRAMS} value={formData.classAssigned} onChange={(v: string) => setFormData({...formData, classAssigned: v})} />
                    <Input label="Joining Date" type="date" required value={formData.dateOfJoining} onChange={(v: string) => setFormData({...formData, dateOfJoining: v})} />
                  </div>
               </section>

               {/* Section 2: Personal & Contact */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Personal & Contact Info</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Phone Number" required value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                    <Input label="Email Address" type="email" required value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                    <Input label="Aadhaar Number" required value={formData.aadhaarNumber} onChange={(v: string) => setFormData({...formData, aadhaarNumber: v})} />
                    <Input label="Marital Status" options={MARITAL_STATUS} value={formData.maritalStatus} onChange={(v: string) => setFormData({...formData, maritalStatus: v as any})} />
                  </div>
               </section>

               {/* Section 3: Emergency & Security */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Emergency & Security</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Emergency Contact F.Name" required value={formData.emergencyContact?.firstName} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, firstName: v}})} />
                    <Input label="Relationship" required value={formData.emergencyContact?.relationship} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, relationship: v}})} />
                    <Input label="Emergency Phone" required value={formData.emergencyContact?.phone} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, phone: v}})} />
                  </div>
               </section>
               
               {isEditing && isAdmin && (
                 <section className="pt-4 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest p-2 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" /> De-register Staff Member
                    </button>
                 </section>
               )}
            </form>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
               <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-700 transition-colors">Discard</button>
               <button type="submit" onClick={handleFormSubmit} disabled={saving} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all hover:bg-black">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {isEditing ? 'Update Record' : 'Register Staff'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Remove Staff?</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
              This action will remove the employee from active records and historical logs.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 border border-slate-200 transition-all">Keep</button>
              <button onClick={executeDelete} className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
