
export enum UserRole {
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  PARENT = 'Parent',
  TRANSPORT = 'Transport Manager'
}

export enum View {
  DASHBOARD = 'Dashboard',
  STUDENTS = 'Students',
  ACADEMICS = 'Academics',
  ATTENDANCE = 'Attendance',
  TRANSPORT = 'Transport',
  SAFETY = 'Safety & CCTV',
  FEES = 'Fees & Finance',
  COMMUNICATION = 'Communication',
  AI_ASSISTANT = 'AI Assistant',
  STAFF = 'Staff Management',
  SETTINGS = 'System Settings',
  LEAVE = 'Leave Management'
}

export type ProgramType = 'Little Seeds' | 'Curiosity Cubs' | 'Odyssey Owls' | 'Future Makers';

export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string; // Combined for display
  dob: string;
  bloodGroup?: string;
  
  // Parent Details
  motherName: string;
  motherEmail: string;
  fatherName: string;
  fatherEmail: string;
  
  // School Details
  program: ProgramType;
  dateOfJoining: string;
  offer: 'Early Bird Offer' | 'Regular' | 'Vijayadasami' | 'New Year' | 'Bridge Course';
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Status & Metadata
  attendance: number;
  feesStatus: 'Paid' | 'Pending' | 'Overdue';
  busRoute: string;
  image: string;
  parentId: string;
  parentPhone: string;
  parentEmail: string;
  address?: string;
}

export interface Staff {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  phone: string;
  aadhaarNumber: string;
  email: string;
  dateOfJoining: string;
  classAssigned?: string;
  maritalStatus: 'Married' | 'Unmarried';
  status: 'Active' | 'On Leave';
  role: 'Teacher' | 'Admin' | 'Driver' | 'Clerk';
  image: string;
  signature?: string;
  
  emergencyContact: {
    firstName: string;
    middleName?: string;
    lastName: string;
    relationship: string;
    phone: string;
  };
  
  salaryDetails?: {
    basic: number;
    allowances: number;
    deductions: number;
    net: number;
  };
}

export interface FeeStructure {
  id: string;
  program: ProgramType;
  amount: number;
  description: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  sender: string;
  targetGroup: 'All' | ProgramType;
  attachmentUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  senderRole?: UserRole;
  text: string;
  timestamp: string;
  isRead?: boolean;
  type?: 'Private' | 'Broadcast';
  role?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  type: 'Tuition' | 'Transport' | 'Library' | 'Activity';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  status: 'Submitted' | 'Pending';
}

export interface AttendanceLog {
  id: string;
  date: string;
  studentId: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Certificate {
  id: string;
  type: 'Bonafide' | 'Transfer' | 'Character' | 'Fee Receipt';
  studentName: string;
  studentId: string;
  requestDate: string;
  status: 'Requested' | 'Teacher Approved' | 'Released' | 'Rejected';
  reason: string;
  issueDate?: string;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  program?: ProgramType;
  dueDate: string;
  assignedBy: string;
  status: 'Active' | 'Closed';
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
}
