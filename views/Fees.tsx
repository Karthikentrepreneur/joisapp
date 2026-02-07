
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Save,
  CreditCard,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  Filter,
  ChevronRight,
  Target,
  Banknote,
  TrendingUp
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

const SummaryStat = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0 min-w-[160px] flex-1">
     <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color} text-white shadow-sm`}>
       <Icon className="w-4.5 h-4.5" />
     </div>
     <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 leading-none">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-base font-bold text-slate-900 leading-none truncate">₹{value}</p>
        </div>
     </div>
  </div>
);

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [matrix, setMatrix] = useState<FeeMatrix>(DEFAULT_FEE_MATRIX);
  const [loading, setLoading] = useState(true);
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
    const invoiceSub = db.subscribe('invoices', () => loadData());
    const studentSub = db.subscribe('students', () => loadData());
    return () => { 
      invoiceSub.unsubscribe(); 
      studentSub.unsubscribe();
    };
  }, [loadData]);

  const isParent = role === UserRole.PARENT;
  const isFounder = role === UserRole.FOUNDER;
  const isAdmin = role === UserRole.ADMIN;

  const getStandardRate = useCallback((student: Student) => {
    const pRates = matrix[student.program] || DEFAULT_FEE_MATRIX[student.program];
    const offer = (student.offer as OfferType) || 'Regular';
    return pRates[offer] || pRates['Regular'] || 0;
  }, [matrix]);

  const stats = useMemo(() => {
    const filteredStudents = activeProgram === 'All' ? students : students.filter(s => s.program === activeProgram);
    const collected = invoices
      .filter(i => i.status === 'Paid' && (activeProgram === 'All' || students.find(s => s.id === i.studentId)?.program === activeProgram))
      .reduce((acc, i) => acc + i.amount, 0);
    const target = filteredStudents.reduce((acc, s) => acc + getStandardRate(s), 0);
    return {
      collected,
      target,
      pending: target - collected
    };
  }, [students, invoices, activeProgram, getStandardRate]);

  const downloadInvoice = (invoice: Invoice) => {
    const csvRows = [
      [`INVOICE`],
      [`Invoice No: ${invoice.id}`],
      [`Student: ${invoice.studentName}`],
      [`Status: ${invoice.status}`],
      [`Total: ₹${invoice.amount.toLocaleString('en-IN')}`],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Invoice_${invoice.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.("Invoice Downloaded", "success");
  };

  const handleQuickAllocate = async (student: Student) => {
    const rate = getStandardRate(student);
    const newInvoice: Invoice = {
      id: `BILL-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      amount: rate,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      type: 'School Fee'
    };
    try {
      setSyncing(true);
      await db.create('invoices', newInvoice);
      showToast?.("Invoice Generated", "success", `Billed ₹${rate.toLocaleString()} to ${student.name}.`);
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  if (isParent) {
    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const myInvoices = myChild ? invoices.filter(i => i.studentId === myChild.id) : [];
    const pendingInvoices = myInvoices.filter(i => i.status !== 'Paid');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 overflow-y-auto h-full no-scrollbar pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Finance & Billing</h2>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Account summary for <span className="text-blue-600 font-bold">{myChild?.name}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-sm"><AlertCircle className="w-8 h-8" /></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">₹{totalPending.toLocaleString('en-IN')}</h3>
              </div>
              <button onClick={() => showToast?.("Info", "info", "Online payments are processed securely.")} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase active:scale-95 transition-all">Pay <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" /></button>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm"><CheckCircle className="w-8 h-8" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lifetime Paid</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">₹{myInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN')}</h3>
              </div>
           </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Invoices & Receipts</h3>
           </div>
           <div className="divide-y divide-slate-100">
              {myInvoices.length === 0 ? <div className="p-12 text-center text-slate-400 font-medium">No financial records found.</div> : myInvoices.map((inv) => (
                <div key={inv.id} className="p-5 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50/50 transition-all group gap-4">
                   <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Receipt className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-none">{inv.type}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">Due: {inv.dueDate}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 tracking-tight">₹{inv.amount.toLocaleString('en-IN')}</p>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{inv.status}</span>
                      </div>
                      <button onClick={() => downloadInvoice(inv)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg flex items-center justify-center transition-all border border-slate-200"><Download className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  const filteredStudents = activeProgram === 'All' ? students : students.filter(s => s.program === activeProgram);

  return (
    <div className="w-full flex flex-col bg-slate-50 animate-in fade-in duration-300 min-h-full pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-0.5 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" /> Financial Ledger
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue tracking for {activeProgram}</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <button 
                onClick={() => { setSyncing(true); loadData().then(() => setSyncing(false)); }} 
                className="flex-1 md:flex-none bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} 
                <span className="hidden sm:inline">Sync Data</span>
              </button>
              <button 
                onClick={() => setShowConfigModal(true)} 
                className="flex-1 md:flex-none bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
              >
                <Settings className="w-3.5 h-3.5" /> 
                <span>Pricing</span>
              </button>
          </div>
        </div>
      </div>

      {/* Responsive Filters & Summary */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Summary Cards - Only for Founder/Admin (matching isFounder condition in request) */}
          {isFounder && (
            <div className="flex gap-3 flex-1 overflow-x-auto no-scrollbar">
              <SummaryStat icon={CheckCircle} label="Collection" value={stats.collected.toLocaleString()} color="bg-emerald-600" />
              <SummaryStat icon={TrendingUp} label="Receivables" value={stats.pending.toLocaleString()} color="bg-orange-500" />
              <SummaryStat icon={Target} label="Target" value={stats.target.toLocaleString()} color="bg-blue-600" />
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveProgram('All')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeProgram === 'All' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                All Classes
              </button>
              {PROGRAMS.map(prog => (
                <button 
                  key={prog} 
                  onClick={() => setActiveProgram(prog)} 
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeProgram === prog ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {prog}
                </button>
              ))}
            </div>
            
            {/* Mobile Filter Dropdown */}
            <div className="md:hidden flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={activeProgram}
                onChange={(e) => setActiveProgram(e.target.value as any)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-700 outline-none appearance-none shadow-sm"
              >
                <option value="All">All Classes</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Financial List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Ledger...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center p-8">
              <CreditCard className="w-10 h-10 text-slate-100 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3">Student Details</th>
                    <th className="px-5 py-3 text-center hidden sm:table-cell">Amount</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((student) => {
                    const inv = invoices.find(i => i.studentId === student.id && i.type === 'School Fee');
                    const status = inv ? inv.status : 'Unbilled';
                    const stdRate = getStandardRate(student);
                    return (
                      <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <img src={student.image} className="w-8 h-8 rounded-lg border border-slate-100 object-cover shadow-sm" alt="Avatar" />
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-none mb-1">{student.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-bold text-blue-600 uppercase bg-blue-50 px-1 rounded">{student.program}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{student.offer}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-center hidden sm:table-cell">
                          <p className="text-sm font-bold text-slate-700">₹{stdRate.toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                            status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {status === 'Unbilled' ? (
                            <button 
                              onClick={() => handleQuickAllocate(student)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> 
                              <span className="hidden sm:inline">Bill</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase hidden sm:inline">Sent</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Config Modal remains same structure but ensured mobile spacing */}
      {showConfigModal && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-xl font-bold text-slate-900">Fee Configuration</h3>
                  <button onClick={() => setShowConfigModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg flex items-center justify-center border border-slate-200 transition-all"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 shrink-0">
                  {PROGRAMS.map(p => (
                    <button 
                      key={p} 
                      onClick={() => setConfigActiveProgram(p)} 
                      className={`px-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all truncate ${
                        configActiveProgram === p ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
               </div>

               <div className="space-y-2 mb-8 overflow-y-auto no-scrollbar flex-1 pr-1">
                  {OFFERS.map(offer => (
                    <div key={offer} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{offer}</span>
                       <div className="relative w-full sm:w-28">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">₹</span>
                         <input 
                            type="number" 
                            value={matrix[configActiveProgram][offer]} 
                            onChange={e => setMatrix(prev => ({...prev, [configActiveProgram]: {...prev[configActiveProgram], [offer]: Number(e.target.value)}}))} 
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:border-blue-600 outline-none text-right font-bold text-slate-900 text-sm" 
                         />
                       </div>
                    </div>
                  ))}
               </div>
               
               <button 
                onClick={() => { showToast?.("Fee updated", "success"); setShowConfigModal(false); }} 
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
               >
                  <Save className="w-5 h-5" /> Save Fee Changes
               </button>
            </div>
         </div>
      )}
    </div>
  );
};
