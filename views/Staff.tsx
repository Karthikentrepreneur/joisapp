
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/persistence';
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
  MapPin,
  Calendar,
  DollarSign,
  Camera,
  GraduationCap,
  Heart,
  Trash2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { UserRole, Staff as StaffType, ProgramType } from '../types';
import { ToastType } from '../components/Toast';

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const ALL_CATEGORIES = [...PROGRAMS];

const STAFF_PROGRAM_CODES: Record<string, string> = {
  'Little Seeds': 'LS',
  'Curiosity Cubs': 'CC',
  'Odyssey Owls': 'OO',
  'Future Makers': 'FM'
};

export const Staff: React.FC<{role?: UserRole, showToast?: (t: string, ty: ToastType, d?: string) => void}> = ({ role, showToast }) => {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | string>('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffType | null>(null);

  const ROLES = ['Teacher', 'Admin', 'Driver', 'Clerk'];

  const initialFormData: Partial<StaffType> = {
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    aadhaarNumber: '',
    email: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    classAssigned: 'Little Seeds',
    maritalStatus: 'Unmarried',
    status: 'Active',
    role: 'Teacher',
    image: '',
    emergencyContact: {
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
      phone: ''
    },
    salaryDetails: {
      basic: 0,
      allowances: 0,
      deductions: 0,
      net: 0
    }
  };

  const [formData, setFormData] = useState<Partial<StaffType>>(initialFormData);

  const loadData = async () => {
    setLoading(true);
    const data = await db.getAll('staff');
    setStaffList(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const generateStaffId = (program: string, currentStaff: StaffType[]) => {
    const code = STAFF_PROGRAM_CODES[program] || 'GP';
    const programStaff = currentStaff.filter(s => s.classAssigned === program);
    
    let maxNum = 0;
    programStaff.forEach(s => {
      const match = s.id.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    
    const nextNum = maxNum + 1;
    const suffix = nextNum.toString().padStart(2, '0');
    return `EMP-${code}-${suffix}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `${formData.id || 'new_staff'}_${timestamp}_${file.name}`;
      const imageUrl = await db.uploadFile('staff', fileName, file);
      
      setFormData(prev => ({ ...prev, image: imageUrl }));
      showToast?.("Photo Uploaded", "success", "Staff profile photo is ready.");
    } catch (err) {
      console.error("Staff upload error:", err);
      showToast?.("Upload Failed", "error", "Could not process image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const staffName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      const basic = Number(formData.salaryDetails?.basic || 0);
      const allowances = Number(formData.salaryDetails?.allowances || 0);
      const deductions = Number(formData.salaryDetails?.deductions || 0);
      const netSalary = basic + allowances - deductions;

      if (isEditing && formData.id) {
        await db.update('staff', formData.id, {
          ...formData,
          name: staffName,
          salaryDetails: {
            ...(formData.salaryDetails || { basic: 0, allowances: 0, deductions: 0, net: 0 }),
            net: netSalary
          }
        });
        showToast?.("Staff Updated", "success", `${staffName}'s profile updated.`);
      } else {
        const currentList = await db.getAll('staff');
        const program = formData.classAssigned || PROGRAMS[0];
        const staffId = generateStaffId(program, currentList);
        
        const newStaff: StaffType = {
          ...formData as any,
          id: staffId,
          name: staffName,
          image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffId}`,
          salaryDetails: {
            ...(formData.salaryDetails || { basic: 0, allowances: 0, deductions: 0, net: 0 }),
            net: netSalary
          }
        };
        await db.create('staff', newStaff);
        showToast?.("Personnel Onboarded", "success", `${newStaff.name} registered as ${staffId}.`);
      }
      setShowFormModal(false);
      setIsEditing(false);
      loadData();
    } catch (err) {
      showToast?.("Action Failed", "error", "Process error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    setSaving(true);
    try {
      await db.delete('staff', staffToDelete.id);
      showToast?.("Staff Record Deleted", "info", `${staffToDelete.name} has been removed from the system.`);
      setShowDeleteConfirm(false);
      setSelectedStaff(null);
      setStaffToDelete(null);
      loadData();
    } catch (err) {
      showToast?.("Deletion Failed", "error", "Could not remove the staff record.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (staff: StaffType) => {
    setFormData({ ...staff });
    setIsEditing(true);
    setShowFormModal(true);
    setSelectedStaff(null);
  };

  const filteredStaff = staffList.filter(s => {
    const nameStr = s.name || '';
    const idStr = s.id || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          idStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || s.classAssigned === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const isAdmin = role === UserRole.ADMIN;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-5 border-b border-slate-200 bg-slate-50/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-none tracking-tight">Staff Hub</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{filteredStaff.length} Employees in View</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-medium outline-none focus:border-slate-900 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => { 
                const newFormData = { ...initialFormData };
                if (activeCategory !== 'All' && PROGRAMS.includes(activeCategory as ProgramType)) {
                  newFormData.classAssigned = activeCategory;
                }
                setFormData(newFormData); 
                setIsEditing(false); 
                setShowFormModal(true); 
              }}
              className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-1.5 border-b border-slate-200 flex items-center gap-6 bg-white overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${
            activeCategory === 'All' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          All Staff
        </button>
        {ALL_CATEGORIES.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${
              activeCategory === cat ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-900" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Accessing Directory</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="pl-5 pr-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">#</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                <th className="pl-3 pr-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((s, idx) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedStaff(s)}
                  className="sheet-row group cursor-pointer"
                >
                  <td className="pl-5 pr-3 py-3.5 text-[11px] text-slate-300 font-bold text-center">{idx + 1}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={s.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`} className="w-9 h-9 rounded-lg border border-slate-100 bg-slate-50 object-cover" />
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase">{s.id}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">{s.role}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{s.classAssigned}</span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      s.status === 'Active' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    <button className="p-1.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center border border-slate-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Employee Profile</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedStaff.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-start gap-6">
                <img src={selectedStaff.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStaff.id}`} className="w-24 h-24 rounded-2xl border border-slate-100 shadow-md object-cover" />
                <div className="space-y-3 flex-1">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{selectedStaff.name}</h2>
                    <p className="text-blue-600 font-bold uppercase tracking-wider text-[10px] mt-1">{selectedStaff.role} • {selectedStaff.status}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailBlock label="Program" value={selectedStaff.classAssigned || 'N/A'} />
                    <DetailBlock label="Joined" value={selectedStaff.dateOfJoining} />
                    <DetailBlock label="Aadhaar" value={selectedStaff.aadhaarNumber || 'PENDING'} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <section className="space-y-3">
                  <h4 className="flex items-center gap-2 text-[10px] font-extrabold text-slate-900 uppercase tracking-widest mb-3">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Professional
                  </h4>
                  <div className="space-y-3">
                    <InfoRow label="Work Email" value={selectedStaff.email} />
                    <InfoRow label="Phone" value={selectedStaff.phone} />
                    <InfoRow label="Payroll Grade" value={selectedStaff.role} />
                    {selectedStaff.salaryDetails && (
                      <div className="pt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Net Pay</p>
                        <p className="text-base font-extrabold text-emerald-600 tracking-tight">₹{selectedStaff.salaryDetails.net.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="flex items-center gap-2 text-[10px] font-extrabold text-slate-900 uppercase tracking-widest mb-3">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Emergency
                  </h4>
                  <div className="space-y-3">
                    <InfoRow label="Person" value={`${selectedStaff.emergencyContact?.firstName || ''} ${selectedStaff.emergencyContact?.lastName || ''}`.trim() || 'N/A'} />
                    <InfoRow label="Relationship" value={selectedStaff.emergencyContact?.relationship || 'N/A'} />
                    <InfoRow label="Emergency Phone" value={selectedStaff.emergencyContact?.phone || 'N/A'} />
                  </div>
                </section>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              {isAdmin && (
                <button 
                  onClick={() => { setStaffToDelete(selectedStaff); setShowDeleteConfirm(true); }}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-all flex items-center gap-2 mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Record
                </button>
              )}
              <button onClick={() => setSelectedStaff(null)} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors">Close</button>
              {isAdmin && (
                <button 
                  onClick={() => openEdit(selectedStaff)}
                  className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
             <div className="p-8 text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 text-rose-600">Delete Record?</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">You are about to remove <span className="font-bold text-slate-900">{staffToDelete?.name}</span>. This will purge their employment history and payroll data. This action is final.</p>
             </div>
             <div className="bg-slate-50 p-4 flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-xs font-bold uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirm Delete</button>
             </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{isEditing ? 'Update Personnel' : 'Personnel Onboarding'}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workforce & Payroll</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION: PHOTO & IDENTITY */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Identification & Profile Photo</h4>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-start mb-6">
                   <div className="relative group shrink-0 mx-auto md:mx-0">
                      <div className={`w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center transition-all ${uploadingImage ? 'opacity-50' : 'group-hover:opacity-90'}`}>
                         {formData.image ? (
                           <img src={formData.image} className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-12 h-12 text-slate-300" />
                         )}
                         {uploadingImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                               <Loader2 className="w-8 h-8 animate-spin text-white" />
                            </div>
                         )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-all border-4 border-white active:scale-90"
                      >
                         <Camera className="w-4 h-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*" 
                      />
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-2 gap-4 flex-1 w-full">
                      <FormField label="First Name" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                      <FormField label="Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                      <FormField label="Middle Name" value={formData.middleName} onChange={(v: string) => setFormData({...formData, middleName: v})} />
                      <FormField label="Aadhaar" required value={formData.aadhaarNumber} onChange={(v: string) => setFormData({...formData, aadhaarNumber: v})} />
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Role & Placement</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Assigned Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <FormField label="Joining Date" type="date" required value={formData.dateOfJoining} onChange={(v: string) => setFormData({...formData, dateOfJoining: v})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Assigned Program</label>
                    <select 
                      value={formData.classAssigned} 
                      onChange={e => setFormData({...formData, classAssigned: e.target.value})} 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900"
                    >
                      {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Marital Status</label>
                    <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900">
                      <option value="Unmarried">Unmarried</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Personal Phone" required value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                  <FormField label="Work Email" type="email" required value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                </div>
              </section>

              {/* SECTION: EMERGENCY */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Emergency Protocol</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="EC First Name" 
                    required
                    placeholder="Contact First Name"
                    value={formData.emergencyContact?.firstName} 
                    onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {firstName:'',lastName:'',relationship:'',phone:''}), firstName: v}})} 
                  />
                  <FormField 
                    label="EC Last Name" 
                    required
                    placeholder="Contact Last Name"
                    value={formData.emergencyContact?.lastName} 
                    onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {firstName:'',lastName:'',relationship:'',phone:''}), lastName: v}})} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="Relationship" 
                    required
                    placeholder="e.g. Spouse, Parent"
                    value={formData.emergencyContact?.relationship} 
                    onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {firstName:'',lastName:'',relationship:'',phone:''}), relationship: v}})} 
                  />
                  <FormField 
                    label="Contact Number" 
                    required
                    placeholder="Emergency Phone"
                    value={formData.emergencyContact?.phone} 
                    onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {firstName:'',lastName:'',relationship:'',phone:''}), phone: v}})} 
                  />
                </div>
              </section>

              {/* SECTION: FINANCIAL */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Financial (₹)</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Basic" type="number" value={formData.salaryDetails?.basic} onChange={(v: string) => setFormData({...formData, salaryDetails: { ...(formData.salaryDetails || { basic: 0, allowances: 0, deductions: 0, net: 0 }), basic: Number(v) }})} />
                  <FormField label="Allowances" type="number" value={formData.salaryDetails?.allowances} onChange={(v: string) => setFormData({...formData, salaryDetails: { ...(formData.salaryDetails || { basic: 0, allowances: 0, deductions: 0, net: 0 }), allowances: Number(v) }})} />
                  <FormField label="Deductions" type="number" value={formData.salaryDetails?.deductions} onChange={(v: string) => setFormData({...formData, salaryDetails: { ...(formData.salaryDetails || { basic: 0, allowances: 0, deductions: 0, net: 0 }), deductions: Number(v) }})} />
                </div>
              </section>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowFormModal(false)} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={saving || uploadingImage}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isEditing ? 'Save Changes' : 'Confirm Onboarding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailBlock = ({ label, value }: { label: string, value: string | number }) => (
  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-[11px] font-bold text-slate-700 leading-none">{value}</p>
  </div>
);

const InfoRow = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
    <p className="text-[12px] font-bold text-slate-800 leading-tight">{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium truncate">{sub}</p>}
  </div>
);

const FormField = ({ label, required, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label} {required && '*'}</label>
    <input 
      type={type} 
      required={required} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900 transition-all placeholder:text-slate-300" 
      placeholder={placeholder || label}
    />
  </div>
);
