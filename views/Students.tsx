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
  UserCheck,
  Activity,
  Lock,
  ChevronRight,
  MapPin,
  Calendar,
  Droplets,
  Heart,
  Mail,
  Phone
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

const DetailBlock = ({ label, value, icon: Icon }: { label: string, value: string | number | undefined, icon?: any }) => (
  <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-blue-500" />}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">{label}</p>
    </div>
    <p className="text-[16px] font-black text-slate-900 leading-tight truncate">{value || "---"}</p>
  </div>
);

const InfoRow = ({ label, value, sub, icon: Icon }: { label: string, value: string | undefined, sub?: string, icon?: any }) => (
  <div className="flex flex-col gap-2 group">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3 text-slate-400" />}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</p>
    </div>
    <p className="text-[18px] font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{value || "---"}</p>
    {sub && <p className="text-[13px] text-blue-600 font-bold tracking-tight truncate opacity-80">{sub}</p>}
  </div>
);

const FormField = ({ label, required, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{label} {required && '*'}</label>
    <input 
      type={type} 
      required={required} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      className="w-full px-7 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] text-[15px] font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-50 transition-all placeholder:text-slate-200 shadow-sm focus:shadow-2xl" 
      placeholder={placeholder || `Specify ${label}...`}
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

    return { total: filteredStudents.length, present: presentToday };
  }, [filteredStudents, attendanceLogs]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<Partial<Student> | null>(null);

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
      showToast?.("Identity Visual Captured", "success", "Profile photo ready to save.");
    } catch (err) {
      showToast?.("Upload Failed", "error", "The system could not process the profile image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInitialSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setPendingUpdateData({ ...formData });
      setShowUpdateConfirm(true);
    } else {
      executeSave(formData);
    }
  };

  const openEdit = (student: Student) => {
    setFormData({ ...student });
    setIsEditing(true);
    setShowFormModal(true);
    setSelectedStudent(null);
  };

  const executeSave = async (dataToSave: Partial<Student>) => {
    setSaving(true);
    try {
      const studentName = `${dataToSave.firstName || ''} ${dataToSave.lastName || ''}`.trim();
      if (isEditing && dataToSave.id) {
        await db.update('students', dataToSave.id, { ...dataToSave, name: studentName });
        showToast?.("Profile Updated", "success", `${studentName}'s record has been updated.`);
      } else {
        const program = dataToSave.program as ProgramType;
        const currentList = await db.getAll('students');
        const studentId = generateProgrammaticId(program, currentList);
        const newStudent: Student = {
          ...dataToSave as any,
          id: studentId,
          name: studentName,
          image: dataToSave.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
          attendance: 100,
          feesStatus: dataToSave.feesStatus || 'Pending',
          parentId: `PAR-${studentId}`
        };
        await db.create('students', newStudent);
        showToast?.("Student Registered", "success", `${newStudent.name} is now in the system with ID ${studentId}.`);
      }
      setShowFormModal(false);
      setShowUpdateConfirm(false);
      setIsEditing(false);
      loadData();
    } catch (err) {
      showToast?.("Action Failed", "error", "Could not save student record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setSaving(true);
    try {
      await db.delete('students', studentToDelete.id);
      showToast?.("Student Removed", "info", "Record has been purged from the directory.");
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
      loadData();
    } catch (err) {
      showToast?.("Delete Failed", "error", "Could not remove the record.");
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    const headers = ["ID", "First Name", "Last Name", "Program", "DOB", "Father Name", "Mother Name", "Attendance %"];
    const rows = filteredStudents.map(s => [s.id, s.firstName, s.lastName, s.program, s.dob, s.fatherName, s.motherName, s.attendance]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Students_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      <div className="px-4 md:px-8 py-6 md:py-8 border-b border-slate-200 bg-slate-50/20 flex flex-col xl:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 shrink-0">
            <GraduationCap className="w-7 h-7 md:w-9 md:h-9" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">Student Directory</h2>
            <div className="flex items-center gap-4 mt-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pool: <span className="text-blue-600">{directoryStats.total}</span></span>
               <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified In: <span className="text-emerald-600">{directoryStats.present} Today</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder={isTeacher ? "Filter cohort..." : "Search master database..."} 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-medium outline-none focus:border-blue-500 shadow-sm transition-all focus:shadow-xl focus:ring-4 focus:ring-blue-50" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={exportToExcel}
            className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Download className="w-6 h-6" />
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setFormData(initialFormData); setIsEditing(false); setShowFormModal(true); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Enroll
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-1 border-b border-slate-200 flex items-center gap-8 bg-white overflow-x-auto no-scrollbar shrink-0">
        {isAdmin ? (
          ['All', ...PROGRAMS].map(p => (
            <button key={p} onClick={() => setActiveFilter(p as any)} className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] pb-3 pt-3 border-b-4 transition-all whitespace-nowrap ${activeFilter === p ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{p}</button>
          ))
        ) : (
          <div className="flex items-center gap-3 text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] py-4"><Lock className="w-4 h-4" /> Cohort Locked Access: {activeFilter}</div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-full inline-block align-middle h-full">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6">
              <Loader2 className="w-14 h-14 animate-spin text-blue-600" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">Deciphering Records</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6">
              <User className="w-24 h-24 opacity-10" />
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Zero matches found in {activeFilter}</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200">
                <tr className="text-left">
                  <th className="pl-6 md:pl-10 pr-4 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity & Legal Rank</th>
                  <th className="px-4 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Financial Integrity</th>
                  <th className="px-4 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Academic Vitality</th>
                  <th className="pl-4 pr-6 md:pr-10 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} onClick={() => setSelectedStudent(s)} className="sheet-row group cursor-pointer">
                    <td className="pl-6 md:pl-10 pr-4 py-6 md:py-8">
                      <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                          <img src={s.image} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border-4 border-white shadow-2xl object-cover group-hover:scale-105 transition-all" alt="Student" />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full border-4 border-white ${s.attendance > 85 ? 'bg-emerald-500' : 'bg-amber-400'} shadow-lg`}></div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[16px] md:text-[18px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">{s.name}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{s.program}</span>
                             <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                             <span className="text-[10px] font-mono text-slate-400 uppercase leading-none">ID: {s.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 md:py-8">
                      <span className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                         s.feesStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                         {s.feesStatus}
                      </span>
                    </td>
                    <td className="px-4 py-6 md:py-8">
                      <div className="flex flex-col items-center">
                        <span className="text-[14px] font-black text-slate-900 mb-2 leading-none">{s.attendance}%</span>
                        <div className="w-20 md:w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
                          <div className={`h-full ${s.attendance > 90 ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full transition-all duration-1000`} style={{ width: `${s.attendance}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="pl-4 pr-6 md:pr-10 py-6 md:py-8 text-right">
                      <button className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group-hover:shadow-2xl active:scale-95">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-none md:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="px-6 md:px-12 py-6 md:py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center shadow-3xl shrink-0"><User className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">Student Profile View</h3>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Registry ID • {selectedStudent.id}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-14 h-14 bg-white text-slate-300 hover:text-slate-900 rounded-full md:rounded-[2rem] flex items-center justify-center border border-slate-100 hover:shadow-2xl transition-all active:scale-90"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-16 no-scrollbar">
              <div className="flex flex-col lg:flex-row gap-10 md:gap-20 items-center md:items-start text-center md:text-left">
                 <div className="shrink-0 relative group">
                    <img src={selectedStudent.image} className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] md:rounded-[5rem] object-cover border-8 border-white shadow-3xl" alt="Student" />
                    <div className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-2xl md:rounded-[1.5rem] shadow-3xl z-20 border border-white/10 whitespace-nowrap">
                       <p className="text-[11px] font-black uppercase tracking-[0.3em]">{selectedStudent.program}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-x-12 md:gap-y-10 flex-1 w-full">
                    <DetailBlock label="First Name" value={selectedStudent.firstName} icon={User} />
                    <DetailBlock label="Last Name" value={selectedStudent.lastName} icon={User} />
                    <DetailBlock label="Presence Ratio" value={`${selectedStudent.attendance}%`} icon={Activity} />
                    <DetailBlock label="Genesis ID" value={selectedStudent.id} icon={ShieldAlert} />
                    <DetailBlock label="Financial Status" value={selectedStudent.feesStatus} icon={CheckCircle2} />
                    <DetailBlock label="Academic Plan" value={selectedStudent.offer} icon={Heart} />
                 </div>
              </div>

              {/* REFACTORED SECTIONS TO MATCH FORM FIELD TITLES */}
              <div className="space-y-12">
                 {/* SECTION 01: PROFILE IDENTITY */}
                 <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                       <User className="w-6 h-6 text-blue-600" />
                       <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 01: Profile Identity</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                       <InfoRow label="Date of Genesis (DOB)" value={selectedStudent.dob} icon={Calendar} />
                       <InfoRow label="Blood Matrix Type" value={selectedStudent.bloodGroup || "O+"} icon={Droplets} />
                       <InfoRow label="Digital Gateway (Email)" value={selectedStudent.parentEmail} icon={Mail} />
                    </div>
                 </div>

                 {/* SECTION 02: ACADEMIC FRAMEWORK */}
                 <div className="space-y-10 pt-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                       <GraduationCap className="w-6 h-6 text-emerald-600" />
                       <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 02: Academic Framework</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                       <InfoRow label="Cohort Placement" value={selectedStudent.program} icon={Lock} />
                       <InfoRow label="Applied Offer Matrix" value={selectedStudent.offer} icon={Heart} />
                       <InfoRow label="Date of Joining" value={selectedStudent.dateOfJoining} icon={Calendar} />
                    </div>
                 </div>

                 {/* SECTION 03: FAMILY REGISTRY */}
                 <div className="space-y-10 pt-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                       <Home className="w-6 h-6 text-indigo-600" />
                       <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 03: Family Registry</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                       <InfoRow label="Mother Principal Name" value={selectedStudent.motherName} sub={selectedStudent.motherEmail} icon={User} />
                       <InfoRow label="Father Principal Name" value={selectedStudent.fatherName} sub={selectedStudent.fatherEmail} icon={User} />
                       <InfoRow label="Primary Contact Phone" value={selectedStudent.parentPhone} icon={Phone} />
                    </div>
                 </div>

                 {/* SECTION 04: SAFETY INTERCEPT */}
                 <div className="space-y-10 pt-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                       <ShieldAlert className="w-6 h-6 text-rose-600" />
                       <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 04: Safety Intercept</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                       <InfoRow label="Assigned Fleet" value={selectedStudent.busRoute || "Self Pickup"} icon={Activity} />
                       <InfoRow label="Emergency Contact" value={selectedStudent.emergencyContact?.name} sub={selectedStudent.emergencyContact?.phone} icon={ShieldAlert} />
                       <InfoRow label="Legal Resident Address" value={selectedStudent.address || "No Address on File"} icon={MapPin} />
                    </div>
                 </div>
              </div>
              <div className="h-24"></div>
            </div>

            <div className="px-6 md:px-12 py-8 md:py-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4 shadow-inner">
              {isAdmin && (
                <button onClick={() => { setStudentToDelete(selectedStudent); setShowDeleteConfirm(true); }} className="px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 rounded-[1.8rem] transition-all flex items-center justify-center gap-3 md:mr-auto"><Trash2 className="w-5 h-5" /> Purge Record</button>
              )}
              <button onClick={() => setSelectedStudent(null)} className="px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">Close View</button>
              {isAdmin && (
                <button onClick={() => openEdit(selectedStudent)} className="bg-slate-900 text-white px-14 py-5 md:py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-3xl transition-all flex items-center justify-center gap-4 active:scale-95"><Edit className="w-6 h-6" /> Modify Identity</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/70 backdrop-blur-2xl p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-none md:rounded-[4rem] shadow-3xl w-full max-w-4xl h-full md:h-auto md:max-h-[92vh] overflow-hidden flex flex-col border border-white/20">
            <div className="px-6 md:px-12 py-6 md:py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center shadow-3xl shrink-0"><Plus className="w-7 h-7" /></div>
                 <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{isEditing ? 'Modify Personnel Identity' : 'Genesis Student Enrollment'}</h3>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Registry Control Protocol</p>
                 </div>
              </div>
              <button onClick={() => setShowFormModal(false)} className="w-14 h-14 bg-white text-slate-300 hover:text-slate-900 rounded-full md:rounded-[1.5rem] flex items-center justify-center border border-slate-100 active:scale-90 transition-all"><X className="w-8 h-8" /></button>
            </div>
            
            <form id="enrollment-form" onSubmit={handleInitialSaveClick} className="flex-1 overflow-y-auto p-6 md:p-16 space-y-16 no-scrollbar pb-32">
              <div className="space-y-12">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <User className="w-6 h-6 text-blue-600" />
                    <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 01: Profile Identity</h4>
                 </div>
                 <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
                    <div className="relative group shrink-0 mx-auto md:mx-0">
                       <div className={`w-36 h-36 md:w-44 md:h-44 rounded-[3.5rem] border-8 border-white shadow-3xl overflow-hidden bg-slate-100 flex items-center justify-center transition-all ${uploadingImage ? 'opacity-50' : ''}`}>
                          {formData.image ? <img src={formData.image} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-16 h-16 text-slate-300" />}
                          {uploadingImage && <Loader2 className="absolute w-12 h-12 animate-spin text-white" />}
                       </div>
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 w-12 h-12 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-3xl border-4 border-white active:scale-90 transition-all"><Camera className="w-6 h-6" /></button>
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1 w-full">
                       <FormField label="Legal First Name" required value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                       <FormField label="Legal Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                       <FormField label="Digital Gateway (Email)" type="email" required value={formData.parentEmail} onChange={(v: string) => setFormData({...formData, parentEmail: v})} />
                       <FormField label="Date of Genesis (DOB)" type="date" required value={formData.dob} onChange={(v: string) => setFormData({...formData, dob: v})} />
                    </div>
                 </div>
              </div>

              <div className="space-y-12 pt-12">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                    <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 02: Academic Framework</h4>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Cohort Placement</label>
                       <select value={formData.program} disabled={isTeacher} onChange={e => setFormData({...formData, program: e.target.value as any})} className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] text-[15px] font-black text-slate-900 outline-none focus:border-blue-600 disabled:opacity-50 transition-all shadow-sm">
                         {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Applied Offer Matrix</label>
                       <select value={formData.offer} onChange={e => setFormData({...formData, offer: e.target.value as any})} className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[1.8rem] text-[15px] font-black text-slate-900 outline-none focus:border-blue-600 transition-all shadow-sm">
                         {OFFERS.map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                    </div>
                    <FormField label="Blood Type" value={formData.bloodGroup} onChange={(v: string) => setFormData({...formData, bloodGroup: v})} />
                 </div>
              </div>

              <div className="space-y-12 pt-12">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <Home className="w-6 h-6 text-indigo-600" />
                    <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 03: Family Registry</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Father Principal Name" required value={formData.fatherName} onChange={(v: string) => setFormData({...formData, fatherName: v})} />
                    <FormField label="Mother Principal Name" required value={formData.motherName} onChange={(v: string) => setFormData({...formData, motherName: v})} />
                    <FormField label="Primary Contact Phone" required value={formData.parentPhone} onChange={(v: string) => setFormData({...formData, parentPhone: v})} />
                    <FormField label="Legal Resident Address" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} />
                 </div>
              </div>

              <div className="space-y-12 pt-12">
                 <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                    <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Section 04: Safety Intercept</h4>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <FormField label="Emergency Contact Name" value={formData.emergencyContact?.name} onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {name:'',relationship:'',phone:''}), name: v}})} />
                    <FormField label="Intercept Phone" value={formData.emergencyContact?.phone} onChange={(v: string) => setFormData({...formData, emergencyContact: {...(formData.emergencyContact || {name:'',relationship:'',phone:''}), phone: v}})} />
                 </div>
              </div>
              <div className="h-32"></div>
            </form>
            <div className="px-6 md:px-12 py-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-6 shadow-inner mt-auto">
              <button type="button" onClick={() => setShowFormModal(false)} className="px-10 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors order-2 md:order-1">Abort Procedure</button>
              <button form="enrollment-form" type="submit" disabled={saving || uploadingImage} className="bg-blue-600 text-white px-16 py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 order-1 md:order-2">
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} Verify & Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-4xl w-full max-w-sm overflow-hidden border border-slate-200">
             <div className="p-10 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Verify Data Push?</h3>
                <p className="text-slate-500 text-sm mt-3 font-medium">This will update the master student registry across all school modules. This action is recorded.</p>
             </div>
             <div className="bg-slate-50 p-6 flex gap-4">
                <button onClick={() => setShowUpdateConfirm(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Go Back</button>
                <button onClick={() => pendingUpdateData && executeSave(pendingUpdateData)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">Push Update</button>
             </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-4xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="p-10 md:p-14 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle className="w-10 h-10" /></div>
                <h3 className="text-2xl font-black text-rose-600 tracking-tight leading-none mb-4">Registry Purge</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Destroying identity profile for <span className="font-bold text-slate-900">{studentToDelete?.name}</span>. This is non-reversible. Proceed?</p>
             </div>
             <div className="bg-slate-50 p-8 flex gap-6">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-5 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-[0.2em]">Abort</button>
                <button onClick={handleDelete} className="flex-1 bg-rose-600 text-white py-5 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] shadow-3xl active:scale-95 transition-all">Destroy Data</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};