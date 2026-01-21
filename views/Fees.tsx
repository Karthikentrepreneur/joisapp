
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/persistence';
import { UserRole, ProgramType, Invoice, Student } from '../types';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Settings,
  GraduationCap,
  X, 
  RefreshCw,
  Target,
  Save,
  CreditCard,
  FileText,
  History,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  TrendingDown,
  ChevronDown
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface FeesProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const OFFERS = ['Early Bird Offer', 'Regular', 'Vijayadasami', 'New Year', 'Bridge Course'] as const;
type OfferType = typeof OFFERS[number];

type FeeMatrix = Record<ProgramType, Record<OfferType, number>>;

const DEFAULT_FEE_MATRIX: FeeMatrix = {
  'Little Seeds': { 'Early Bird Offer': 40000, 'Regular': 45000, 'Vijayadasami': 42000, 'New Year': 43000, 'Bridge Course': 15000 },
  'Curiosity Cubs': { 'Early Bird Offer': 50000, 'Regular': 55000, 'Vijayadasami': 52000, 'New Year': 53000, 'Bridge Course': 18000 },
  'Odyssey Owls': { 'Early Bird Offer': 60000, 'Regular': 65000, 'Vijayadasami': 62000, 'New Year': 63000, 'Bridge Course': 20000 },
  'Future Makers': { 'Early Bird Offer': 70000, 'Regular': 75000, 'Vijayadasami': 72000, 'New Year': 73000, 'Bridge Course': 25000 }
};

type PaymentFilter = 'All' | 'Paid' | 'Unpaid';

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [matrix, setMatrix] = useState<FeeMatrix>(DEFAULT_FEE_MATRIX);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'student' | 'yield'>('student');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configActiveProgram, setConfigActiveProgram] = useState<ProgramType>('Little Seeds');
  const [syncing, setSyncing] = useState(false);

  // Fix: Use useCallback to stabilize loadData and ensure it's handled as 0-arg function
  const loadData = useCallback(async () => {
    try {
      const [invs, stds] = await Promise.all([
        db.getAll('invoices'), 
        db.getAll('students')
      ]);
      setInvoices(invs || []);
      setStudents(stds || []);
    } catch (err) {
      console.error("Finance load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData();
    // Real-time synchronization from Supabase
    // Using arrow functions that explicitly accept the payload argument (ignoring it) 
    // to satisfy the subscribe parameters while calling loadData with 0 arguments.
    const invoiceSub = db.subscribe('invoices', (_p) => { loadData(); }, (_p) => { loadData(); }, (_p) => { loadData(); });
    const studentSub = db.subscribe('students', (_p) => { loadData(); }, (_p) => { loadData(); }, (_p) => { loadData(); });
    return () => { 
      invoiceSub.unsubscribe(); 
      studentSub.unsubscribe();
    };
  }, [loadData]);

  const isParent = role === UserRole.PARENT;

  const getStandardRate = (student: Student) => {
    const pRates = matrix[student.program] || DEFAULT_FEE_MATRIX[student.program];
    const offer = (student.offer as OfferType) || 'Regular';
    return pRates[offer] || pRates['Regular'] || 0;
  };

  const handleQuickAllocate = async (student: Student) => {
    const rate = getStandardRate(student);
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      amount: rate,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      type: 'Tuition'
    };

    try {
      setSyncing(true);
      await db.create('invoices', newInvoice);
      showToast?.("Fee Allocated", "success", `₹${rate.toLocaleString()} invoiced to ${student.name}.`);
      await loadData();
    } catch (err) {
      showToast?.("Allocation Error", "error", "Failed to sync with cloud vault.");
    } finally {
      setSyncing(false);
    }
  };

  if (isParent) {
    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    // Resilient child finding for Parent view
    let myChild = students.find(s => s.parentId === CURRENT_USER_ID);
    if (!myChild && students.length > 0) {
      myChild = students.find(s => invoices.some(i => i.studentId === s.id)) || students[0];
    }
    
    const myInvoices = myChild ? invoices.filter(i => i.studentId === myChild.id) : [];
    const pendingInvoices = myInvoices.filter(i => i.status !== 'Paid');
    const paidInvoices = myInvoices.filter(i => i.status === 'Paid');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

    const childProgramFees = myChild ? matrix[myChild.program] : null;
    const childOffer = myChild?.offer || 'Regular';

    const downloadInvoice = (invoice: Invoice) => {
      showToast?.("Invoice Generated", "success", `Downloading receipt for Ref: ${invoice.id.slice(0, 8)}`);
    };

    if (!myChild) {
      return (
        <div className="p-12 text-center flex flex-col items-center justify-center h-full">
           <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
           <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Student Records Found</h3>
           <p className="text-slate-500 mt-2">The school database is currently empty or no child is linked to your account.</p>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full no-scrollbar pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Academic Financials</h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Personal Ledger for <span className="text-blue-600 font-bold">{myChild.name}</span>
            </p>
          </div>
          <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
            <Download className="w-5 h-5" /> Export PDF Statement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border border-rose-100 shadow-xl shadow-rose-500/5 flex items-center gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-200 z-10">
                 <AlertCircle className="w-10 h-10" />
              </div>
              <div className="z-10">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Net Outstanding</p>
                 <h3 className="text-4xl font-black text-slate-900 tracking-tighter">₹{totalPending.toLocaleString('en-IN')}</h3>
                 <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2">Due immediately</p>
              </div>
              <button className="ml-auto bg-rose-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow