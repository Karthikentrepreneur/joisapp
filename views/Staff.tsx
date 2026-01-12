
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/persistence';
import { Search, Plus, Phone, Mail, X, Save, Loader2, Trash2, Pencil, Camera, Image as ImageIcon } from 'lucide-react';
import { UserRole, Staff as StaffType } from '../types';
import { ToastType } from '../components/Toast';

interface StaffProps {
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

export const Staff: React.FC<StaffProps> = ({ role, showToast }) => {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [newStaff, setNewStaff] = useState<Partial<StaffType> & { basicSalary: number, allowances: number, deductions: number }>({
    name: '', role: 'Teacher', email: '', phone: '', status: 'Active', classAssigned: '',
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    basicSalary: 0, allowances: 0, deductions: 0
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('staff');
      setStaffList(data);
    } catch (e) {
      showToast?.("Fetch Error", "error", "Could not load staff directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    const sub = db.subscribe('staff', loadStaff, loadStaff, loadStaff);
    return () => { sub.unsubscribe(); };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

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
      showToast?.("Camera Error", "error", "Camera access denied.");
    }
  };

  const handlePhotoUpload = async (base64: string) => {
    setIsUploading(true);
    try {
      const compressed = await compressImage(base64);
      const blob = dataURLToBlob(compressed);
      const fileName = `staff-${Date.now()}.jpg`;
      const publicUrl = await db.uploadFile('school-assets', fileName, blob);
      setNewStaff(prev => ({ ...prev, image: publicUrl }));
      showToast?.("Uploaded", "success", "Staff photo ready.");
    } catch (err: any) {
      showToast?.("Upload Failed", "error", "Could not reach storage vault.");
    } finally {
      setIsUploading(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        await handlePhotoUpload(canvasRef.current.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setSaving(true);
    
    const staffData: StaffType = {
      id: editingId || `EMP-${Date.now().toString().slice(-4)}`,
      name: newStaff.name || '',
      role: newStaff.role as any,
      email: newStaff.email || '',
      phone: newStaff.phone || '',
      status: 'Active',
      image: newStaff.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStaff.name}`,
      salaryDetails: {
        basic: newStaff.basicSalary,
        allowances: newStaff.allowances,
        deductions: newStaff.deductions,
        net: newStaff.basicSalary + newStaff.allowances - newStaff.deductions
      }
    };

    try {
      if (editingId) {
        await db.update('staff', editingId, staffData);
        showToast?.("Success", "success", "Staff record modified.");
      } else {
        await db.create('staff', staffData);
        showToast?.("Success", "success", "New staff member onboarded.");
      }
      handleCloseModal();
      loadStaff();
    } catch (err: any) {
      showToast?.("Error", "error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently remove ${name} from staff registry?`)) return;
    try {
      await db.delete('staff', id);
      showToast?.("Removed", "success", "Record purged from database.");
      loadStaff();
    } catch (e) {
      showToast?.("Failed", "error", "Database connection failed.");
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowAddModal(false);
    setEditingId(null);
    setNewStaff({
      name: '', role: 'Teacher', email: '', phone: '', status: 'Active', classAssigned: '',
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      basicSalary: 0, allowances: 0, deductions: 0
    });
  };

  const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800">Staff Management</h2><p className="text-slate-500">School educators and administrative personnel.</p></div>
        {role === UserRole.ADMIN && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"><Plus className="w-4 h-4" /> Add Staff Member</button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400" />
        <input type="text" placeholder="Search by name..." className="flex-1 outline-none text-sm bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
           <Mail className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <p className="font-bold">No staff records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStaff.map(staff => (
            <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col items-center relative group hover:shadow-xl transition-all">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${staff.role === 'Teacher' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              {role === UserRole.ADMIN && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingId(staff.id); setNewStaff({ ...staff, basicSalary: staff.salaryDetails?.basic || 0, allowances: staff.salaryDetails?.allowances || 0, deductions: staff.salaryDetails?.deductions || 0 }); setShowAddModal(true); }} className="p-2 bg-white rounded-lg text-blue-600 shadow-sm hover:bg-blue-50 border border-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                   <button onClick={() => handleDelete(staff.id, staff.name)} className="p-2 bg-white rounded-lg text-rose-600 shadow-sm hover:bg-rose-50 border border-slate-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <img src={staff.image} className="w-20 h-20 rounded-full mb-4 border-2 border-slate-50 group-hover:scale-110 transition-transform object-cover" />
              <h3 className="font-black text-slate-800 text-center">{staff.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{staff.role}</p>
              <div className="w-full mt-4 pt-4 border-t border-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tight"><Phone className="w-3.5 h-3.5 text-blue-400" /> {staff.phone}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tight"><Mail className="w-3.5 h-3.5 text-blue-400" /> <span className="truncate">{staff.email}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Profile' : 'New Staff Profile'}</h3><button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600" disabled={saving}><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleCreateStaff} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="flex flex-col items-center mb-4">
                          <div className="relative w-24 h-24 mb-3">
                             {showCamera ? (
                                <div className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-blue-500 z-10 bg-black">
                                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                   <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                                      <button type="button" onClick={capturePhoto} className="bg-blue-600 text-white p-1.5 rounded-full"><Camera className="w-3 h-3" /></button>
                                      <button type="button" onClick={stopCamera} className="bg-rose-500 text-white p-1.5 rounded-full"><X className="w-3 h-3" /></button>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <img src={newStaff.image} className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 shadow-sm" alt="Preview" />
                                   {isUploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}
                                   <div className="absolute -bottom-2 -right-2 flex flex-col gap-1">
                                      <button type="button" onClick={startCamera} className="bg-blue-600 text-white p-1.5 rounded-lg border-2 border-white"><Camera className="w-3 h-3" /></button>
                                      <button type="button" onClick={() => photoFileInputRef.current?.click()} className="bg-emerald-600 text-white p-1.5 rounded-lg border-2 border-white"><ImageIcon className="w-3 h-3" /></button>
                                      <input type="file" ref={photoFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const rd = new FileReader(); rd.onloadend = async () => { await handlePhotoUpload(rd.result as string); }; rd.readAsDataURL(file); } }} accept="image/*" className="hidden" />
                                   </div>
                                </>
                             )}
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                       </div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label><input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white" /></div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Role</label><select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white"><option value="Teacher">Teacher</option><option value="Admin">Admin</option><option value="Driver">Driver</option></select></div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email</label><input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white" /></div>
                       <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Phone</label><input required type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white" /></div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Details</h4>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Basic Salary (₹)</label><input type="number" value={newStaff.basicSalary || ''} onChange={e => setNewStaff({...newStaff, basicSalary: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Allowances (₹)</label><input type="number" value={newStaff.allowances || ''} onChange={e => setNewStaff({...newStaff, allowances: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                          <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Deductions (₹)</label><input type="number" value={newStaff.deductions || ''} onChange={e => setNewStaff({...newStaff, deductions: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" /></div>
                       </div>
                    </div>
                 </div>
                 <div className="pt-4 border-t flex justify-end gap-3"><button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl text-slate-400 font-black uppercase tracking-widest text-xs" disabled={saving}>Cancel</button><button type="submit" disabled={saving || isUploading} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingId ? 'Update Record' : 'Save Record'}
                 </button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
