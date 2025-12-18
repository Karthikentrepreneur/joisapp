import React, { useState, useRef, useEffect } from 'react';
import { mockStudents, mockInvoices } from '../data/mockData';
import { Search, Filter, Plus, Phone, Bus, X, Save, Camera, Pencil, DollarSign } from 'lucide-react';
import { UserRole, Student, Invoice } from '../types';

interface StudentsProps {
  role?: UserRole;
}

export const Students: React.FC<StudentsProps> = ({ role }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State including Fee Details
  const [newStudent, setNewStudent] = useState<Partial<Student & { feeAmount: number, paidAmount: number }>>({
    name: '',
    grade: 'Play Group',
    section: 'A',
    parentName: '',
    parentPhone: '',
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
        name: '', grade: 'Play Group', section: 'A', parentName: '', parentPhone: '', feesStatus: 'Pending',
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

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500">Preschool groups management and child profiles.</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
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
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 font-medium">{student.parentPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Bus className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 font-medium">{student.busRoute}</span>
              </div>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Student' : 'Admit Student'}</h3>
                 <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveStudent} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
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
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Phone</label>
                          <input required type="tel" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Fee Information
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Total Fee Amount (₹)</label>
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
                                <div className="pt-1 flex justify-between text-xs">
                                    <span className="text-slate-500 font-medium">Balance:</span>
                                    <span className="font-bold text-red-600">₹{(newStudent.feeAmount || 0) - (newStudent.paidAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all"><Save className="w-4 h-4" /> Save Record</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};