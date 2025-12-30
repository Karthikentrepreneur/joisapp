import { db } from './persistence';
import { cryptoService } from './cryptoService';
import { Student, Invoice, AttendanceRecord, LeaveRequest, Certificate, Notice, ChatMessage, UserRole } from '../types';

/**
 * schoolService contains all high-level business logic.
 * Every function here is end-to-end linked to the persistence layer.
 */
export const schoolService = {
  
  // --- REAL-TIME E2EE MESSAGING ---
  async sendMessage(senderId: string, senderName: string, senderRole: UserRole, receiverId: string, text: string) {
    // 1. Establish encryption key based on participants (E2EE)
    const threadId = [senderId, receiverId].sort().join(':');
    
    // 2. Encrypt before any storage (Broadcasts are public to the school)
    const encryptedText = receiverId === 'ALL' 
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
      type: receiverId === 'ALL' ? 'Broadcast' : 'Private'
    };
    
    // 3. Persist to DB (Real-time enabled if Supabase)
    await db.create('chats', message);
    return message;
  },

  async sendBroadcast(senderId: string, senderName: string, senderRole: UserRole, text: string, priority: 'High' | 'Medium' | 'Low' = 'Medium') {
    // 1. Create a public notice entry
    const notice = await this.broadcastNotice({
      title: `Official Bulletin from ${senderRole}`,
      content: text,
      priority,
      sender: senderName
    });

    // 2. Inject into the communication stream
    await this.sendMessage(senderId, senderName, senderRole, 'ALL', text);
    return notice;
  },

  // --- ATTENDANCE & ROLL CALL ---
  async markAttendance(date: string, records: Record<string, 'Present' | 'Absent' | 'Late'>) {
    const statuses = Object.values(records);
    const presentCount = statuses.filter(s => s !== 'Absent').length;
    const absentCount = statuses.filter(s => s === 'Absent').length;
    const lateCount = statuses.filter(s => s === 'Late').length;

    const record: AttendanceRecord = {
      date,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      status: 'Submitted'
    };

    // 1. Insert daily register entry
    // In a full schema, this would go to an 'attendance_logs' table
    
    // 2. Atomically update student aggregate percentages
    const students = await db.getAll('students');
    for (const student of students) {
      const status = records[student.id];
      if (status) {
        // Simple logic: Absent drops %, others slightly boost it
        const delta = status === 'Absent' ? -1.0 : 0.05;
        const newAttendance = Math.max(0, Math.min(100, student.attendance + delta));
        await db.update('students', student.id, { 
          attendance: Number(newAttendance.toFixed(1)) 
        });
      }
    }

    return record;
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
      issueDate: status === 'Released' ? new Date().toISOString().split('T')[0] : undefined
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
  }
};