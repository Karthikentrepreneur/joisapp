
export enum UserRole {
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  PARENT = 'Parent',
  TRANSPORT = 'Bus Manager',
  FOUNDER = 'Founder'
}

export enum View {
  DASHBOARD = 'Home',
  STUDENTS = 'Students',
  ACADEMICS = 'Academics',
  ATTENDANCE = 'Attendance',
  TRANSPORT = 'Bus Tracking',
  SAFETY = 'Security',
  FEES = 'Finance',
  COMMUNICATION = 'Messages',
  AI_ASSISTANT = 'AI Assistant',
  STAFF = 'Staff',
  SETTINGS = 'Settings',
  LEAVE = 'Leave Requests'
}

export type ProgramType = 'Little Seeds' | 'Curiosity Cubs' | 'Odyssey Owls' | 'Future Makers';

export interface Camera {
  id: string;
  name: string;
  location: string;
  streamUrl: string; 
  status: 'Online' | 'Offline' | 'Loading';
  type: 'Indoor' | 'Outdoor' | 'Gate';
}

export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  dob: string;
  bloodGroup?: string;
  motherName: string;
  motherEmail: string;
  fatherName: string;
  fatherEmail: string;
  program: ProgramType;
  dateOfJoining: string;
  offer: 'Early Bird Offer' | 'Regular' | 'Vijayadasami' | 'New Year' | 'Bridge Course';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  attendance: number;
  feesStatus: 'Paid' | 'Pending' | 'Overdue';
  busRoute: string;
  image: string;
  parentId: string;
  parentPhone: string;
  parentEmail: string;
  address?: string;
  password?: string;
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
  status: 'Active' | 'Away';
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
  password?: string;
}

export interface FeeBreakdown {
  application: number;
  registration: number;
  material: number;
  term1: number;
  term2: number;
  term3: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  breakdown?: FeeBreakdown;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  // Updated type to string to support dynamic bundle and component names
  type: string;
  paymentMethod?: 'Cash' | 'Online' | 'Cheque';
  paidAt?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  status: 'Completed' | 'Pending';
}

export interface AttendanceLog {
  id: string;
  date: string;
  studentId: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Certificate {
  id: string;
  type: 'School Letter' | 'Leaving Paper' | 'Good Conduct' | 'Fee Bill' | 'Bonafide' | 'Transfer' | 'Character' | 'Fee Receipt';
  studentName: string;
  studentId: string;
  requestDate: string;
  status: 'Pending' | 'Verified' | 'Issued' | 'Declined';
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
  status: 'Ongoing' | 'Closed';
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

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  targetGroup: 'All' | ProgramType;
  sender: string;
  date: string;
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
  role?: 'user' | 'model';
}
