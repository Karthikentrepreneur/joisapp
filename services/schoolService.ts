
import { db } from './persistence';
import { cryptoService } from './cryptoService';
import { Student, Invoice, AttendanceRecord, AttendanceLog, LeaveRequest, Certificate, Notice, ChatMessage, UserRole, Attachment, ProgramType, Announcement } from '../types';

/**
 * schoolService contains all high-level business logic.
 * Every function here is end-to-end linked to the persistence layer.
 */
export const schoolService = {
  
  // --- REAL-TIME E2EE MESSAGING ---
  async sendMessage(senderId: string, senderName: string, senderRole: UserRole, receiverId: string, text: string, attachments: Attachment[] = []) {
    // 1. Establish encryption key based on participants (E2EE)
    const threadId = [senderId, receiverId].sort().join(':');
    
    // 2. Encrypt before any storage (Broadcasts are public to the school)
    const isPublic = receiverId === 'ALL' || receiverId.startsWith('GROUP_');
    const encryptedText = isPublic
      ? text 
      : await cryptoService.encrypt(text, threadId);

    const message: ChatMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      receiverId,
      senderName,
      senderRole,
      text: encryptedText,
      timestamp: new Date().toISOString(),
      isRead: false,
      // Fix: Aligned with the 'Broadcast' type added to ChatMessage in types.ts
      type: isPublic ? 'Broadcast' : 'Private',
      attachments
    };
    
    // 3. Persist to DB (Real-time enabled if Supabase)
    await db.create('chats', message);
    return message;
  },

  async sendBroadcast(senderId: string, senderName: string, senderRole: UserRole, text: string, priority: 'High' | 'Medium' | 'Low' = 'Medium', targetGroup: 'All' | ProgramType = 'All', attachments: Attachment[] = []) {
    // 1. Create a public notice entry
    const notice = await this.broadcastNotice({
      title: `Official Bulletin from ${senderRole}`,
      content: text,
      priority,
      sender: senderName,
      targetGroup,
      attachments
    });

    // 2. Inject into the communication stream
    const receiverId = targetGroup === 'All' ? 'ALL' : `GROUP_${targetGroup}`;
    await this.sendMessage(senderId, senderName, senderRole, receiverId, text, attachments);
    return notice;
  },

  // --- ATTENDANCE & ROLL CALL ---
  async markAttendance(date: string, records: Record<string, 'Present' | 'Absent' | 'Late'>) {
    const statuses = Object.values(records);
    const presentCount = statuses.filter(s => s !== 'Absent').length;
    const absentCount = statuses.filter(s => s === 'Absent').length;
    const lateCount = statuses.filter(s => s === 'Late').length;

    const summaryRecord: AttendanceRecord = {
      id: `AR-${Date.now()}`,
      date,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      // Fix: Changed 'Done' to 'Completed' to match the allowed types in AttendanceRecord status
      status: 'Completed'
    };

    // 1. Save Summary Record
    await db.create('attendanceRecords', summaryRecord);

    // 2. Save individual student logs for historical reporting
    const students = await db.getAll('students');
    for (const student of students) {
      const status = records[student.id];
      if (status) {
        // Individual Log
        const log: AttendanceLog = {
          id: `AL-${Date.now()}-${student.id}`,
          date,
          studentId: student.id,
          // Fix: AttendanceLog status is now updated in types.ts to accept 'Present' | 'Absent' | 'Late'
          status
        };
        await db.create('attendanceLogs', log);

        // Update student aggregate percentages
        const delta = status === 'Absent' ? -1.0 : 0.05;
        const newAttendance = Math.max(0, Math.min(100, student.attendance + delta));
        await db.update('students', student.id, { 
          attendance: Number(newAttendance.toFixed(1)) 
        });
      }
    }

    return summaryRecord;
  },

  // --- FINANCE & LEDGER ---
  async collectPayment(invoiceId: string) {
    const invoices = await db.getAll('invoices');
    const target = invoices.find(i => i.id === invoiceId);
    if (!target) throw new Error("Reference ID invalid");

    // 1. Update Invoice Status
    await db.update('invoices', invoiceId, { status: 'Paid' });

    // 2. Recalculate Student Standing
    const allInvoices = await db.getAll('invoices');
    const studentInvoices = allInvoices.filter(i => i.studentId === target.studentId);
    const remainingPending = studentInvoices.some(i => i.status !== 'Paid');
    
    await db.update('students', target.studentId, { 
      feesStatus: remainingPending ? 'Pending' : 'Paid' 
    });
  },

  // --- DOCUMENT VERIFICATION ---
  async updateDocumentStatus(docId: string, status: Certificate['status']) {
    const update: Partial<Certificate> = { 
      status,
      // Fix: 'Issued' is correctly typed in Certificate status in types.ts
      issueDate: status === 'Issued' ? new Date().toISOString().split('T')[0] : undefined
    };
    await db.update('certificates', docId, update);
  },

  // --- ANNOUNCEMENTS ---
  async broadcastNotice(notice: Partial<Notice>) {
    const newNotice = {
      ...notice,
      id: `N-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    } as Notice;
    await db.create('notices', newNotice);
    return newNotice;
  },

  // --- DATA ACCESS HELPERS ---
  async getAllChats() {
    return await db.getAll('chats');
  },
  
  async getAllNotices() {
    return await db.getAll('notices');
  },

  async getAll(collection: any) {
    return await db.getAll(collection);
  },

  // --- FILE UPLOAD ---
  async uploadAttachment(file: File) {
    const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    return await db.uploadFile('attachments', path, file);
  },

  // --- ANNOUNCEMENTS (NEW) ---
  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) {
    const newAnnouncement: any = {
      ...announcement,
      id: `ANC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Map to snake_case for DB compatibility
      class_id: announcement.classId === 'All' ? null : announcement.classId,
      created_by: announcement.createdBy,
      read_by: [],
      likes: []
    };
    await db.create('announcements', newAnnouncement);
    return { ...newAnnouncement, readBy: [] };
  },

  async getAnnouncements(userRole: UserRole, classId?: string, userId?: string) {
    const all = await db.getAll('announcements');
    
    // Map DB columns (snake_case) to frontend properties (camelCase)
    const mapped = all.map((a: any) => ({
      ...a,
      // Handle both camelCase (legacy/local) and snake_case (DB)
      classId: a.class_id !== undefined ? a.class_id : a.classId,
      createdBy: a.created_by || a.createdBy,
      readBy: Array.isArray(a.read_by) ? a.read_by : (Array.isArray(a.readBy) ? a.readBy : []),
      likes: Array.isArray(a.likes) ? a.likes : []
    }));

    if (userRole === UserRole.FOUNDER || userRole === UserRole.ADMIN) {
      return mapped;
    }
    
    return mapped.filter((a: any) => {
      // Always show if created by the current user
      if (userId && a.createdBy === userId) return true;
      // Global announcements
      if (!a.classId || a.classId === 'All') return true;
      // Class specific
      return a.classId === classId;
    });
  },

  async deleteAnnouncement(id: string) {
    await db.delete('announcements', id);
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>) {
    await db.update('announcements', id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async markAnnouncementAsRead(id: string, userId: string) {
    const all = await db.getAll('announcements');
    const announcement = all.find(a => a.id === id);
    
    if (announcement) {
      const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : (Array.isArray(announcement.readBy) ? announcement.readBy : []);
      if (!readBy.includes(userId)) {
        await db.update('announcements', id, { read_by: [...readBy, userId] });
      }
    }
  },

  async toggleAnnouncementLike(id: string, userId: string) {
    const all = await db.getAll('announcements');
    const announcement = all.find(a => a.id === id);
    
    if (announcement) {
      const likes = Array.isArray(announcement.likes) ? announcement.likes : [];
      let newLikes;
      if (likes.includes(userId)) {
        newLikes = likes.filter(uid => uid !== userId);
      } else {
        newLikes = [...likes, userId];
      }
      await db.update('announcements', id, { likes: newLikes });
      return newLikes;
    }
    return [];
  },

  // --- MESSAGING HELPERS ---
  async getMessagesForThread(participantA: string, participantB: string) {
    const threadId = [participantA, participantB].sort().join(':');
    const allChats = await db.getAll('chats');
    const messages = allChats.filter(msg => {
      if (msg.type === 'Broadcast') return false;
      if (!msg.senderId || !msg.receiverId) return false;
      const currentThreadId = [msg.senderId, msg.receiverId].sort().join(':');
      return currentThreadId === threadId;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return await Promise.all(messages.map(async (msg) => {
      try {
        const decryptedText = await cryptoService.decrypt(msg.text, threadId);
        return { ...msg, text: decryptedText };
      } catch (e) {
        return msg;
      }
    }));
  },

  async getAllThreads(currentUserId?: string) {
    const allChats = await db.getAll('chats');
    const threads: Record<string, ChatMessage[]> = {};
    
    allChats.forEach(msg => {
      if (msg.type === 'Broadcast') return;
      if (!msg.senderId || !msg.receiverId) return;
      
      const threadId = [msg.senderId, msg.receiverId].sort().join(':');
      if (!threads[threadId]) threads[threadId] = [];
      threads[threadId].push(msg);
    });
    
    return Object.entries(threads).map(([threadId, messages]) => ({
      threadId,
      participants: threadId.split(':'),
      lastMessage: messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
      messageCount: messages.length,
      unreadCount: currentUserId 
        ? messages.filter(m => m.receiverId === currentUserId && !m.isRead).length 
        : 0
    }));
  }
};
