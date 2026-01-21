import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/persistence';
import { 
  Search, 
  Plus, 
  X, 
  Loader2, 
  GraduationCap,
  Save,
  User,
  Home,
  ShieldAlert,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Camera,
  Activity,
  Lock,
  ChevronRight,
  MapPin,
  Calendar,
  Droplets,
  Heart,
  Mail,
  Phone,
  LayoutGrid,
  MoreHorizontal,
  UserCheck,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { UserRole, Student, ProgramType, Staff, AttendanceLog } from '../types';
import { ToastType } from '../components/Toast';

interface StudentsProps {
  role?: UserRole;
  showToast?: (t: string, ty: ToastType, d?: string) => void;
  initialFilter?: 'All' | ProgramType;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const OFFERS = ['Early Bird Offer', 'Regular', 'Vijayadasami', 'New Year', 'Bridge Course'] as const;

const PROGRAM_CODES: Record<ProgramType, string> = {
  'Little Seeds': 'LS',
  'Curiosity Cubs': 'CC',
  'Odyssey Owls': 'OO',
  'Future Makers': 'FM'
};

const SummaryCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
     <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}><Icon className="w-6 h-6" /></div>
     <div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 leading-none">{label}</p>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
     </div>
  </div>
);

const DetailBlock = ({ label, value }: { label: string, value: string | number | undefined }) => (
  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-[12px] font-bold text-slate-700 leading-tight truncate">{value || "---"}</p>
  </div>
);

const InfoRow = ({ label, value, sub, icon: Icon }: { label: string, value: string | undefined, sub?: string, icon?: any }) => (
  <div className="flex flex-col gap-1 group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
      <p className="text-[14px] font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{value || "---"}</p>
    </div>
    {sub && <p className="text-[11px] text-slate-500 font-medium tracking-tight truncate opacity-80">{sub}</p>}
  </div>
);

const FormField = ({ label, required, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">{label} {required && '*'}</label>
    <input 
      type={type} 
      required={required} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 outline-none focus:border-blue-600 transition-all placeholder:text-slate-300 shadow-sm" 
      placeholder={placeholder || `Enter ${label}...`}
    />
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === UserRole.ADMIN;
  const isTeacher = role === UserRole.TEACHER;

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, allStaff, allLogs] = await Promise.all([
        db.getAll('students'),
        db.getAll('staff'),
        db.getAll('attendanceLogs')
      ]);

      setStudents(allStudents);
      setAttendanceLogs(allLogs);

      if (isTeacher) {
        const currentTeacher = allStaff.find((s: Staff) => s.role === 'Teacher');
        if (currentTeacher && currentTeacher.classAssigned) {
          setActiveFilter(currentTeacher.classAssigned as ProgramType);
        } else if (activeFilter === 'All') {
          setActiveFilter('Little Seeds');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [role]);

  useEffect(() => {
    if (!isTeacher) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter, isTeacher]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'All' || s.program === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [students, searchTerm, activeFilter]);

  const directoryStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const relevantIds = new Set(filteredStudents.map(s => s.id));
    const presentToday = attendanceLogs.filter(l => 
      l.date === today && 
      relevantIds.has(l.studentId) && 
      (l.status === 'Present' || l.status === 'Late')
    ).length;

    const pendingFees = filteredStudents.filter(s => s.feesStatus !== 'Paid').length;

    return { total: filteredStudents.length, present: presentToday, pending: pendingFees };
  }, [filteredStudents, attendanceLogs]);

  const initialFormData: Partial<Student> = {
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    bloodGroup: 'O+',
    motherName: '',
    motherEmail: '',
    fatherName: '',
    fatherEmail: '',
    program: isTeacher ? activeFilter as ProgramType : 'Little Seeds',
    dateOfJoining: new Date().toISOString().split('T')[0],
    offer: 'Regular',
    parentPhone: '',
    parentEmail: '',
    address: '',
    busRoute: 'Not Assigned',
    image: '',
    feesStatus: 'Pending',
    emergencyContact: { name: '', relationship: '', phone: '' }
  };

  const [formData, setFormData] = useState<Partial<Student>>(initialFormData);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const generateProgrammaticId = (program: ProgramType, currentStudents: Student[]) => {
    const code = PROGRAM_CODES[program] || 'ST';
    const programStudents = currentStudents.filter(s => s.program === program);
    let maxNum = 0;
    programStudents.forEach(s => {
      const match = s.id.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `JS-${code}${nextNum.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `student_${Date.now()}_${file.name}`;
      const imageUrl = await db.uploadFile('students', fileName, file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      showToast?.("Profile Photo Uploaded", "success");
    } catch (err) {
      showToast?.("Upload Failed", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const studentName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      if (isEditing && formData.id) {
        await db.update('students', formData.id, { ...formData, name: studentName });
        showToast?.("Profile Updated", "success", `${studentName}'s record has been updated.`);
      } else {
        const program = formData.program as ProgramType;
        const currentList = await db.getAll('students');
        const studentId = generateProgrammaticId(program, currentList);
        const newStudent: Student = {
          ...formData as any,
          id: studentId,
          name: studentName,
          image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
          attendance: 100,
          feesStatus: formData.feesStatus || 'Pending',
          parentId: `PAR-${studentId}`
        };
        await db.create('students', newStudent);
        showToast?.("Student Registered", "success", `${newStudent.name} enrolled with ID ${studentId}.`);
      }
      setShowFormModal(false);
      setIsEditing(false);
      loadData();
    } catch (err) {
      showToast?.("Action Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setSaving(true);
    try {
      await db.delete('students', studentToDelete.id);
      showToast?.("Student Removed", "info", "Record purged from directory.");
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
      loadData();
    } catch (err) {
      showToast?.("Delete Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (student: Student) => {
    setFormData({ ...student });
    setIsEditing(true);
    setShowFormModal(true);
    setSelectedStudent(null);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      {/* Directory Header - Mirrors Staff Hub exactly */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-none tracking-tight">Student Directory</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{filteredStudents.length} Profiles in View</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-medium outline-none focus:border-slate-900 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setFormData(initialFormData); setIsEditing(false); setShowFormModal(true); }}
              className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      {/* Program Filter Tabs */}
      <div className="px-6 py-1.5 border-b border-slate-200 flex items-center gap-8 bg-white overflow-x-auto no-scrollbar shrink-0">
        <button 
          onClick={() => setActiveFilter('All')}
          className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${
            activeFilter === 'All' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Whole School
        </button>
        {PROGRAMS.map(prog => (
          <button 
            key={prog} 
            onClick={() => setActiveFilter(prog)}
            className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${
              activeFilter === prog ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {prog}
          </button>
        ))}
      </div>

      {/* Summary Stats Grid */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/10 border-b border-slate-100">
         <SummaryCard icon={UserCheck} label="Cohort Pool" value={directoryStats.total} color="bg-blue-600 shadow-blue-100 text-white" />
         <SummaryCard icon={Activity} label="Morning Attendance" value={directoryStats.present} color="bg-emerald-500 shadow-emerald-100 text-white" />
         <SummaryCard icon={CreditCard} label="Finance Alerts" value={directoryStats.pending} color="bg-rose-500 shadow-rose-100 text-white" />
      </div>

      {/* Modern Data Table - Mirrors Staff Directory format precisely */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-slate-900" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Accessing Registry</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="pl-6 pr-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">#</th>
                <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Profile</th>
                <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program & Plan</th>
                <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Finance</th>
                <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Attendance</th>
                <th className="pl-3 pr-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className="sheet-row group cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="pl-6 pr-3 py-4 text-[11px] text-slate-300 font-bold text-center">{idx + 1}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-4">
                      <img src={s.image} className="w-11 h-11 rounded-xl border border-slate-100 bg-slate-50 object-cover shadow-sm group-hover:scale-105 transition-transform" />
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">{s.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase">ID: {s.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{s.program}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{s.offer}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      s.feesStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {s.feesStatus}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                       <span className="text-[12px] font-black text-slate-800">{s.attendance}%</span>
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className={`h-full ${s.attendance > 90 ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full`} style={{ width: `${s.attendance}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="pl-3 pr-6 py-4 text-right">
                    <button className="p-2 text-slate-300 group-hover:text-slate-900 group-hover:bg-slate-100 rounded-lg transition-all active:scale-95">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Profile Detail View - Organized by 'Section 01-04' */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Profile View</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Official Registry ID • {selectedStudent.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 bg-white text-slate-400 hover:text-slate-900 border border-slate-100 rounded-xl flex items-center justify-center transition-all active:scale-90"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                 <div className="shrink-0 relative">
                    <img src={selectedStudent.image} className="w-48 h-48 rounded-[2.5rem] object-cover border-8 border-white shadow-xl" alt="Student" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-xl shadow-lg border border-white/10 whitespace-nowrap">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em]">{selectedStudent.program}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 w-full">
                    <DetailBlock label="Legal First Name" value={selectedStudent.firstName} />
                    <DetailBlock label="Legal Last Name" value={selectedStudent.lastName} />
                    <DetailBlock label="Attendance Score" value={`${selectedStudent.attendance}%`} />
                    <DetailBlock label="Genesis ID" value={selectedStudent.id} />
                    <DetailBlock label="Fees Account" value={selectedStudent.feesStatus} />
                    <DetailBlock label="Enrollment Offer" value={selectedStudent.offer} />
                 </div>
              </div>

              <div className="space-y-12 pt-6">
                 {/* SECTION 01: PROFILE IDENTITY */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                       <User className="w-5 h-5 text-blue-600" />
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Section 01: Profile Identity</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       <InfoRow label="Date of Genesis (DOB)" value={selectedStudent.dob} icon={Calendar} />
                       <InfoRow label="Blood Matrix Type" value={selectedStudent.bloodGroup || "O+"} icon={Droplets} />
                       <InfoRow label="Digital Gateway (Email)" value={selectedStudent.parentEmail} icon={Mail} />
                    </div>
                 </div>

                 {/* SECTION 02: ACADEMIC FRAMEWORK */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                       <GraduationCap className="w-5 h-5 text-emerald-600" />
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Section 02: Academic Framework</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       <InfoRow label="Cohort Placement" value={selectedStudent.program} icon={Lock} />
                       <InfoRow label="Applied Offer Matrix" value={selectedStudent.offer} icon={Heart} />
                       <InfoRow label="Date of Joining" value={selectedStudent.dateOfJoining} icon={Calendar} />
                    </div>
                 </div>

                 {/* SECTION 03: FAMILY REGISTRY */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                       <Home className="w-5 h-5 text-indigo-600" />
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Section 03: Family Registry</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       <InfoRow label="Mother Principal Name" value={selectedStudent.motherName} sub={selectedStudent.motherEmail} icon={User} />
                       <InfoRow label="Father Principal Name" value={selectedStudent.fatherName} sub={selectedStudent.fatherEmail} icon={User} />
                       <InfoRow label="Primary Contact Phone" value={selectedStudent.parentPhone} icon={Phone} />
                    </div>
                 </div>

                 {/* SECTION 04: SAFETY INTERCEPT */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                       <ShieldAlert className="w-5 h-5 text-rose-600" />
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Section 04: Safety Intercept</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       <InfoRow label="Assigned Fleet" value={selectedStudent.busRoute || "Self Pickup"} icon={Activity} />
                       <InfoRow label="Emergency Contact" value={selectedStudent.emergencyContact?.name} sub={selectedStudent.emergencyContact?.phone} icon={ShieldAlert} />
                       <InfoRow label="Legal Resident Address" value={selectedStudent.address || "No Address on File"} icon={MapPin} />
                    </div>
                 </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              {isAdmin && (
                <button onClick={() => { setStudentToDelete(selectedStudent); setShowDeleteConfirm(true); }} className="px-5 py-2 text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2 mr-auto"><Trash2 className="w-4 h-4" /> Purge Record</button>
              )}
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors">Close View</button>
              {isAdmin && (
                <button onClick={() => openEdit(selectedStudent)} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all"><Edit className="w-4 h-4" /> Modify Identity</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{isEditing ? 'Modify Personnel Identity' : 'Genesis Student Enrollment'}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registry Control Protocol</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
              {/* SECTION 01: PROFILE IDENTITY */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Section 01: Profile Identity</h4>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="relative group shrink-0 mx-auto md:mx-0">
                      <div className={`w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center transition-all ${uploadingImage ? 'opacity-50' : ''}`}>
                         {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-slate-300" />}
                         {uploadingImage && <Loader2 className="absolute w-8 h-8 animate-spin text-slate-900" />}
                      </div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white active:scale-90 transition-all"><Camera className="w-4 h-4" /></button>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                      <FormField label="Legal First Name" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                      <FormField label="Legal Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                      <FormField label="Digital Gateway (Email)" type="email" required value={formData.parentEmail} onChange={(v: string) => setFormData({...formData, parentEmail: v})} />
                      <FormField label="Date of Genesis (DOB)" type="date" required value={formData.dob} onChange={(v: string) => setFormData({...formData, dob: v})} />
                   </div>
                </div>
              </section>

              {/* SECTION 02: ACADEMIC FRAMEWORK */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Section 02: Academic Framework</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cohort Placement</label>
                    <select value={formData.program} disabled={isTeacher} onChange={e => setFormData({...formData, program: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 outline-none focus:border-blue-600">
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Applied Offer Matrix</label>
                    <select value={formData.offer} onChange={e => setFormData({...formData, offer: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 outline-none focus:border-blue-600">
                      {OFFERS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <FormField label="Blood Matrix Type" value={formData.bloodGroup} onChange={(v: string) => setFormData({...formData, bloodGroup: v})} />
                  <FormField label="Joining Date" type="date" required value={formData.dateOfJoining} onChange={(v: string) => setFormData({...formData, dateOfJoining: v})} />
                </div>
              </section>

              {/* SECTION 03: FAMILY REGISTRY */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <Home className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Section 03: Family Registry</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField label="Father Principal Name" required value={formData.fatherName} onChange={(v: string) => setFormData({...formData, fatherName: v})} />
                   <FormField label="Mother Principal Name" required value={formData.motherName} onChange={(v: string) => setFormData({...formData, motherName: v})} />
                   <FormField label="Primary Contact Phone" required value={formData.parentPhone} onChange={(v: string) => setFormData({...formData, parentPhone: v})} />
                   <FormField label="Legal Resident Address" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} />
                </div>
              </section>

              {/* SECTION 04: SAFETY INTERCEPT */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Section 04: Safety Intercept</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField label="Emergency Contact Name" value={formData.emergencyContact?.name} onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {name:'',relationship:'',phone:''}), name: v}})} />
                   <FormField label="Intercept Phone" value={formData.emergencyContact?.phone} onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {name:'',relationship:'',phone:''}), phone: v}})} />
                </div>
              </section>
            </form>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
              <button onClick={() => setShowFormModal(false)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Abort Procedure</button>
              <button onClick={handleSave} disabled={saving || uploadingImage} className="bg-slate-900 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEditing ? 'Push Data Update' : 'Verify & Commit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
             <div className="p-10 text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-rose-600 uppercase tracking-tight">Registry Purge</h3>
                <p className="text-slate-500 text-sm mt-3 font-medium">Destroying profile for <span className="font-bold text-slate-900">{studentToDelete?.name}</span>. This is non-reversible.</p>
             </div>
             <div className="bg-slate-50 p-5 flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Abort</button>
                <button onClick={handleDelete} className="flex-1 bg-rose-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Destroy Data</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};