import React, { useState, useRef, useEffect } from 'react';
import { mockStudents } from '../data/mockData';
import { Search, Filter, Plus, Phone, Bus, X, Save, Camera, Upload, Pencil } from 'lucide-react';
import { UserRole, Student } from '../types';

interface StudentsProps {
  role?: UserRole;
}

export const Students: React.FC<StudentsProps> = ({ role }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    grade: '5',
    section: 'A',
    parentName: '',
    parentPhone: '',
    feesStatus: 'Pending',
    attendance: 100,
    busRoute: 'Parent Pickup',
    image: `https://picsum.photos/seed/${Date.now()}/200/200`,
    dob: ''
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Camera Functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set canvas dimensions to match the video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Mirror the context to match the CSS mirrored video
        context.translate(videoRef.current.videoWidth, 0);
        context.scale(-1, 1);

        // Draw the current frame
        context.drawImage(videoRef.current, 0, 0);
        
        // Convert to data URL
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setNewStudent(prev => ({ ...prev, image: dataUrl }));
        stopCamera();
      }
    }
  };

  // Attach stream to video element when camera is opened
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCloseModal = () => {
    stopCamera();
    setShowAddModal(false);
    setEditingId(null);
    // Reset form
    setNewStudent({
      name: '',
      grade: '5',
      section: 'A',
      parentName: '',
      parentPhone: '',
      feesStatus: 'Pending',
      attendance: 100,
      busRoute: 'Parent Pickup',
      image: `https://picsum.photos/seed/${Date.now()}/200/200`,
      dob: ''
    });
  };

  const handleAddClick = () => {
    setEditingId(null);
    setNewStudent({
      name: '',
      grade: '5',
      section: 'A',
      parentName: '',
      parentPhone: '',
      feesStatus: 'Pending',
      attendance: 100,
      busRoute: 'Parent Pickup',
      image: `https://picsum.photos/seed/${Date.now()}/200/200`,
      dob: ''
    });
    setShowAddModal(true);
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setNewStudent({ ...student });
    setShowAddModal(true);
  };

  // File Upload Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing student
      setStudents(prev => prev.map(student => 
        student.id === editingId 
          ? { ...student, ...newStudent } as Student
          : student
      ));
    } else {
      // Create new student
      const createdStudent: Student = {
        id: `ST-2024-${String(students.length + 1).padStart(3, '0')}`,
        name: newStudent.name || 'Unknown',
        grade: newStudent.grade || '5',
        section: newStudent.section || 'A',
        attendance: 0,
        feesStatus: newStudent.feesStatus as any,
        busRoute: newStudent.busRoute || 'Parent Pickup',
        image: newStudent.image || `https://picsum.photos/seed/${newStudent.name}/200/200`,
        parentName: newStudent.parentName || 'Unknown',
        parentId: `USR-PARENT-${students.length + 1}`,
        parentPhone: newStudent.parentPhone || '',
        dob: newStudent.dob || '2014-01-01'
      };
      setStudents([...students, createdStudent]);
    }
    handleCloseModal();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500">Manage student profiles, academic records, and contacts.</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <option value="All">All Grades</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="p-6 flex flex-col items-center border-b border-slate-50">
              <div className="relative mb-4">
                <img src={student.image} alt={student.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50" />
                <div className={`absolute bottom-0 right-0 w-5 h-5 border-2 border-white rounded-full ${student.attendance > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{student.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1 mb-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{student.id}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Grade {student.grade}-{student.section}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${student.feesStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {student.feesStatus === 'Paid' ? 'Fees Paid' : 'Fees Due'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Parent Contact</p>
                  <p className="font-medium">{student.parentPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <Bus className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Transport</p>
                  <p className="font-medium">{student.busRoute}</p>
                </div>
              </div>
            </div>

            {role === UserRole.ADMIN && (
              <div className="p-3 border-t border-slate-100 flex gap-2 justify-center">
                <button 
                  onClick={() => handleEditClick(student)}
                  className="w-full text-sm text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
           <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">
                   {editingId ? 'Edit Student Details' : 'Admit New Student'}
                 </h3>
                 <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleSaveStudent} className="space-y-6">
                 {/* Photo Capture Section */}
                 <div className="flex flex-col items-center justify-center mb-6">
                    {isCameraOpen ? (
                      <div className="relative w-full max-w-xs aspect-square bg-black rounded-full overflow-hidden shadow-2xl border-4 border-slate-100">
                        {/* Mirrored Video Feed */}
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        <button 
                           type="button" 
                           onClick={capturePhoto}
                           className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all group"
                           title="Capture Photo"
                        >
                           <Camera className="w-6 h-6 text-slate-800 group-hover:text-blue-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative group cursor-pointer" onClick={startCamera}>
                         <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
                            <img src={newStudent.image} alt="Profile" className="w-full h-full object-cover" />
                         </div>
                         <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                         </div>
                         <div className="absolute bottom-0 right-1 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-sm">
                            <Camera className="w-4 h-4" />
                         </div>
                      </div>
                    )}
                    
                    {isCameraOpen ? (
                      <button type="button" onClick={stopCamera} className="text-xs text-red-500 font-bold mt-2 hover:underline">Cancel Camera</button>
                    ) : (
                      <div className="flex flex-col items-center mt-3">
                         <p className="text-xs text-slate-400 font-medium mb-2">Tap photo to open camera</p>
                         <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()} 
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                         >
                            <Upload className="w-3 h-3" /> or Upload from Device
                         </button>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                         />
                      </div>
                    )}
                    
                    {/* Hidden canvas for capturing the image */}
                    <canvas ref={canvasRef} className="hidden" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Student Details</h4>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                          <input 
                             required 
                             type="date" 
                             max={new Date().toISOString().split('T')[0]}
                             value={newStudent.dob || ''} 
                             onChange={e => setNewStudent({...newStudent, dob: e.target.value})} 
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl" 
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                            <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white">
                               <option value="4">4</option>
                               <option value="5">5</option>
                               <option value="6">6</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                            <input type="text" value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Parent Details</h4>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                          <input required type="text" value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                          <input required type="tel" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                       </div>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                       <Save className="w-4 h-4" /> {editingId ? 'Update Record' : 'Save Record'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};