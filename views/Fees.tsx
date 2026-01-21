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
  Receipt,
  ArrowUpRight,
  PlusCircle,
  TrendingDown,
  ChevronDown,
  FileText
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

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [matrix, setMatrix] = useState<FeeMatrix>(DEFAULT_FEE_MATRIX);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'student' | 'yield'>('student');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configActiveProgram, setConfigActiveProgram] = useState<ProgramType>('Little Seeds');
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [invs, stds] = await Promise.all([
        db.getAll('invoices'), 
        db.getAll('students')
      ]);
      setInvoices(invs || []);
      setStudents(stds || []);
    } catch (err) {
      console.error("Finance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData();
    const invoiceSub = db.subscribe('invoices', () => loadData(), () => loadData(), () => loadData());
    const studentSub = db.subscribe('students', () => loadData(), () => loadData(), () => loadData());
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

  const downloadInvoice = (invoice: Invoice) => {
    showToast?.("Downloading Receipt", "info", `Generating digital copy for ${invoice.id}...`);
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
    } finally {
      setSyncing(false);
    }
  };

  if (isParent) {
    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    let myChild = students.find(s => s.parentId === CURRENT_USER_ID);
    if (!myChild && students.length > 0) {
      myChild = students.find(s => invoices.some(i => i.studentId === s.id)) || students[0];
    }
    const myInvoices = myChild ? invoices.filter(i => i.studentId === myChild.id) : [];
    const pendingInvoices = myInvoices.filter(i => i.status !== 'Paid');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

    if (!myChild) return <div className="p-12 text-center flex flex-col items-center justify-center h-full"><AlertCircle className="w-16 h-16 text-slate-200 mb-6" /><h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Profile Link Failure</h3></div>;

    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full no-scrollbar pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div><h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Finance Ledger</h2><p className="text-slate-500 font-medium flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Personal Account for <span className="text-blue-600 font-bold">{myChild.name}</span></p></div>
          <button className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"><Download className="w-5 h-5" /> Export PDF</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border border-rose-100 shadow-xl flex items-center gap-8 relative overflow-hidden group">
              <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center shadow-2xl z-10"><AlertCircle className="w-10 h-10" /></div>
              <div className="z-10"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Due</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter">₹{totalPending.toLocaleString('en-IN')}</h3></div>
              <button className="ml-auto bg-rose-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all z-10 flex items-center gap-2">Settle <ArrowUpRight className="w-4 h-4" /></button>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-emerald-100 shadow-xl flex items-center gap-8 relative overflow-hidden group">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-2xl z-10"><CheckCircle className="w-10 h-10" /></div>
              <div className="z-10"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Cleared Total</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter">₹{myInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN')}</h3></div>
           </div>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-4"><div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><CreditCard className="w-5 h-5" /></div> Allocated Fees</h3>
           </div>
           <div className="divide-y divide-slate-50">
              {pendingInvoices.length === 0 ? <div className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest">Account fully cleared.</div> : pendingInvoices.map((inv) => (
                <div key={inv.id} className="p-8 flex flex-col md:flex-row items-center justify-between hover:bg-slate-50/80 transition-all group gap-6">
                   <div className="flex items-center gap-6 flex-1">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-all"><Receipt className="w-7 h-7" /></div>
                      <div><p className="text-lg font-black text-slate-800 tracking-tight leading-none">{inv.type} Allocation</p><p className="text-[11px] font-bold text-slate-400 uppercase mt-2">Reference: {inv.id.slice(-8)}</p></div>
                   </div>
                   <div className="text-right flex items-center gap-10">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{inv.amount.toLocaleString('en-IN')}</p>
                      <button onClick={() => downloadInvoice(inv)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-lg"><Download className="w-5 h-5" /></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  const getStudentPaymentStatus = (studentId: string) => {
    const inv = invoices.find(i => i.studentId === studentId && i.type === 'Tuition');
    if (!inv) return 'Unbilled';
    return inv.status;
  };

  const programFilteredStudents = activeProgram === 'All' ? students : students.filter(s => s.program === activeProgram);
  const totalCollected = invoices.filter(i => i.status === 'Paid' && (activeProgram === 'All' || students.find(s => s.id === i.studentId)?.program === activeProgram)).reduce((acc, i) => acc + i.amount, 0);
  const totalTarget = programFilteredStudents.reduce((acc, s) => acc + getStandardRate(s), 0);

  return (
    <div className="p-4 md:p-10 h-full flex flex-col animate-in fade-in duration-500 overflow-hidden max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0">
        <div><h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Financial Command</h2><p className="text-slate-500 text-sm font-medium">Monitoring <span className="text-blue-600 font-bold">{activeProgram}</span> yield matrix.</p></div>
        <div className="flex gap-3 w-full md:w-auto">
           {role === UserRole.ADMIN && <button onClick={() => { setSyncing(true); loadData(); }} className="flex-1 md:flex-none bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-3">{syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync Vault</button>}
           <button onClick={() => setShowConfigModal(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><Settings className="w-4 h-4" /> Configure Matrix</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 shrink-0">
         <div className="pro-card p-8 bg-white border-l-8 border-l-emerald-500"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Realized</p><h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalCollected.toLocaleString('en-IN')}</h3></div>
         <div className="pro-card p-8 bg-white border-l-8 border-l-rose-500"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outstanding</p><h3 className="text-3xl font-black text-rose-600 tracking-tighter">₹{(totalTarget - totalCollected).toLocaleString('en-IN')}</h3></div>
         <div className="pro-card p-8 bg-white border-l-8 border-l-blue-500"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valuation</p><h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalTarget.toLocaleString('en-IN')}</h3></div>
      </div>
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-8 shrink-0 overflow-x-auto no-scrollbar">
         <button onClick={() => setActiveProgram('All')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeProgram === 'All' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>All Programs</button>
         {PROGRAMS.map(prog => <button key={prog} onClick={() => setActiveProgram(prog)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeProgram === prog ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500'}`}>{prog}</button>)}
      </div>
      <div className="flex-1 pro-card overflow-hidden bg-white flex flex-col">
         <div className="overflow-y-auto flex-1 no-scrollbar">
            <table className="w-full text-left">
               <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xl border-b border-slate-100"><tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"><th className="px-8 py-6">Member Registry</th><th className="px-8 py-6 text-center">Applied Rate</th><th className="px-8 py-6 text-center">Invoiced Status</th><th className="px-8 py-6 text-right">Control</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                  {programFilteredStudents.map(student => {
                     const status = getStudentPaymentStatus(student.id);
                     const stdRate = getStandardRate(student);
                     return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-8 py-6"><div className="flex items-center gap-4"><img src={student.image} className="w-12 h-12 rounded-xl object-cover" alt="Student" /><div><p className="font-black text-slate-900 text-base tracking-tight">{student.name}</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{student.offer}</p></div></div></td>
                           <td className="px-8 py-6 text-center font-black text-slate-600">₹{stdRate.toLocaleString()}</td>
                           <td className="px-8 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : status === 'Pending' ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-400'}`}>{status}</span></td>
                           <td className="px-8 py-6 text-right">
                              {status === 'Unbilled' ? (
                                <button onClick={() => handleQuickAllocate(student)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 flex items-center gap-2 ml-auto"><PlusCircle className="w-5 h-5" /><span className="text-[10px] font-black uppercase">Allocate</span></button>
                              ) : (
                                <div className="flex items-center gap-2 text-emerald-600 ml-auto bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"><CheckCircle className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Allocated</span></div>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {showConfigModal && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-3xl relative">
               <div className="flex justify-between items-center mb-10"><div><h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Offer Matrix</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Tier Policy</p></div><button onClick={() => setShowConfigModal(false)} className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-100 transition-all"><X className="w-8 h-8" /></button></div>
               <div className="grid grid-cols-2 gap-3 mb-10">
                  {PROGRAMS.map(p => (<button key={p} onClick={() => setConfigActiveProgram(p)} className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${configActiveProgram === p ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-100'}`}>{p}</button>))}
               </div>
               <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto no-scrollbar">
                  {OFFERS.map(offer => (
                    <div key={offer} className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{offer}</span>
                       <div className="relative w-32"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">₹</span><input type="number" value={matrix[configActiveProgram][offer]} onChange={e => setMatrix(prev => ({...prev, [configActiveProgram]: {...prev[configActiveProgram], [offer]: Number(e.target.value)}})} className="w-full pl-8 pr-4 py-2 bg-transparent border-b-2 border-slate-200 focus:border-blue-600 outline-none text-right font-black text-slate-900" /></div>
                    </div>
                  ))}
               </div>
               <button onClick={() => { showToast?.("Matrix Synced", "success"); setShowConfigModal(false); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl"><Save className="w-6 h-6" /> Commit Protocol Changes</button>
            </div>
         </div>
      )}
    </div>
  );
};