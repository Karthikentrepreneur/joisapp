import { Student, Invoice, Notice, ChatMessage, Staff, Homework, Certificate, LeaveRequest } from '../types';

// Mock User Session - Keep this to simulate a logged-in user context
export const CURRENT_USER_ID = 'USR-PARENT-01'; 

// Constants for UI fallbacks
export const mockSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwyMCBDMzAsNSAzMCwzNSA1MCwyMCBDNzAsNSA3MCwzNSA5MCwyMCBDMTEwLDUgMTEwLDM1IDEzMCwyMCIgc3Ryb2tlPSJibHVlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
export const adminSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwzMCBDMzAsMTAgMzAsNDAgNTAsMTAgQzkwLDQwIDExMCwxMCAxNDAsMzAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

// Data structure placeholders (empty by default)
export const mockStudents: Student[] = []; 
export const mockStaff: Staff[] = [];
export const mockInvoices: Invoice[] = [];
export const mockNotices: Notice[] = [];
export const mockChats: ChatMessage[] = [];
export const mockCertificates: Certificate[] = [];
export const mockHomework: Homework[] = [];
export const mockLeaveRequests: LeaveRequest[] = [];

/**
 * Helpers now rely on parsing the LocalStorage state or returning empty
 * Component-level fetching is preferred for real data.
 */
export const getMyChild = () => {
  const data = localStorage.getItem('EDUNEXUS_DATABASE');
  if (!data) return null;
  const allData = JSON.parse(data);
  const students = allData.students || [];
  return students.find((s: Student) => s.parentId === CURRENT_USER_ID) || null;
};

export const getMyChildInvoices = () => {
  const child = getMyChild();
  if (!child) return [];
  const data = localStorage.getItem('EDUNEXUS_DATABASE');
  if (!data) return [];
  const allData = JSON.parse(data);
  const invoices = allData.invoices || [];
  return invoices.filter((i: Invoice) => i.studentId === child.id);
};

export const getMyChildHomework = () => {
  const child = getMyChild();
  if (!child) return [];
  // Homework is currently mock-only in structure, returning empty for real data flow
  return []; 
};
