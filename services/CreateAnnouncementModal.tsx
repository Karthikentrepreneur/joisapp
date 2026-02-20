import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Paperclip, Image as ImageIcon, Trash2, Edit, Pin } from 'lucide-react';
import { UserRole, ProgramType, Attachment } from '../types';
import { schoolService } from './schoolService';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; message: string; classId: string | null; attachments: Attachment[]; isPinned: boolean }) => Promise<void>;
  userRole: UserRole;
  userClassId?: string;
  initialData?: { title: string; message: string; classId: string | null; attachments: Attachment[]; isPinned?: boolean } | null;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userRole,
  userClassId,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [classId, setClassId] = useState<string>('All');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrFounder = userRole === UserRole.ADMIN || userRole === UserRole.FOUNDER;

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setMessage(initialData.message);
        setClassId(initialData.classId || 'All');
        setAttachments(initialData.attachments || []);
        setIsPinned(initialData.isPinned || false);
      } else {
        setTitle('');
        setMessage('');
        setAttachments([]);
        setIsPinned(false);
        setClassId((!isAdminOrFounder && userClassId) ? userClassId : 'All');
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
      // Ensure correct classId for teachers even if state didn't update
      const effectiveClassId = (!isAdminOrFounder) ? (userClassId || 'All') : classId;

      await onSubmit({
        title,
        message,
        // If Admin selects 'All', send null. If Teacher, send their classId.
        classId: (isAdminOrFounder && effectiveClassId === 'All') ? null : effectiveClassId,
        attachments,
        isPinned
      });
      onClose();
    } catch (error) {
      console.error("Failed to post announcement", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Edit Announcement' : 'New Announcement'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{initialData ? 'Update existing post' : 'Post to bulletin board'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center border border-slate-200 transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Pin Toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isPinned ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Pin Post</span>
            </button>
          </div>

          {/* Target Audience Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</label>
            {isAdminOrFounder ? (
              <div className="relative">
                <select 
                  value={classId} 
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Classes (Public)</option>
                  {PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            ) : (
              <div className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed flex items-center justify-between">
                <span>{userClassId || 'Assigned Class'}</span>
                <span className="text-[10px] bg-slate-200 px-2 py-1 rounded text-slate-500 uppercase tracking-wider">Locked</span>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. School Closed Tomorrow"
              required
              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your announcement here..."
              required
              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 min-h-[140px] resize-none leading-relaxed"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attachments</label>
              <button 
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} 
                {isUploading ? 'Uploading...' : 'Add File'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </div>
            
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 shadow-sm">
                        {file.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{file.size}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                {initialData ? <Edit className="w-4 h-4" /> : <Send className="w-4 h-4" />} 
                {isUploading ? 'Wait for Upload...' : (initialData ? 'Update Announcement' : 'Post Announcement')}
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};