import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Paperclip, Image as ImageIcon, Trash2, Edit, Calendar } from 'lucide-react';
import { UserRole, ProgramType, Attachment } from '../types';
import { schoolService } from './schoolService';

interface CreateHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; subject: string; dueDate: string; program: string; attachments: Attachment[] }) => Promise<void>;
  userRole: UserRole;
  userClassId?: string;
  initialData?: any;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Art', 'Music', 'Physical Education', 'General Knowledge'];

export const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userRole,
  userClassId,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [dueDate, setDueDate] = useState('');
  const [program, setProgram] = useState<string>('Little Seeds');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrFounder = userRole === UserRole.ADMIN || userRole === UserRole.FOUNDER;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setSubject(initialData.subject);
        setDueDate(initialData.dueDate);
        setProgram(initialData.program || 'Little Seeds');
        setAttachments(initialData.attachments || []);
      } else {
        setTitle('');
        setDescription('');
        setSubject(SUBJECTS[0]);
        setDueDate('');
        setAttachments([]);
        setProgram((!isAdminOrFounder) ? (userClassId || 'Little Seeds') : 'Little Seeds');
      }
    }
  }, [isOpen, initialData, isAdminOrFounder, userClassId]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const url = await schoolService.uploadAttachment(file);
        const newAttachment: Attachment = {
          name: file.name,
          url: url,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          size: `${(file.size / 1024).toFixed(1)} KB`
        };
        setAttachments(prev => [...prev, newAttachment]);
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const effectiveProgram = (!isAdminOrFounder) ? (userClassId || 'Little Seeds') : program;

      await onSubmit({
        title,
        description,
        subject,
        dueDate,
        program: effectiveProgram,
        attachments
      });
      onClose();
    } catch (error) {
      console.error("Failed to post homework", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Edit Homework' : 'Assign Homework'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Create new assignment</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center border border-slate-200 transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
              {isAdminOrFounder ? (
                <select value={program} onChange={(e) => setProgram(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed">{userClassId || 'Assigned Class'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Exercises" required className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructions</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed instructions..." required className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attachments</label>
              <button type="button" onClick={() => !isUploading && fileInputRef.current?.click()} disabled={isUploading} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} {isUploading ? 'Uploading...' : 'Add File'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 text-slate-400">
                        {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                    </div>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> {initialData ? 'Update Assignment' : 'Assign Homework'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};