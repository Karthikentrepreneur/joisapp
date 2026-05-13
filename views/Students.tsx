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
  ShieldAlert,
  Key,
  Eye,
  EyeOff,
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

// ─── Brand Palette ────────────────────────────────────────────────────────────
const PROGRAM_META: Record<string, { bar: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { bar: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE' },
  'Curiosity Cubs': { bar: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080' },
  'Odyssey Owls':   { bar: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2' },
  'Future Makers':  { bar: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' },
};

// ─── Summary Stat Card ────────────────────────────────────────────────────────
const SummaryStat = ({ icon: Icon, label, value, accentColor, lightColor }: any) => (
  <div
    className="bg-white rounded-2xl p-4 flex items-center gap-3 flex-1 min-w-[150px]"
    style={{ border: `1.5px solid ${accentColor}28`, boxShadow: `0 2px 14px ${accentColor}14` }}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: lightColor }}>
      <Icon className="w-5 h-5" style={{ color: accentColor }} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: '#9AA5B4' }}>{label}</p>
      <p className="text-xl font-bold leading-none" style={{ color: '#1A2340' }}>{value}</p>
    </div>
  </div>
);

// ─── Detail Item ──────────────────────────────────────────────────────────────
const DetailItem = ({ label, value, icon: Icon, isSecret }: { label: string; value: string | undefined | number; icon?: any; isSecret?: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const displayValue = isSecret && !revealed ? '••••••••' : value || '—';

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: '#9AA5B4' }}>{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F8FAFC', border: '1px solid #F0F4F8' }}>
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: '#9AA5B4' }} />}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#1A2340' }}>{displayValue}</p>
          {isSecret && value && (
            <button onClick={() => setRevealed(!revealed)} className="p-1 rounded-md transition-colors hover:opacity-70">
              {revealed ? <EyeOff className="w-3 h-3" style={{ color: '#9AA5B4' }} /> : <Eye className="w-3 h-3" style={{ color: '#9AA5B4' }} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Form Input ───────────────────────────────────────────────────────────────
const Input = ({ label, required, value, onChange, type = 'text', placeholder, options, readOnly }: any) => {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const isPhone = type === 'tel';
  const inputType = isPassword && showPwd ? 'text' : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (isPhone) {
      val = val.replace(/\D/g, '');
      if (val.length > 10) val = val.slice(0, 10);
    }
    onChange(val);
  };

  const baseInput = `w-full px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-[#C8D0DC]`;
  const style = {
    background: '#F8FAFC',
    border: '1.5px solid #F0F4F8',
    color: '#1A2340',
  };

  return (
    <div className="space-y-1 w-full">
      <label className="text-[10px] font-bold uppercase tracking-widest ml-0.5" style={{ color: '#9AA5B4' }}>
        {label} {required && <span style={{ color: '#FF4B8B' }}>*</span>}
      </label>
      <div className="relative">
        {options ? (
          <select
            value={value || ''}
            required={required}
            disabled={readOnly}
            onChange={handleChange}
            className={`${baseInput} appearance-none disabled:opacity-70`}
            style={style}
          >
            <option value="" disabled>Select {label}</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <>
            <input
              type={inputType}
              required={required}
              value={value || ''}
              readOnly={readOnly}
              onChange={handleChange}
              minLength={isPhone ? 10 : undefined}
              maxLength={isPhone ? 10 : undefined}
              className={`${baseInput} read-only:opacity-70 ${isPassword ? 'pr-10' : ''}`}
              style={style}
              placeholder={placeholder || `Enter ${label}`}
            />
            {isPassword && value && (
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                {showPwd ? <EyeOff className="w-4 h-4" style={{ color: '#9AA5B4' }} /> : <Eye className="w-4 h-4" style={{ color: '#9AA5B4' }} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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
        db.getAll('attendanceLogs'),
      ]);
      setStudents(allStudents);
      setAttendanceLogs(allLogs);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [role]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.id?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const generatePassword = () => Math.random().toString(36).slice(-8).toUpperCase();

  const initialFormData: Partial<Student> = {
    firstName: '', middleName: '', lastName: '', dob: '', bloodGroup: 'O+',
    motherName: '', fatherName: '', fatherEmail: '',
    parentPhone: '', parentEmail: '', address: '',
    program: '' as any,
    dateOfJoining: new Date().toISOString().split('T')[0], offer: 'Regular',
    feesStatus: 'Pending', busRoute: 'Self Pickup', image: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    password: generatePassword(),
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
      const payload = { ...formData, name: fullName };

      if (isEditing && formData.id) {
        await db.update('students', formData.id, payload);
        showToast?.('Profile Updated', 'success', `${fullName}'s record has been saved.`);
      } else {
        const pCode = formData.program === 'Little Seeds' ? 'LS' :
                      formData.program === 'Curiosity Cubs' ? 'CC' :
                      formData.program === 'Odyssey Owls' ? 'OO' :
                      formData.program === 'Future Makers' ? 'FM' : 'GEN';
        const count = students.filter(s => s.program === formData.program).length + 1;
        const studentId = `JS-${pCode}${count.toString().padStart(2, '0')}`;
        const newStudent: Student = {
          ...payload as any,
          id: studentId,
          image: formData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
          attendance: 100,
          parentId: `PAR-${studentId}`,
        };
        await db.create('students', newStudent);
        showToast?.('Student Enrolled', 'success', `${fullName} is now in the directory. Initial Password: ${newStudent.password}`);
      }
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.('Error', 'error', 'Failed to save student data.');
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
      showToast?.('Record Removed', 'info', 'Student has been deleted from records.');
      setShowFormModal(false);
      loadData();
    } catch (e) {
      showToast?.('Error', 'error', 'Deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleScrollToSection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sectionId = e.target.value;
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      e.target.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  // Program badge colors
  const getProgramMeta = (program: string) => PROGRAM_META[program] ?? { bar: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' };

  return (
    <div className="w-full flex flex-col min-h-full pb-8" style={{ background: '#F8FAFC', animation: 'fadeUp .4s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Header ── */}
      <div className="bg-white px-6 py-4" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF8FE' }}>
              <Users className="w-6 h-6" style={{ color: '#3BB5F0' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: '#1A2340' }}>Student Directory</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#9AA5B4' }}>{filteredStudents.length} Records found</p>
            </div>
          </div>

          {/* Search + Enroll */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#C8D0DC' }} />
              <input
                type="text"
                placeholder="Search name or ID..."
                className="w-full pl-9 pr-4 py-2 text-sm font-medium rounded-xl outline-none transition-all"
                style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => { setFormData(initialFormData); setIsEditing(false); setShowFormModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0 text-white"
                style={{ background: '#1A2340' }}
              >
                <Plus className="w-3.5 h-3.5" /> Enroll Student
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats + Filters ── */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-6 space-y-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Stat Cards */}
          <div className="flex gap-3 flex-1 overflow-x-auto no-scrollbar">
            <SummaryStat icon={UserPlus}    label="Total Students" value={stats.total}   accentColor="#3BB5F0" lightColor="#EEF8FE" />
            <SummaryStat icon={CheckCircle2} label="Present Today"  value={stats.present} accentColor="#4BC83A" lightColor="#F0FBF0" />
            <SummaryStat icon={CreditCard}   label="Fee Dues"        value={stats.unpaid}  accentColor="#FFB800" lightColor="#FFFBEA" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
              <button
                onClick={() => setActiveFilter('All')}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={activeFilter === 'All' ? { background: '#1A2340', color: '#fff' } : { color: '#9AA5B4' }}
              >All</button>
              {PROGRAMS.map(prog => {
                const meta = getProgramMeta(prog);
                const active = activeFilter === prog;
                return (
                  <button
                    key={prog}
                    onClick={() => setActiveFilter(prog)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                    style={active
                      ? { background: meta.bar, color: '#fff' }
                      : { color: '#9AA5B4' }}
                  >{prog}</button>
                );
              })}
            </div>

            {/* Mobile filter */}
            <div className="md:hidden flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9AA5B4' }} />
              <select
                value={activeFilter}
                onChange={e => setActiveFilter(e.target.value as any)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl outline-none appearance-none"
                style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
              >
                <option value="All">All Courses</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Student Grid ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4B8B' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Loading Records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Users className="w-10 h-10" style={{ color: '#F0F4F8' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>No records match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4 md:gap-5 md:p-6">
              {filteredStudents.map(s => {
                const meta = getProgramMeta(s.program);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="group cursor-pointer flex flex-col items-center p-3 md:p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1"
                    style={{ border: `1.5px solid #F0F4F8`, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = meta.border)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F4F8')}
                  >
                    <div className="relative mb-2 md:mb-3">
                      <img
                        src={s.image}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ border: `3px solid ${meta.light}` }}
                        alt={s.name}
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                        style={{ background: meta.bar }}
                      />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-center leading-tight mb-1" style={{ color: '#1A2340' }}>{s.name}</h3>
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                      style={{ background: meta.light, color: meta.text, border: `1px solid ${meta.border}` }}
                    >{s.program}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Student Detail Modal ── */}
      {selectedStudent && (() => {
        const meta = getProgramMeta(selectedStudent.program);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(26,35,64,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>
              {/* Modal Header */}
              <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#3BB5F0' }} />
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Complete Student Profile</h3>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded-lg transition-colors hover:opacity-70">
                  <X className="w-4 h-4" style={{ color: '#9AA5B4' }} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">

                {/* Hero */}
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={selectedStudent.image}
                      className="w-20 h-20 rounded-2xl object-cover"
                      style={{ border: `3px solid ${meta.light}` }}
                      alt="Avatar"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white" style={{ background: selectedStudent.attendance > 90 ? '#4BC83A' : '#FFB800' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold leading-tight mb-2" style={{ color: '#1A2340' }}>{selectedStudent.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: meta.light, color: meta.text, border: `1px solid ${meta.border}` }}>
                        {selectedStudent.program}
                      </span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: '#9AA5B4' }}>UID: {selectedStudent.id}</span>
                    </div>
                  </div>
                </div>

                {/* Academic & Personal */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest pb-2 flex items-center gap-2" style={{ color: '#9AA5B4', borderBottom: '1.5px solid #F0F4F8' }}>
                    <Calendar className="w-3 h-3" /> Academic & Personal
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <DetailItem label="Date of Birth"  value={selectedStudent.dob}            icon={Calendar}     />
                    <DetailItem label="Blood Group"    value={selectedStudent.bloodGroup}      icon={Droplets}     />
                    <DetailItem label="Joining Date"   value={selectedStudent.dateOfJoining}   icon={UserPlus}     />
                    <DetailItem label="Offer Type"     value={selectedStudent.offer}           icon={Activity}     />
                    <DetailItem label="Bus Route"      value={selectedStudent.busRoute}        icon={MapPin}       />
                    <DetailItem label="Attendance"     value={`${selectedStudent.attendance}%`} icon={CheckCircle2} />
                  </div>
                </section>

                {/* Account Access */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest pb-2 flex items-center gap-2" style={{ color: '#9AA5B4', borderBottom: '1.5px solid #F0F4F8' }}>
                    <Lock className="w-3 h-3" /> Account Access
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <DetailItem label="Portal Username"   value={selectedStudent.parentPhone}               icon={Phone} />
                    <DetailItem label="Current Password"  value={selectedStudent.password || 'Not Set'}     icon={Key}   isSecret />
                  </div>
                </section>

                {/* Guardian Info */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest pb-2 flex items-center gap-2" style={{ color: '#9AA5B4', borderBottom: '1.5px solid #F0F4F8' }}>
                    <Home className="w-3 h-3" /> Guardian Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <DetailItem label="Mother's Name"  value={selectedStudent.motherName}  icon={User}  />
                    <DetailItem label="Father's Name"  value={selectedStudent.fatherName}  icon={User}  />
                    <DetailItem label="Mother's Email" value={selectedStudent.parentEmail}  icon={Mail}  />
                    <DetailItem label="Mother's Phone" value={selectedStudent.parentPhone}  icon={Phone} />
                  </div>
                </section>

                {/* Emergency & Location */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest pb-2 flex items-center gap-2" style={{ color: '#9AA5B4', borderBottom: '1.5px solid #F0F4F8' }}>
                    <AlertCircle className="w-3 h-3" /> Emergency & Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <DetailItem label="Emergency Contact" value={selectedStudent.emergencyContact?.name}         icon={User}        />
                    <DetailItem label="Relationship"       value={selectedStudent.emergencyContact?.relationship} icon={HelpCircle}  />
                    <DetailItem label="Emergency Phone"    value={selectedStudent.emergencyContact?.phone}        icon={Phone}       />
                  </div>
                  <DetailItem label="Permanent Address" value={selectedStudent.address} icon={MapPin} />
                </section>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 flex justify-end gap-2 shrink-0" style={{ borderTop: '1.5px solid #F0F4F8', background: '#F8FAFC' }}>
                <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-70" style={{ color: '#9AA5B4' }}>
                  Close View
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setFormData({ ...selectedStudent }); setIsEditing(true); setShowFormModal(true); setSelectedStudent(null); }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 text-white"
                    style={{ background: '#1A2340' }}
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Record
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Enrollment Form Modal ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: 'rgba(26,35,64,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]" style={{ border: '1.5px solid #F0F4F8' }}>

            {/* Form Header */}
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isEditing ? '#FFFBEA' : '#F0FBF0' }}>
                  {isEditing
                    ? <Edit className="w-4 h-4" style={{ color: '#FFB800' }} />
                    : <UserPlus className="w-4 h-4" style={{ color: '#4BC83A' }} />}
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A2340' }}>
                  {isEditing ? 'Modify Student Record' : 'Enroll New Student'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  onChange={handleScrollToSection}
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg outline-none cursor-pointer transition-all"
                  style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#9AA5B4' }}
                >
                  <option value="" disabled selected>Jump to section...</option>
                  <option value="section-basic">Student Profile</option>
                  <option value="section-credentials">Credentials</option>
                  <option value="section-parents">Parent Info</option>
                  <option value="section-admin">Emergency & Admin</option>
                </select>
                <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
                  <X className="w-4 h-4" style={{ color: '#9AA5B4' }} />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">

              {/* Section: Student Profile */}
              <section id="section-basic" className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: '#3BB5F0' }} />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A2340' }}>Student Profile</h4>
                </div>

                {/* Photo upload */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
                    {formData.image
                      ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      : <User className="w-6 h-6" style={{ color: '#C8D0DC' }} />}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9AA5B4' }}>Upload Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider cursor-pointer transition-all"
                      style={{ '--file-bg': '#EEF8FE', '--file-color': '#3BB5F0' } as any}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="First Name"  required value={formData.firstName}  onChange={(v: string) => setFormData({ ...formData, firstName: v })} />
                  <Input label="Middle Name"          value={formData.middleName}  onChange={(v: string) => setFormData({ ...formData, middleName: v })} />
                  <Input label="Last Name"   required value={formData.lastName}   onChange={(v: string) => setFormData({ ...formData, lastName: v })} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Input label="Date of Birth" type="date" required value={formData.dob}         onChange={(v: string) => setFormData({ ...formData, dob: v })} />
                  <Input label="Blood Group"   options={BLOOD_GROUPS}            value={formData.bloodGroup} onChange={(v: string) => setFormData({ ...formData, bloodGroup: v })} />
                  <Input label="Program"       options={PROGRAMS}      required  value={formData.program}    onChange={(v: string) => setFormData({ ...formData, program: v as any })} />
                </div>
              </section>

              {/* Section: Credentials */}
              <section id="section-credentials" className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#F0FBF0' }}>
                    <Lock className="w-3.5 h-3.5" style={{ color: '#4BC83A' }} />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A2340' }}>Access Credentials</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Generated Password" required value={formData.password} onChange={(v: string) => setFormData({ ...formData, password: v })} type="password" />
                  <div className="flex flex-col justify-end">
                    <p className="text-[9px] font-bold uppercase tracking-wider p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', color: '#9AA5B4' }}>
                      Parents use their phone number as username and this password to access the portal.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section: Parent Info */}
              <section id="section-parents" className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FFF0F5' }}>
                    <Users className="w-3.5 h-3.5" style={{ color: '#FF4B8B' }} />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A2340' }}>Parent / Guardian Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 rounded-2xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Mother's Details (Primary)</p>
                    <Input label="Mother's Name"           required value={formData.motherName}  onChange={(v: string) => setFormData({ ...formData, motherName: v })} />
                    <Input label="Mother's Phone (Primary)" type="tel"   required value={formData.parentPhone} onChange={(v: string) => setFormData({ ...formData, parentPhone: v })} />
                    <Input label="Mother's Email (Primary)" type="email" required value={formData.parentEmail} onChange={(v: string) => setFormData({ ...formData, parentEmail: v })} />
                  </div>
                  <div className="space-y-3 p-4 rounded-2xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Father's Details</p>
                    <Input label="Father's Name"  required value={formData.fatherName}  onChange={(v: string) => setFormData({ ...formData, fatherName: v })} />
                    <Input label="Father's Email" type="email" value={formData.fatherEmail} onChange={(v: string) => setFormData({ ...formData, fatherEmail: v })} />
                  </div>
                </div>
                <Input label="Residential Address" required value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} placeholder="Full residential address" />
              </section>

              {/* Section: Emergency & Admin */}
              <section id="section-admin" className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FFF0F5' }}>
                    <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#FF4B8B' }} />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A2340' }}>Emergency & Administration</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Emergency Contact Name" required value={formData.emergencyContact?.name}         onChange={(v: string) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact!, name: v } })} />
                  <Input label="Relationship"           required value={formData.emergencyContact?.relationship} onChange={(v: string) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact!, relationship: v } })} />
                  <Input label="Emergency Phone"  type="tel" required value={formData.emergencyContact?.phone}   onChange={(v: string) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact!, phone: v } })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <Input label="Bus Route / Pickup" required value={formData.busRoute}       onChange={(v: string) => setFormData({ ...formData, busRoute: v })} />
                  <Input label="Joining Date" type="date" required value={formData.dateOfJoining} onChange={(v: string) => setFormData({ ...formData, dateOfJoining: v })} />
                  <Input label="Offer Applied" options={OFFERS} value={formData.offer}       onChange={(v: string) => setFormData({ ...formData, offer: v as any })} />
                </div>
              </section>

              {isEditing && isAdmin && (
                <section className="pt-2 pb-2" style={{ borderTop: '1.5px solid #F0F4F8' }}>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ color: '#FF4B8B', background: '#FFF0F5' }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete Student Record
                  </button>
                </section>
              )}
            </form>

            {/* Form Footer */}
            <div className="p-4 flex justify-end gap-2 shrink-0" style={{ borderTop: '1.5px solid #F0F4F8', background: '#F8FAFC' }}>
              <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70" style={{ color: '#9AA5B4' }}>
                Discard
              </button>
              <button
                type="submit"
                onClick={handleFormSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 text-white"
                style={{ background: '#1A2340' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isEditing ? 'Save Changes' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Confirm Modal ── */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(26,35,64,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" style={{ border: '1.5px solid #F0F4F8' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#EEF8FE' }}>
              <HelpCircle className="w-6 h-6" style={{ color: '#3BB5F0' }} />
            </div>
            <h3 className="text-base font-bold mb-1.5" style={{ color: '#1A2340' }}>Verify & Save?</h3>
            <p className="text-xs font-medium mb-6 leading-relaxed" style={{ color: '#9AA5B4' }}>
              Are you sure you want to update the records for this student? This action updates the central school database.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveConfirm(false)} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-70" style={{ border: '1.5px solid #F0F4F8', color: '#9AA5B4' }}>
                Cancel
              </button>
              <button onClick={executeSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 text-white" style={{ background: '#3BB5F0' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(26,35,64,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" style={{ border: '1.5px solid #F0F4F8' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF0F5' }}>
              <AlertCircle className="w-6 h-6" style={{ color: '#FF4B8B' }} />
            </div>
            <h3 className="text-base font-bold mb-1.5" style={{ color: '#1A2340' }}>Confirm Deletion</h3>
            <p className="text-xs font-medium mb-6 leading-relaxed" style={{ color: '#9AA5B4' }}>
              All student data, including attendance history and billing records, will be permanently erased.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-70" style={{ border: '1.5px solid #F0F4F8', color: '#9AA5B4' }}>
                Keep Record
              </button>
              <button onClick={executeDelete} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 text-white" style={{ background: '#FF4B8B' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
