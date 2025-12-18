import { Student, Invoice, Notice, ChatMessage, Staff, Homework, Certificate, LeaveRequest } from '../types';

// Mock User Session (Simulating a logged-in Parent)
export const CURRENT_USER_ID = 'USR-PARENT-01'; // Jane Doe

export const mockStudents: Student[] = [
  { id: 'ST-2024-001', name: 'Emma Thompson', grade: 'Pre-KG', section: 'A', attendance: 98, feesStatus: 'Paid', busRoute: 'R-01', image: 'https://picsum.photos/seed/emma/200/200', parentName: 'Jane Doe', parentId: 'USR-PARENT-01', parentPhone: '+1 234-567-8901', parentEmail: 'jane.doe@example.com', dob: '2013-05-12' },
  { id: 'ST-2024-002', name: 'Liam Wilson', grade: 'Play Group', section: 'A', attendance: 92, feesStatus: 'Pending', busRoute: 'R-02', image: 'https://picsum.photos/seed/liam/200/200', parentName: 'James Wilson', parentId: 'USR-PARENT-02', parentPhone: '+1 234-567-8902', parentEmail: 'j.wilson@example.com', dob: '2013-08-24' },
  { id: 'ST-2024-003', name: 'Olivia Martinez', grade: 'KG 1', section: 'B', attendance: 85, feesStatus: 'Overdue', busRoute: 'Parent Pickup', image: 'https://picsum.photos/seed/olivia/200/200', parentName: 'Maria Martinez', parentId: 'USR-PARENT-03', parentPhone: '+1 234-567-8903', parentEmail: 'm.martinez@example.com', dob: '2013-02-15' },
  { id: 'ST-2024-004', name: 'Noah Chen', grade: 'KG 2', section: 'A', attendance: 99, feesStatus: 'Paid', busRoute: 'R-01', image: 'https://picsum.photos/seed/noah/200/200', parentName: 'David Chen', parentId: 'USR-PARENT-04', parentPhone: '+1 234-567-8904', parentEmail: 'd.chen@example.com', dob: '2014-11-30' },
];

const mockSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwyMCBDMzAsNSAzMCwzNSA1MCwyMCBDNzAsNSA3MCwzNSA5MCwyMCBDMTEwLDUgMTEwLDM1IDEzMCwyMCIgc3Ryb2tlPSJibHVlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
const adminSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwzMCBDMzAsMTAgMzAsNDAgNTAsMTAgQzkwLDQwIDExMCwxMCAxNDAsMzAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

export const mockStaff: Staff[] = [
  { 
    id: 'TCH-001', 
    name: 'Sarah Johnson', 
    role: 'Teacher', 
    subject: 'Preschool Activities', 
    classAssigned: 'Pre-KG A', 
    phone: '555-0101', 
    email: 'sarah.j@juniorodyssey.edu', 
    status: 'Active', 
    image: 'https://picsum.photos/seed/sarah/200/200',
    signature: mockSig,
    salaryDetails: {
      basic: 45000,
      allowances: 8000,
      deductions: 3500,
      net: 49500
    }
  },
  { 
    id: 'ADM-001', 
    name: 'Robert Principal', 
    role: 'Admin', 
    phone: '555-9999', 
    email: 'admin@juniorodyssey.edu', 
    status: 'Active', 
    image: 'https://picsum.photos/seed/rob/200/200',
    signature: adminSig,
    salaryDetails: {
      basic: 85000,
      allowances: 15000,
      deductions: 8000,
      net: 92000
    }
  },
];

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', studentId: 'ST-2024-001', studentName: 'Emma Thompson', amount: 1200, dueDate: '2024-04-01', status: 'Paid', type: 'Tuition' },
  { id: 'INV-005', studentId: 'ST-2024-001', studentName: 'Emma Thompson', amount: 300, dueDate: '2024-05-01', status: 'Pending', type: 'Transport' },
];

export const mockHomework: Homework[] = [
  { id: 'HW-01', subject: 'Art', title: 'Coloring Shapes', description: 'Color the circles red and squares blue.', grade: 'Pre-KG', section: 'A', dueDate: '2024-04-20', assignedBy: 'Sarah Johnson', status: 'Active' },
  { id: 'HW-02', subject: 'Nature', title: 'Leaf Collection', description: 'Bring 3 different leaves to class tomorrow.', grade: 'Play Group', section: 'A', dueDate: '2024-04-22', assignedBy: 'Sarah Johnson', status: 'Active' },
];

export const mockNotices: Notice[] = [
  { id: 'N-01', title: 'Annual Sports Day Postponed', date: '2024-03-20', priority: 'High', content: 'Due to predicted heavy rainfall, the Annual Sports Day scheduled for this Friday is postponed to next Tuesday.', sender: 'Principal Office' },
];

export const mockChats: ChatMessage[] = [
  { id: '1', role: 'other', senderName: 'Mrs. Johnson', text: 'Hello Ms. Doe, Emma has been very active in circle time today!', timestamp: new Date(Date.now() - 86400000), isRead: true },
];

export const mockCertificates: Certificate[] = [
  { id: 'DOC-001', type: 'Bonafide', studentName: 'Emma Thompson', studentId: 'ST-2024-001', requestDate: '2024-03-01', status: 'Released', issueDate: '2024-03-02' },
  { id: 'DOC-002', type: 'Transfer', studentName: 'Liam Wilson', studentId: 'ST-2024-002', requestDate: '2024-03-15', status: 'Requested' },
  { id: 'DOC-003', type: 'Character', studentName: 'Noah Chen', studentId: 'ST-2024-004', requestDate: '2024-03-18', status: 'Teacher Approved' },
];

export const mockLeaveRequests: LeaveRequest[] = [];

export const getMyChild = () => {
  return mockStudents.find(s => s.parentId === CURRENT_USER_ID);
};

export const getMyChildInvoices = () => {
  const child = getMyChild();
  if (!child) return [];
  return mockInvoices.filter(i => i.studentId === child.id);
};

export const getMyChildHomework = () => {
  const child = getMyChild();
  if (!child) return [];
  return mockHomework.filter(h => h.grade === child.grade);
};