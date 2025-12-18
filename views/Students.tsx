import React, { useState, useRef, useEffect } from 'react';
import { mockStudents, mockInvoices } from '../data/mockData';
import { Search, Filter, Plus, Phone, Bus, X, Save, Camera, Pencil, DollarSign, Upload, FileText, Mail, User, AlertCircle } from 'lucide-react';
import { UserRole, Student, Invoice } from '../types';

interface StudentsProps {
  role?: UserRole;
}

export const Students: React.FC<StudentsProps> = ({ role }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State including Fee Details
  const [newStudent, setNewStudent] = useState<Partial<Student & { feeAmount: number, paidAmount: number }>>({
    name: '',
    grade: 'Play Group',
    section: 'A',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    feesStatus: 'Pending',
    attendance: 100,
    busRoute: 'Parent Pickup',
    image: `https://picsum.photos/seed/${Date.now()}/200/200`,
    dob: '',
    feeAmount: 50000,
    paidAmount: 0
  });

  const preschoolGroups = ["Play Group", "Pre-KG", "KG 1", "KG 2"];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleCloseModal = () => {
    stopCamera();
    setShowAddModal(false);
    setEditingId(null);
    setNewStudent({
        name: '', grade: 'Play Group', section: 'A', parentName: '', parentPhone: '', parentEmail: '', feesStatus: 'Pending',
        attendance: 100, busRoute: 'Parent Pickup', image: `https://picsum.photos/seed/${Date.now()}/200/200`,
        dob: '', feeAmount: 50000, paidAmount: 0
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFeeStatus = (newStudent.paidAmount || 0) >= (newStudent.feeAmount || 0) ? 'Paid' : 'Pending';
    
    if (editingId) {
      setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...newStudent, feesStatus: finalFeeStatus } as Student : s));
      // Update linked invoice if it exists
      const existingInv = mockInvoices.find(i => i.studentId === editingId);
      if (existingInv) {
        existingInv.amount = newStudent.feeAmount || 0;
        existingInv.status = finalFeeStatus;
      }
    } else {
      const studentId = `ST-2024-${String(students.length + 1).padStart(3, '0')}`;
      const created: Student = {
        ...newStudent,
        id: studentId,
        parentId: `USR-PARENT-${students.length + 1}`,
        feesStatus: finalFeeStatus
      } as Student;
      setStudents([...students, created]);

      // Create a new invoice automatically
      const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        studentId: studentId,
        studentName: newStudent.name || '',
        amount: newStudent.feeAmount || 0,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: finalFeeStatus,
        type: 'Tuition'
      };
      mockInvoices.push(newInvoice);
    }
    handleCloseModal();
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        // Basic CSV Parsing (assuming header: name,grade,section,parentName,parentPhone,parentEmail)
        const newStudentsFromCsv: Student[] = [];
        const startIndex = rows[0][0].toLowerCase().includes('name') ? 1 : 0;
        
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 5) continue;
          
          const studentId = `ST-2024-${String(students.length + newStudentsFromCsv.length + 1).padStart(3, '0')}`;
          newStudentsFromCsv.push({
            id: studentId,
            name: row[0].trim(),
            grade: row[1].trim() || 'Play Group',
            section: row[2].trim() || 'A',
            parentName: row[3].trim(),
            parentPhone: row[4].trim(),
            parentEmail: row[5]?.trim() || '',
            attendance: 100,
            feesStatus: 'Pending',
            busRoute: 'Parent Pickup',
            image: `https://picsum.photos/seed/${studentId}/200/200`,
            dob: '2015-01-01',
            parentId: `USR-PARENT-${Date.now()}-${i}`
          });
        }
        
        if (newStudentsFromCsv.length > 0) {
          setStudents(prev => [...prev, ...newStudentsFromCsv]);
          alert(`Successfully uploaded ${newStudentsFromCsv.length} students!`);
          setShowBulkModal(false);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500">Preschool groups management and child profiles.</p>
        </div>
        {role === UserRole.ADMIN && (
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowBulkModal(true)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center transition-all"
            >
              <Upload className="w-4 h-4" /> Bulk Upload
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center transition-all"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none w-full md:w-auto bg-white"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="All">All Groups</option>
            {preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="p-6 flex flex-col items-center border-b border-slate-50">
              <img src={student.image} alt={student.name} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-slate-50" />
              <h3 className="font-bold text-slate-800 text-lg">{student.name}</h3>
              <p className="text-xs text-slate-400 font-mono mb-2">{student.id}</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">{student.grade}</span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${student.feesStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {student.feesStatus}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 font-medium truncate">{student.parentName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 font-medium">{student.parentPhone}</span>
              </div>
              {student.parentEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium truncate text-xs">{student.parentEmail}</span>
                </div>
              )}
            </div>
            {role === UserRole.ADMIN && (
              <div className="p-3 border-t border-slate-100">
                <button onClick={() => { setEditingId(student.id); setNewStudent({...student, feeAmount: 50000, paidAmount: student.feesStatus === 'Paid' ? 50000 : 0}); setShowAddModal(true); }} className="w-full text-sm text-blue-600 font-bold hover:bg-blue-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Pencil className="w-3 h-3" /> Edit Profile
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Student Profile' : 'Student Enrollment'}</h3>
                 <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveStudent} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Basic Information</h4>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Student Full Name</label>
                          <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. John Smith" />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                            <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                            <select value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>A</option>
                                <option>B</option>
                                <option>C</option>
                            </select>
                        </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                          <input required type="date" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Parent/Guardian Contact</h4>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                          <input required type="text" value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Primary Guardian Name" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Phone</label>
                          <input required type="tel" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Emergency Contact No." />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Email</label>
                          <input required type="email" value={newStudent.parentEmail} onChange={e => setNewStudent({...newStudent, parentEmail: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Communication Email ID" />
                       </div>
                    </div>

                    <div className="space-y-4 col-span-1 md:col-span-2">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" /> Fee Setup
                                </h4>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Annual Fee Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={newStudent.feeAmount} 
                                        onChange={e => setNewStudent({...newStudent, feeAmount: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Paid Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={newStudent.paidAmount} 
                                        onChange={e => setNewStudent({...newStudent, paidAmount: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" 
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-center border-l border-slate-200 pl-6">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Payment Summary</p>
                                    <h5 className={`text-2xl font-black ${ (newStudent.feeAmount || 0) === (newStudent.paidAmount || 0) ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        ₹{newStudent.paidAmount} / ₹{newStudent.feeAmount}
                                    </h5>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Status: <span className={`font-bold uppercase ${(newStudent.paidAmount || 0) >= (newStudent.feeAmount || 0) ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {(newStudent.paidAmount || 0) >= (newStudent.feeAmount || 0) ? 'Paid' : 'Partial/Pending'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="pt-6 border-t flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Discard</button>
                    <button type="submit" className="bg-blue-600 text-white px-10 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95">
                        <Save className="w-4 h-4" /> Save Student Record
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">Bulk Data Enrollment</h3>
                 <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-800">CSV Template Required</p>
                        <p className="text-xs text-blue-600 mt-1">Upload a CSV file with columns in this order: Name, Group, Section, Parent Name, Parent Phone, Parent Email.</p>
                    </div>
                 </div>

                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                 >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                       <FileText className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-700">Choose CSV File</p>
                    <p className="text-xs text-slate-400 mt-1">Drag and drop or click to browse</p>
                    <input 
                       ref={fileInputRef}
                       type="file" 
                       accept=".csv" 
                       className="hidden" 
                       onChange={handleBulkUpload}
                    />
                 </div>

                 <div className="flex flex-col gap-2">
                    <button className="text-blue-600 text-xs font-bold hover:underline w-fit">Download CSV Template</button>
                 </div>

                 <div className="pt-4 border-t flex justify-end">
                    <button onClick={() => setShowBulkModal(false)} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};