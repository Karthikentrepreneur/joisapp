
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/persistence';
import { Search, Filter, Plus, Phone, Mail, Bus, X, Save, Pencil, DollarSign, Loader2, Upload, Camera, RefreshCw, Image as ImageIcon, Trash2 } from 'lucide-react';
import { UserRole, Student, Invoice } from '../types';
import { ToastType } from '../components/Toast';

interface StudentsProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const compressImage = (base64: string, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
};

export const Students: React.FC<StudentsProps> = ({ role, showToast }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [newStudent, setNewStudent] = useState<Partial<Student & { feeAmount: number, paidAmount: number }>>({
    name: '', grade: 'Play Group', section: 'A', parentName: '', parentPhone: '', parentEmail: '', feesStatus: 'Pending',
    attendance: 100, busRoute: 'Parent Pickup', image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    dob: '', feeAmount: 50000, paidAmount: 0
  });

  const preschoolGroups = ["Play Group", "Pre-KG", "KG 1", "KG 2"];

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('students');
      setStudents(data);
    } catch (e) {
      showToast?.("Fetch Error", "error", "Could not load student directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadStudents(); 
    const sub = db.subscribe('students', loadStudents, loadStudents, loadStudents);
    return () => { sub.unsubscribe(); };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const [showCamera, setShowCamera] = useState(false);
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (err) {
      showToast?.("Camera Error", "error", "Access denied or camera missing.");
    }
  };

  const handlePhotoUpload = async (base64: string) => {
    setIsUploading(true);
    try {
      const compressed = await compressImage(base64);
      const blob = dataURLToBlob(compressed);
      const fileName = `student-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const publicUrl = await db.uploadFile('school-assets', fileName, blob);
      setNewStudent(prev => ({ ...prev, image: publicUrl }));
      showToast?.("Photo Ready", "success", "Profile image uploaded to cloud.");
    } catch (err: any) {
      console.error("Upload failed", err);
      showToast?.("Upload Failed", "error", "Ensure 'school-assets' bucket exists in Supabase.");
    } finally {
      setIsUploading(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawImageData = canvas.toDataURL('image/jpeg');
        await handlePhotoUpload(rawImageData);
        stopCamera();
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s profile? This action is permanent.`)) return;
    try {
      await db.delete('students', id);
      showToast?.("Record Deleted", "success", `${name} removed from registry.`);
      loadStudents();
    } catch (e) {
      showToast?.("Delete Failed", "error", "Record is locked or database offline.");
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      showToast?.("Uploading...", "info", "Please wait for the photo to finish.");
      return;
    }
    setSaving(true);
    const finalFeeStatus = (newStudent.paidAmount || 0) >= (newStudent.feeAmount || 0) ? 'Paid' : 'Pending';
    const { feeAmount, paidAmount, ...cleanStudentData } = newStudent;
    const studentToSave = { ...cleanStudentData, feesStatus: finalFeeStatus, dob: cleanStudentData.dob || null };

    try {
      if (editingId) {
        await db.update('students', editingId, studentToSave);
        showToast?.("Updated", "success", `${newStudent.name}'s profile saved.`);
      } else {
        const studentId = `ST-${Date.now().toString().slice(-6)}`;
        await db.create('students', { ...studentToSave, id: studentId, parentId: `USR-P-${Date.now()}` });
        const newInvoice: Invoice = {
          id: `INV-${Date.now()}`, studentId: studentId, studentName: newStudent.name || '',
          amount: newStudent.feeAmount || 0, dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: finalFeeStatus, type: 'Tuition'
        };
        await db.create('invoices', newInvoice);
        showToast?.("Success", "success", `${newStudent.name} admitted successfully.`);
      }
      await loadStudents();
      handleCloseModal();
    } catch (err: any) {
      showToast?.("Error", "error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      const dataRows = rows.slice(1);
      setSaving(true);
      let successCount = 0;

      try {
        for (let i = 0; i < dataRows.length; i++) {
          const columns = dataRows[i].split(',').map(col => col.trim());
          if (columns.length < 6) continue;

          const [name, grade, section, parentName, parentPhone, parentEmail] = columns;
          const studentId = `ST-BK-${Date.now()}-${i}`;
          
          await db.create('students', {
            id: studentId, name, grade: grade || 'Play Group', section: section || 'A',
            parentName, parentPhone, parentEmail, parentId: `USR-P-BK-${Date.now()}-${i}`,
            attendance: 100, feesStatus: 'Pending', busRoute: 'Parent Pickup',
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            dob: null
          });
          successCount++;
        }
        showToast?.("Import Complete", "success", `Successfully imported ${successCount} students.`);
        loadStudents();
      } catch (err: any) {
        showToast?.("Import Partial Failure", "error", `Imported ${successCount} records before error.`);
      } finally {
        setSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowAddModal(false);
    setEditingId(null);
    setNewStudent({
        name: '', grade: 'Play Group', section: 'A', parentName: '', parentPhone: '', parentEmail: '', feesStatus: 'Pending',
        attendance: 100, busRoute: 'Parent Pickup', image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        dob: '', feeAmount: 50000, paidAmount: 0
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Student Directory</h2><p className="text-slate-500">Manage preschool groups and child profiles.</p></div>
        {role === UserRole.ADMIN && (
          <div className="flex gap-3 w-full md:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={saving} className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2 justify-center flex-1 md:flex-none">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-blue-500" />} Bulk Import
            </button>
            <button onClick={() => setShowAddModal(true)} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 justify-center flex-1 md:flex-none"><Plus className="w-4 h-4" /> Add Student</button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name or ID..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none w-full md:w-auto bg-white" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="All">All Groups</option>{preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mb-2" /><p className="font-medium">Fetching records...</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative">
              {role === UserRole.ADMIN && (
                <button 
                  onClick={() => handleDelete(student.id, student.name)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-lg text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="p-6 flex flex-col items-center border-b border-slate-50">
                <img src={student.image} alt={student.name} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-slate-50" />
                <h3 className="font-bold text-slate-800 text-lg">{student.name}</h3>
                <p className="text-xs text-slate-400 font-mono mb-2">{student.id}</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">{student.grade}</span>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${student.feesStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{student.feesStatus}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 space-y-2 text-sm">
                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-slate-600 font-medium">{student.parentPhone}</span></div>
                <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span className="text-slate-600 font-medium truncate max-w-full">{student.parentEmail || 'No email'}</span></div>
              </div>
              {role === UserRole.ADMIN && (
                <div className="p-3 border-t border-slate-100"><button onClick={() => { setEditingId(student.id); setNewStudent({...student, feeAmount: 50000, paidAmount: student.feesStatus === 'Paid' ? 50000 : 0}); setShowAddModal(true); }} className="w-full text-sm text-blue-600 font-bold hover:bg-blue-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2"><Pencil className="w-3 h-3" /> Edit Profile</button></div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Student' : 'Admit Student'}</h3><button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600" disabled={saving}><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleSaveStudent} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Student Info</h4>
                       <div className="flex flex-col items-center mb-4">
                          <div className="relative w-32 h-32 mb-3">
                             {showCamera ? (
                                <div className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg z-10">
                                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                      <button type="button" onClick={capturePhoto} disabled={isUploading} className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                                         {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                      </button>
                                      <button type="button" onClick={stopCamera} className="bg-rose-500 text-white p-2 rounded-full shadow-md hover:bg-rose-600 transition-colors"><X className="w-4 h-4" /></button>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <img src={newStudent.image} className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 shadow-sm" alt="Student Preview" />
                                   {isUploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}
                                   <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                                      <button type="button" onClick={startCamera} disabled={isUploading} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition-all border-2 border-white"><Camera className="w-4 h-4" /></button>
                                      <button type="button" onClick={() => photoFileInputRef.current?.click()} disabled={isUploading} className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg hover:bg-emerald-700 transition-all border-2 border-white"><ImageIcon className="w-4 h-4" /></button>
                                      <input type="file" ref={photoFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { await handlePhotoUpload(reader.result as string); }; reader.readAsDataURL(file); } }} accept="image/*" className="hidden" />
                                   </div>
                                </>
                             )}
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                       </div>
                       <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white" /></div>
                       <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Group</label><select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white">{preschoolGroups.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Section</label><select value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"><option>A</option><option>B</option></select></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Fees Info</h4>
                            <div className="space-y-3">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Total (₹)</label><input type="number" value={newStudent.feeAmount} onChange={e => setNewStudent({...newStudent, feeAmount: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Paid (₹)</label><input type="number" value={newStudent.paidAmount} onChange={e => setNewStudent({...newStudent, paidAmount: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><Bus className="w-4 h-4 text-blue-500" /> Transport</h4>
                           <select value={newStudent.busRoute} onChange={e => setNewStudent({...newStudent, busRoute: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                <option>Parent Pickup</option><option>Route 01 - North</option><option>Route 02 - South</option><option>Route 03 - East</option><option>Route 04 - West</option>
                           </select>
                        </div>
                    </div>
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors" disabled={saving || isUploading}>Cancel</button>
                    <button type="submit" disabled={saving || isUploading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Syncing...' : 'Save Record'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
