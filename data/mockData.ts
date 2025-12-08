import { Student, Invoice, Notice, ChatMessage, Staff, Homework, Certificate } from '../types';

// Mock User Session (Simulating a logged-in Parent)
export const CURRENT_USER_ID = 'USR-PARENT-01'; // Jane Doe

export const mockStudents: Student[] = [
  { id: 'ST-2024-001', name: 'Emma Thompson', grade: '5', section: 'A', attendance: 98, feesStatus: 'Paid', busRoute: 'R-01', image: 'https://picsum.photos/seed/emma/200/200', parentName: 'Jane Doe', parentId: 'USR-PARENT-01', parentPhone: '+1 234-567-8901', dob: '2013-05-12' },
  { id: 'ST-2024-002', name: 'Liam Wilson', grade: '5', section: 'A', attendance: 92, feesStatus: 'Pending', busRoute: 'R-02', image: 'https://picsum.photos/seed/liam/200/200', parentName: 'James Wilson', parentId: 'USR-PARENT-02', parentPhone: '+1 234-567-8902', dob: '2013-08-24' },
  { id: 'ST-2024-003', name: 'Olivia Martinez', grade: '5', section: 'B', attendance: 85, feesStatus: 'Overdue', busRoute: 'Parent Pickup', image: 'https://picsum.photos/seed/olivia/200/200', parentName: 'Maria Martinez', parentId: 'USR-PARENT-03', parentPhone: '+1 234-567-8903', dob: '2013-02-15' },
  { id: 'ST-2024-004', name: 'Noah Chen', grade: '4', section: 'A', attendance: 99, feesStatus: 'Paid', busRoute: 'R-01', image: 'https://picsum.photos/seed/noah/200/200', parentName: 'David Chen', parentId: 'USR-PARENT-04', parentPhone: '+1 234-567-8904', dob: '2014-11-30' },
  { id: 'ST-2024-005', name: 'Ava Patel', grade: '6', section: 'C', attendance: 94, feesStatus: 'Paid', busRoute: 'R-03', image: 'https://picsum.photos/seed/ava/200/200', parentName: 'Priya Patel', parentId: 'USR-PARENT-05', parentPhone: '+1 234-567-8905', dob: '2012-06-18' },
];

export const mockStaff: Staff[] = [
  { id: 'TCH-001', name: 'Sarah Johnson', role: 'Teacher', subject: 'Mathematics', classAssigned: '5-A', phone: '555-0101', email: 'sarah.j@juniorodyssey.edu', status: 'Active', image: 'https://picsum.photos/seed/sarah/200/200' },
  { id: 'TCH-002', name: 'Michael Brown', role: 'Teacher', subject: 'Science', classAssigned: '5-B', phone: '555-0102', email: 'm.brown@juniorodyssey.edu', status: 'Active', image: 'https://picsum.photos/seed/mike/200/200' },
  { id: 'ADM-001', name: 'Robert Principal', role: 'Admin', phone: '555-9999', email: 'admin@juniorodyssey.edu', status: 'Active', image: 'https://picsum.photos/seed/rob/200/200' },
  { id: 'DRV-001', name: 'John Driver', role: 'Driver', phone: '555-3333', email: 'transport@juniorodyssey.edu', status: 'Active', image: 'https://picsum.photos/seed/john/200/200' },
];

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', studentId: 'ST-2024-001', studentName: 'Emma Thompson', amount: 1200, dueDate: '2024-04-01', status: 'Paid', type: 'Tuition' },
  { id: 'INV-005', studentId: 'ST-2024-001', studentName: 'Emma Thompson', amount: 300, dueDate: '2024-05-01', status: 'Pending', type: 'Transport' },
  { id: 'INV-002', studentId: 'ST-2024-002', studentName: 'Liam Wilson', amount: 1200, dueDate: '2024-04-01', status: 'Pending', type: 'Tuition' },
  { id: 'INV-003', studentId: 'ST-2024-003', studentName: 'Olivia Martinez', amount: 150, dueDate: '2024-03-15', status: 'Overdue', type: 'Transport' },
  { id: 'INV-004', studentId: 'ST-2024-004', studentName: 'Noah Chen', amount: 50, dueDate: '2024-04-10', status: 'Pending', type: 'Activity' },
];

export const mockHomework: Homework[] = [
  { id: 'HW-01', subject: 'Math', title: 'Fractions Worksheet', description: 'Complete page 42, exercises 1-10.', grade: '5', section: 'A', dueDate: '2024-04-20', assignedBy: 'Sarah Johnson', status: 'Active' },
  { id: 'HW-02', subject: 'Science', title: 'Plant Life Cycle', description: 'Draw and label the life cycle of a bean plant.', grade: '5', section: 'A', dueDate: '2024-04-22', assignedBy: 'Michael Brown', status: 'Active' },
  { id: 'HW-03', subject: 'History', title: 'Ancient Egypt', description: 'Read chapter 4 and write a summary.', grade: '5', section: 'A', dueDate: '2024-04-18', assignedBy: 'History Dept', status: 'Closed' },
];

export const mockNotices: Notice[] = [
  { id: 'N-01', title: 'Annual Sports Day Postponed', date: '2024-03-20', priority: 'High', content: 'Due to predicted heavy rainfall, the Annual Sports Day scheduled for this Friday is postponed to next Tuesday.', sender: 'Principal Office' },
  { id: 'N-02', title: 'Exam Schedule Released', date: '2024-03-18', priority: 'Medium', content: 'The final term examination schedule has been published. Please check the Academics section.', sender: 'Academic Coordinator' },
  { id: 'N-03', title: 'Bus Route 3 Maintenance', date: '2024-03-15', priority: 'Low', content: 'Bus Route 3 will be operated by a substitute vehicle tomorrow morning.', sender: 'Transport Manager' },
];

export const mockChats: ChatMessage[] = [
  { id: '1', role: 'other', senderName: 'Mrs. Johnson (Class Teacher)', text: 'Hello Ms. Doe, Emma has been improving in Math lately. Keep it up!', timestamp: new Date(Date.now() - 86400000), isRead: true },
  { id: '2', role: 'user', senderName: 'You', text: 'That is great to hear! We have been practicing at home.', timestamp: new Date(Date.now() - 80000000), isRead: true },
];

export const mockCertificates: Certificate[] = [
  { id: 'CERT-001', type: 'Bonafide', studentName: 'Emma Thompson', issueDate: '2024-01-15', status: 'Generated' },
];

// Helper to simulate "Database Query" for the logged-in parent
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
  return mockHomework.filter(h => h.grade === child.grade && h.section === child.section);
};