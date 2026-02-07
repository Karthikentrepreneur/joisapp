
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/persistence';
import { 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Save,
  User,
  Users,
  Home,
  Edit,
  Trash2,
  Activity,
  Lock,
  ChevronRight,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  UserPlus,
  ShieldCheck,
  Droplets,
  Bus,
  ShieldAlert,
  Heart,
  Key
} from 'lucide-react';
import { UserRole, Student, ProgramType, AttendanceLog } from '../types';
import { ToastType } from '../components/Toast';

interface StudentsProps {
  role?: UserRole;
  showToast?: (t: string, ty: ToastType, d?: string) => void;
  initialFilter?: 'All' | ProgramType;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const OFFERS = ['Regular', 'Early Bird Offer', 'Vijayadasami', 'New Year', 'Bridge Course'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

const Input = ({ label, required, value, onChange, type = "text", placeholder, options, readOnly }: any) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {options ? (
      <select 
        value={value || ''} 
        required={required}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none disabled:opacity-70"
      >
        <option value="" disabled>Select {label}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        required={required} 
        value={value || ''} 
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)} 
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm read-only:opacity-70" 
        placeholder={placeholder || `Enter ${label}`}
      />
    )}
  </div>
);

export const Students: React.FC<StudentsProps> = ({ role, showToast, initialFilter = 'All' }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | ProgramType>(initialFilter);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = role === UserRole.ADMIN;

  useEffect(() => { setActiveFilter(initialFilter); }, [initialFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, allLogs] = await Promise.all([
        db.getAll('students'),
        db.getAll('attendanceLogs')
      ]);
      setStudents(allStudents);
      setAttendanceLogs(allLogs);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [role]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = activeFilter === 'All' || s.program === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [students, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const relevantIds = new Set(filteredStudents.map(s => s.id));
    const presentToday = attendanceLogs.filter(l => 
      l.date === today && relevantIds.has(l.studentId) && (l.status === 'Present' || l.status === 'Late')
    ).length;
    const unpaid = filteredStudents.filter(s => s.feesStatus !== 'Paid').length;
    return { total: filteredStudents.length, present: presentToday, unpaid };
  }, [filteredStudents, attendanceLogs]);

  // Helper to generate a random 8-character password
  const generatePassword = () => {
    return Math.random().toString(36).slice(-8).toUpperCase();
  };

  const initialFormData: Partial<Student> = {
    firstName: '', middleName: '', lastName: '', dob: '', bloodGroup: 'O+',
    motherName: '', motherEmail: '', fatherName: '', fatherEmail: '',
    parentPhone: '', parentEmail: '', address: '', program: 'Little Seeds',
    dateOfJoining: new Date().toISOString().split('T')[0], offer: 'Regular',
    feesStatus: 'Pending', busRoute: 'Self Pickup', image: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    password: generatePassword() // Auto-generate on creation
  };

  const [formData, setFormData] = useState<Partial<Student>>(initialFormData);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) setShowSaveConfirm(true);
    else executeSave();
  };

  const executeSave = async () => {
    setSaving(true);
    setShowSaveConfirm(false);
    try {
      const fullName = `${formData.firstName || ''} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName || ''}`.replace(/\s+/g, ' ').trim();
      
      const payload = {
        ...formData,
        name: fullName,
        parentEmail: formData.parentEmail || formData.motherEmail || formData.fatherEmail
      };

      if (isEditing && formData.id) {
        await db.update('students', formData.id, payload);
        showToast?.("Profile Updated", "success", `${fullName}'s record has been saved.`);
      } else {
        const studentId = `ST${Date.now().toString().slice(-6)}`;
        const newStudent: Student = {
          ...payload as any,
          id: studentId,
          image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
          attendance: 100,
          parentId: `PAR-${studentId}`
        };
        await db.create('students', newStudent);
        showToast?.("Student Enrolled", "success", `${fullName} is now in the directory. Initial Password: ${newStudent.password}`);
      }
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.("Error", "error", "Failed to save student data.");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!formData.id) return;
    setDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await db.delete('students', formData.id);
      showToast?.("Record Removed", "info", "Student has been deleted from records.");
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.("Error", "error", "Deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 animate-in fade-in duration-300 min-h-full pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-0.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Student Directory
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Records found</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search name or ID..." 
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
                <Plus className="w-3.5 h-3.5" /> <span>Enroll Student</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Filters & Summary */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-3 flex-1 overflow-x-auto no-scrollbar">
            <SummaryStat icon={UserPlus} label="New Enrollment" value={stats.total} color="bg-blue-600" trend="+12%" />
            <SummaryStat icon={CheckCircle2} label="Present" value={stats.present} color="bg-emerald-600" trend="98%" />
            <SummaryStat icon={CreditCard} label="Fee Dues" value={stats.unpaid} color="bg-orange-500" trend="-4%" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveFilter('All')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === 'All' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                All
              </button>
              {PROGRAMS.map(prog => (
                <button 
                  key={prog} 
                  onClick={() => setActiveFilter(prog)} 
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === prog ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {prog}
                </button>
              ))}
            </div>
            
            <div className="md:hidden flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-700 outline-none appearance-none shadow-sm"
              >
                <option value="All">All Courses</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Students List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center p-8">
              <Users className="w-10 h-10 text-slate-100 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records match your search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3 w-10 text-center">#</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Class</th>
                    <th className="px-5 py-3 text-center">Fees</th>
                    <th className="px-5 py-3 text-center">Attd.</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s, idx) => (
                    <tr 
                      key={s.id} 
                      onClick={() => setSelectedStudent(s)} 
                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-2.5 text-xs text-slate-300 font-bold text-center">{idx + 1}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <img src={s.image} className="w-8 h-8 rounded-lg border border-slate-100 object-cover shadow-sm" alt="Avatar" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{s.name}</p>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">ID: {s.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 hidden sm:table-cell">
                        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50/50 px-2 py-0.5 rounded">{s.program}</span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                          s.feesStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {s.feesStatus}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="text-xs font-bold text-slate-800">{s.attendance}%</span>
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

      {/* Comprehensive Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Complete Student Profile
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><X className="w-4.5 h-4.5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-white">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={selectedStudent.image} className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt="Avatar" />
                  <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${selectedStudent.attendance > 90 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">{selectedStudent.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{selectedStudent.program}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">UID: {selectedStudent.id}</span>
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <Calendar className="w-3 h-3" /> Academic & Personal
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   <DetailItem label="Date of Birth" value={selectedStudent.dob} icon={Calendar} />
                   <DetailItem label="Blood Group" value={selectedStudent.bloodGroup} icon={Droplets} />
                   <DetailItem label="Joining Date" value={selectedStudent.dateOfJoining} icon={UserPlus} />
                   <DetailItem label="Offer Type" value={selectedStudent.offer} icon={Activity} />
                   <DetailItem label="Bus Route" value={selectedStudent.busRoute} icon={MapPin} />
                   <DetailItem label="Attendance" value={`${selectedStudent.attendance}%`} icon={CheckCircle2} />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <Lock className="w-3 h-3" /> Account Access
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                   <DetailItem label="Portal Username" value={selectedStudent.parentPhone} icon={Phone} />
                   <DetailItem label="Current Password" value={selectedStudent.password || 'Not Set'} icon={Key} />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <Home className="w-3 h-3" /> Guardian Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                   <DetailItem label="Mother's Name" value={selectedStudent.motherName} icon={User} />
                   <DetailItem label="Father's Name" value={selectedStudent.fatherName} icon={User} />
                   <DetailItem label="Parent Email" value={selectedStudent.parentEmail || selectedStudent.fatherEmail} icon={Mail} />
                   <DetailItem label="Contact Phone" value={selectedStudent.parentPhone} icon={Phone} />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                   <AlertCircle className="w-3 h-3" /> Emergency & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                   <DetailItem label="Emergency Contact" value={selectedStudent.emergencyContact?.name} icon={User} />
                   <DetailItem label="Relationship" value={selectedStudent.emergencyContact?.relationship} icon={HelpCircle} />
                   <DetailItem label="Emergency Phone" value={selectedStudent.emergencyContact?.phone} icon={Phone} />
                </div>
                <div className="mt-4">
                   <DetailItem label="Permanent Address" value={selectedStudent.address} icon={MapPin} />
                </div>
              </section>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
               <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-700 transition-colors">Close View</button>
               {isAdmin && (
                  <button onClick={() => { setFormData({ ...selectedStudent }); setIsEditing(true); setShowFormModal(true); setSelectedStudent(null); }} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
                    <Edit className="w-3.5 h-3.5" /> Edit Record
                  </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 max-h-[95vh]">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{isEditing ? 'Modify Student Record' : 'Enroll New Student'}</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar bg-white">
               {/* Section 1: Basic Information */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Student Profile</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="First Name" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                    <Input label="Middle Name" value={formData.middleName} onChange={(v: string) => setFormData({...formData, middleName: v})} />
                    <Input label="Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Input label="Date of Birth" type="date" required value={formData.dob} onChange={(v: string) => setFormData({...formData, dob: v})} />
                    <Input label="Blood Group" options={BLOOD_GROUPS} value={formData.bloodGroup} onChange={(v: string) => setFormData({...formData, bloodGroup: v})} />
                    <Input label="Program" options={PROGRAMS} required value={formData.program} onChange={(v: string) => setFormData({...formData, program: v as any})} />
                  </div>
               </section>

               {/* Access Credentials Section */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Access Credentials</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Generated Password" required value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} readOnly={!isAdmin} />
                    <div className="flex flex-col justify-end">
                       <p className="text-[9px] text-slate-400 font-bold uppercase p-2 bg-slate-50 rounded-lg border border-slate-100">Parents use their phone number as username and this password to access the portal.</p>
                    </div>
                  </div>
               </section>

               {/* Section 2: Parent Information */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Parent / Guardian Information</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mother's Details</p>
                      <Input label="Mother's Name" required value={formData.motherName} onChange={(v: string) => setFormData({...formData, motherName: v})} />
                      <Input label="Mother's Email" type="email" value={formData.motherEmail} onChange={(v: string) => setFormData({...formData, motherEmail: v})} />
                    </div>
                    <div className="space-y-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Father's Details</p>
                      <Input label="Father's Name" required value={formData.fatherName} onChange={(v: string) => setFormData({...formData, fatherName: v})} />
                      <Input label="Father's Email" type="email" value={formData.fatherEmail} onChange={(v: string) => setFormData({...formData, fatherEmail: v})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Primary Phone" required value={formData.parentPhone} onChange={(v: string) => setFormData({...formData, parentPhone: v})} />
                    <Input label="Primary Email" type="email" required value={formData.parentEmail} onChange={(v: string) => setFormData({...formData, parentEmail: v})} />
                  </div>
                  <Input label="Residential Address" required value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} placeholder="Full residential address" />
               </section>

               {/* Section 3: Safety & Administration */}
               <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Emergency & Administration</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Emergency Contact Name" required value={formData.emergencyContact?.name} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, name: v}})} />
                    <Input label="Relationship" required value={formData.emergencyContact?.relationship} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, relationship: v}})} />
                    <Input label="Emergency Phone" required value={formData.emergencyContact?.phone} onChange={(v: string) => setFormData({...formData, emergencyContact: {...formData.emergencyContact!, phone: v}})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <Input label="Bus Route / Pickup" required value={formData.busRoute} onChange={(v: string) => setFormData({...formData, busRoute: v})} />
                    <Input label="Joining Date" type="date" required value={formData.dateOfJoining} onChange={(v: string) => setFormData({...formData, dateOfJoining: v})} />
                    <Input label="Offer Applied" options={OFFERS} value={formData.offer} onChange={(v: string) => setFormData({...formData, offer: v as any})} />
                  </div>
               </section>
               
               {isEditing && isAdmin && (
                 <section className="pt-4 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-widest p-2 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Student Record
                    </button>
                 </section>
               )}
            </form>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
               <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-700 transition-colors">Discard</button>
               <button type="submit" onClick={handleFormSubmit} disabled={saving} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all hover:bg-black">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {isEditing ? 'Save Changes' : 'Confirm Enrollment'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Verify & Save?</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
              Are you sure you want to update the records for this student? This action updates the central school database.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveConfirm(false)} className="flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 border border-slate-200 transition-all">Cancel</button>
              <button onClick={executeSave} disabled={saving} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Confirm Deletion</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
              All student data, including attendance history and billing records, will be permanently erased.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 border border-slate-200 transition-all">Keep Record</button>
              <button onClick={executeDelete} disabled={deleting} className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
