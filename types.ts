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
  DOCUMENTS = 'Documents & Certificates'
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  attendance: number;
  feesStatus: 'Paid' | 'Pending' | 'Overdue';
  busRoute: string;
  image: string;
  parentName: string;
  parentId: string; // Link to parent user
  parentPhone: string;
  dob: string;
  address?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Teacher' | 'Admin' | 'Driver' | 'Clerk';
  subject?: string;
  classAssigned?: string;
  phone: string;
  email: string;
  status: 'Active' | 'On Leave';
  image: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  sender: string;
}

export interface BusLocation {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  speed: number;
  status: 'Moving' | 'Stopped' | 'Traffic';
  driver: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'other';
  senderName?: string;
  text: string;
  timestamp: Date;
  isRead?: boolean;
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
  date: string;
  present: number;
  absent: number;
  late: number;
  status: 'Submitted' | 'Pending';
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  grade: string;
  section: string;
  dueDate: string;
  assignedBy: string;
  status: 'Active' | 'Closed';
}

export interface Certificate {
  id: string;
  type: 'Bonafide' | 'Transfer' | 'Character' | 'Fee';
  studentName: string;
  issueDate: string;
  status: 'Generated' | 'Pending';
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