
import { Student, Invoice, Notice, ChatMessage, Staff, Homework, Certificate, LeaveRequest } from '../types';

/**
 * CURRENT_USER_ID represents the simulated logged-in user.
 * In the Parent role, we try to match this against the 'parentId' field of students.
 */
export const CURRENT_USER_ID = 'PAR-MASTER-DEMO'; 

// Constants for UI fallbacks (Signatures used in Settings)
export const mockSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwyMCBDMzAsNSAzMCwzNSA1MCwyMCBDNzAsNSA3MCwzNSA5MCwyMCBDMTEwLDUgMTEwLDM1IDEzMCwyMCIgc3Ryb2tlPSJibHVlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
export const adminSig = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiPjxwYXRoIGQ9Ik0xMCwzMCBDMzAsMTAgMzAsNDAgNTAsMTAgQzkwLDQwIDExMCwxMCAxNDAsMzAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

// No static mock data. Everything is derived from the database (Supabase/LocalStorage).
export const mockStudents: Student[] = []; 
export const mockStaff: Staff[] = [];
export const mockInvoices: Invoice[] = [];
export const mockNotices: Notice[] = [];
export const mockChats: ChatMessage[] = [];
export const mockCertificates: Certificate[] = [];
export const mockHomework: Homework[] = [];
export const mockLeaveRequests: LeaveRequest[] = [];

/**
 * Global helper to resolve the 'Current Child' for the Parent view.
 * It prioritizes exact parentId matching, but falls back to the first available student 
 * to ensure the demo dashboard remains populated after an Admin adds a student.
 */
// Fix: Renamed from getMyChildSync to getMyChild to resolve import errors in Documents.tsx and Leave.tsx
export const getMyChild = () => {
  const raw = localStorage.getItem('EDUNEXUS_DATABASE');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const students = data.students || [];
    if (students.length === 0) return null;
    
    // Try to find the student assigned to this parent
    const matched = students.find((s: Student) => s.parentId === CURRENT_USER_ID);
    // Fallback to the first student if no match (standard demo behavior)
    return matched || students[0];
  } catch (e) {
    return null;
  }
};
