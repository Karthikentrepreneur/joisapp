
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/persistence';
import { UserRole, ProgramType, Invoice, Student, FeeBreakdown } from '../types';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Settings,
  X, 
  RefreshCw,
  Save,
  Receipt,
  Printer,
  Coins,
  Banknote,
  TrendingUp,
  Target,
  CreditCard,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Ban,
  Search,
  Filter,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface FeesProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

const PROGRAMS: ProgramType[] = ['Little Seeds', 'Curiosity Cubs', 'Odyssey Owls', 'Future Makers'];
const OFFERS = ['Regular', 'Early Bird Offer', 'Vijayadasami', 'New Year', 'Bridge Course'] as const;
type OfferType = typeof OFFERS[number];

type FeeMatrix = Record<ProgramType, Record<OfferType, FeeBreakdown>>;

const INITIAL_BREAKDOWN: FeeBreakdown = {
  application: 500,
  registration: 5000,
  material: 3000,
  term1: 10000,
  term2: 10000,
  term3: 10000
};

const DEFAULT_FEE_MATRIX: FeeMatrix = PROGRAMS.reduce((acc, prog) => {
  acc[prog] = OFFERS.reduce((oAcc, offer) => {
    oAcc[offer] = { ...INITIAL_BREAKDOWN };
    return oAcc;
  }, {} as any);
  return acc;
}, {} as any);

const SummaryStat = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 flex-1 min-w-[140px] hover:shadow-md transition-all">
     <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${color} text-white shadow-lg`}>
       <Icon className="w-5 h-5 md:w-7 md:h-7" />
     </div>
     <div className="min-w-0">
        <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5 md:mb-1.5 leading-none">{label}</p>
        <p className="text-lg md:text-2xl font-black text-slate-900 leading-none truncate tracking-tight">₹{value.toLocaleString()}</p>
     </div>
  </div>
);

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [matrix, setMatrix] = useState<FeeMatrix>(DEFAULT_FEE_MATRIX);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProgram, setActiveProgram] = useState<'All' | ProgramType>('All');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configActiveProgram, setConfigActiveProgram] = useState<ProgramType>('Little Seeds');
  const [configActiveOffer, setConfigActiveOffer] = useState<OfferType>('Regular');
  const [showBillModal, setShowBillModal] = useState<Student | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Set<keyof FeeBreakdown>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const isAdmin = role === UserRole.ADMIN || role === UserRole.FOUNDER;
  const isParent = role === UserRole.PARENT;

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
    const savedMatrix = localStorage.getItem('JOIS_FEE_MATRIX_V2');
    if (savedMatrix) setMatrix(JSON.parse(savedMatrix));
  }, [loadData]);

  const getBreakdownForStudent = useCallback((student: Student) => {
    const pRates = matrix[student.program] || DEFAULT_FEE_MATRIX[student.program];
    const offer = (student.offer as OfferType) || 'Regular';
    return pRates[offer] || pRates['Regular'];
  }, [matrix]);

  const alreadyBilledComponents = useMemo(() => {
    if (!showBillModal) return new Set<string>();
    const studentInvoices = invoices.filter(i => i.studentId === showBillModal.id);
    const billedKeys = new Set<string>();
    studentInvoices.forEach(inv => {
      if (inv.breakdown) {
        Object.keys(inv.breakdown).forEach(k => billedKeys.add(k));
      }
    });
    return billedKeys;
  }, [showBillModal, invoices]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = activeProgram === 'All' || s.program === activeProgram;
      return matchesSearch && matchesProgram;
    });
  }, [students, searchTerm, activeProgram]);

  const stats = useMemo(() => {
    const collected = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
    const receivables = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);
    return { collected, receivables, total: collected + receivables };
  }, [invoices]);

  const handleGenerateInvoice = async (student: Student) => {
    const fullBreakdown = getBreakdownForStudent(student);
    const selectedBreakdown: Partial<FeeBreakdown> = {};
    let total = 0;

    selectedComponents.forEach(comp => {
      selectedBreakdown[comp] = fullBreakdown[comp];
      total += fullBreakdown[comp];
    });
    
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      amount: total,
      breakdown: selectedBreakdown as FeeBreakdown,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      type: selectedComponents.size > 1 ? 'School Fee Bundle' : `${(Array.from(selectedComponents)[0] as string).toUpperCase()} Fee`
    };

    setSyncing(true);
    try {
      await db.create('invoices', newInvoice);
      showToast?.("Bill Created", "success", `Fees for ${student.name} have been billed.`);
      setShowBillModal(null);
      loadData();
    } catch (e: any) {
      showToast?.("Sync Error", "error", "Could not save bill to database.");
    } finally {
      setSyncing(false);
    }
  };

  const processPayment = async (invoice: Invoice, method: 'Cash' | 'Online') => {
    setSyncing(true);
    try {
      await db.update('invoices', invoice.id, { 
        status: 'Paid', 
        paymentMethod: method,
        paidAt: new Date().toISOString()
      });
      
      const otherPending = invoices.filter(i => i.studentId === invoice.studentId && i.id !== invoice.id && i.status !== 'Paid').length;
      if (otherPending === 0) {
        await db.update('students', invoice.studentId, { feesStatus: 'Paid' });
      }

      showToast?.("Paid Successfully", "success", `Received ₹${invoice.amount.toLocaleString()} via ${method}.`);
      loadData();
    } catch (e) {
      showToast?.("Error", "error", "Failed to update payment.");
    } finally {
      setSyncing(false);
    }
  };

  if (isParent) {
    const myChild = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const myInvoices = myChild ? invoices.filter(i => i.studentId === myChild.id).sort((a,b) => b.id.localeCompare(a.id)) : [];

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Fee Wallet</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Payments for {myChild?.name}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unpaid Balance</p>
            <h3 className="text-4xl md:text-5xl font-black text-rose-500 tracking-tight">₹{myInvoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {myInvoices.map((inv) => (
             <div key={inv.id} className={`p-6 md:p-8 rounded-3xl border-2 transition-all relative overflow-hidden group ${inv.status === 'Paid' ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-900 border-slate-900 shadow-xl'}`}>
                {inv.status === 'Paid' && <div className="absolute top-0 right-0 bg-emerald-500 text-white px-5 py-2 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><Check className="w-3 h-3" /> PAID</div>}
                
                <div className="flex justify-between items-start mb-6 md:mb-10">
                   <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-white/10 text-white'}`}>
                      <Receipt className="w-6 h-6 md:w-8 md:h-8" />
                   </div>
                   <div className="text-right">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${inv.status === 'Paid' ? 'text-slate-400' : 'text-blue-400'}`}>Bill Date</p>
                      <p className={`font-bold ${inv.status === 'Paid' ? 'text-slate-600' : 'text-white'}`}>{inv.dueDate}</p>
                   </div>
                </div>

                <div className="mb-8 md:mb-12">
                   <h3 className={`text-xl md:text-2xl font-black mb-3 tracking-tight ${inv.status === 'Paid' ? 'text-slate-900' : 'text-white'}`}>{inv.type}</h3>
                   <div className="space-y-1.5">
                      {inv.breakdown && Object.entries(inv.breakdown).map(([k,v]) => (
                        <div key={k} className="flex justify-between text-xs font-medium">
                           <span className={inv.status === 'Paid' ? 'text-slate-400' : 'text-white/40 uppercase tracking-widest text-[9px]'}>{k.replace('term', 'Term ')}</span>
                           <span className={inv.status === 'Paid' ? 'text-slate-600' : 'text-white/80'}>₹{(v as number).toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                   <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${inv.status === 'Paid' ? 'text-slate-400' : 'text-white/40'}`}>Amount</p>
                      <p className={`text-2xl md:text-3xl font-black tracking-tight ${inv.status === 'Paid' ? 'text-slate-900' : 'text-white'}`}>₹{inv.amount.toLocaleString()}</p>
                   </div>
                   {inv.status !== 'Paid' ? (
                     <button 
                       onClick={() => processPayment(inv, 'Online')} 
                       className="bg-blue-600 hover:bg-blue-500 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                     >
                       <CreditCard className="w-4 h-4" /> Pay Now
                     </button>
                   ) : (
                     <button 
                       onClick={() => setSelectedInvoice(inv)}
                       className="bg-slate-50 text-slate-400 hover:text-blue-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100"
                     >
                       <Printer className="w-4 h-4" /> Receipt
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-full pb-20 animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-6 md:py-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Banknote className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" /> Payments & Fees
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage school bills and collections</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
             <button onClick={() => setShowConfigModal(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-5 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"><Settings className="w-4 h-4" /> Set Fees</button>
             <button onClick={loadData} className="flex-1 md:flex-none bg-white border-2 border-slate-100 px-5 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">{syncing ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <RefreshCw className="w-4 h-4" />} Refresh</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 md:space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
           <SummaryStat icon={CheckCircle} label="Fees Collected" value={stats.collected} color="bg-emerald-600" />
           <SummaryStat icon={TrendingUp} label="Money to Collect" value={stats.receivables} color="bg-orange-500" />
           <SummaryStat icon={Target} label="Total Year Expected" value={stats.total} color="bg-blue-600" />
        </div>

        {/* Directory Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button onClick={() => setActiveProgram('All')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeProgram === 'All' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>All Classes</button>
              {PROGRAMS.map(p => <button key={p} onClick={() => setActiveProgram(p)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeProgram === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>{p}</button>)}
           </div>
           <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search student name..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Main List */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-6">Student</th>
                      <th className="px-10 py-6 text-center">Unpaid Bills</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredStudents.map((s) => {
                      const pendingInvoices = invoices.filter(i => i.studentId === s.id && i.status !== 'Paid');
                      return (
                        <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                 <img src={s.image} className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-md" />
                                 <div>
                                    <p className="text-base font-black text-slate-900 leading-none mb-1.5">{s.name}</p>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{s.program}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8 text-center">
                              {pendingInvoices.length > 0 ? (
                                <div className="space-y-2">
                                   {pendingInvoices.map(inv => (
                                     <div key={inv.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                                        <div className="text-left"><span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-1">{inv.type}</span><span className="text-sm font-black text-slate-900">₹{inv.amount.toLocaleString()}</span></div>
                                        <button onClick={() => processPayment(inv, 'Cash')} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-50 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"><Coins className="w-3.5 h-3.5" /> Collect Cash</button>
                                     </div>
                                   ))}
                                </div>
                              ) : <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">All Paid</span>}
                           </td>
                           <td className="px-10 py-8 text-right">
                              <button onClick={() => { setSelectedComponents(new Set()); setShowBillModal(s); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 flex items-center gap-2 ml-auto"><Plus className="w-4 h-4" /> Create Bill</button>
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
             {filteredStudents.length === 0 ? (
               <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No students found</div>
             ) : filteredStudents.map(s => {
               const pendingInvoices = invoices.filter(i => i.studentId === s.id && i.status !== 'Paid');
               return (
                 <div key={s.id} className="p-5 space-y-6">
                    <div className="flex items-center gap-4">
                       <img src={s.image} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100 shadow-sm" />
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{s.name}</p>
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{s.program}</span>
                       </div>
                       <button onClick={() => { setSelectedComponents(new Set()); setShowBillModal(s); }} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
                    </div>

                    {pendingInvoices.length > 0 ? (
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Payments</p>
                         {pendingInvoices.map(inv => (
                           <div key={inv.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                              <div className="flex-1">
                                 <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">{inv.type}</p>
                                 <p className="text-lg font-black text-slate-900">₹{inv.amount.toLocaleString()}</p>
                              </div>
                              <button onClick={() => processPayment(inv, 'Cash')} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-50 active:scale-95 transition-all"><Coins className="w-4 h-4" /></button>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                         <ShieldCheck className="w-4 h-4 text-emerald-500" />
                         <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Account Clear</span>
                      </div>
                    )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      {/* BILL CREATION MODAL */}
      {showBillModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl md:rounded-[3.5rem] w-full max-w-xl shadow-2xl relative border border-white/20 overflow-hidden">
               <div className="p-6 md:p-12 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Create a Bill</h3>
                    <p className="text-slate-500 text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest">Charging {showBillModal.name}</p>
                  </div>
                  <button onClick={() => setShowBillModal(null)} className="w-10 h-10 md:w-14 md:h-14 bg-white text-slate-400 hover:text-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center border border-slate-200 transition-all shadow-sm"><X className="w-6 h-6 md:w-7 md:h-7" /></button>
               </div>

               <div className="p-6 md:p-12 space-y-6 md:space-y-8 overflow-y-auto max-h-[60vh] no-scrollbar">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Choose items to include</p>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter hidden sm:inline">Grey items are already billed</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                     {Object.entries(getBreakdownForStudent(showBillModal)).map(([key, val]) => {
                       const isBilled = alreadyBilledComponents.has(key);
                       const isSelected = selectedComponents.has(key as any);

                       return (
                         <button 
                           key={key} 
                           disabled={isBilled}
                           onClick={() => {
                             const next = new Set(selectedComponents);
                             if (next.has(key as any)) next.delete(key as any);
                             else next.add(key as any);
                             setSelectedComponents(next);
                           }}
                           className={`flex items-center justify-between px-6 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-[1.8rem] border-2 transition-all ${
                             isBilled 
                             ? 'bg-slate-50 border-slate-50 opacity-40 cursor-not-allowed' 
                             : isSelected 
                                ? 'border-blue-600 bg-blue-50/50 shadow-lg' 
                                : 'border-slate-100 bg-white hover:border-slate-200'
                           }`}
                         >
                            <div className="flex items-center gap-4 md:gap-5">
                               <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center border-2 transition-all ${
                                 isBilled 
                                 ? 'bg-slate-200 border-slate-200' 
                                 : isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                               }`}>
                                  {isBilled ? <ShieldCheck className="w-4 h-4 text-slate-400" /> : isSelected && <Check className="w-5 h-5 text-white" />}
                               </div>
                               <span className={`text-sm md:text-base font-black uppercase tracking-widest ${isBilled ? 'text-slate-400' : 'text-slate-700'}`}>
                                 {key.replace('term', 'Term ')}
                               </span>
                            </div>
                            <div className="text-right">
                               <span className={`text-sm md:text-base font-black ${isBilled ? 'text-slate-300' : 'text-slate-900'}`}>₹{val.toLocaleString()}</span>
                            </div>
                         </button>
                       );
                     })}
                  </div>
               </div>

               <div className="p-6 md:p-12 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill Amount</p>
                     <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">₹{Array.from(selectedComponents).reduce((sum, key) => sum + getBreakdownForStudent(showBillModal!)[key], 0).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => handleGenerateInvoice(showBillModal)}
                    disabled={selectedComponents.size === 0 || syncing}
                    className="w-full md:w-auto bg-blue-600 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  >
                     {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5" /> Send Bill</>}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* SETTINGS MODAL (SET FEES) */}
      {showConfigModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl md:rounded-[4rem] w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
               <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Setup School Fees</h3>
                    <p className="text-slate-500 text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest">Define how much each term costs for various programs</p>
                  </div>
                  <button onClick={() => setShowConfigModal(false)} className="w-10 h-10 md:w-16 md:h-16 bg-white text-slate-400 hover:text-slate-900 rounded-xl md:rounded-3xl flex items-center justify-center border border-slate-200 transition-all shadow-sm"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 md:space-y-12 no-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">1. Pick a Program</label>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                           {PROGRAMS.map(p => (
                             <button key={p} onClick={() => setConfigActiveProgram(p)} className={`px-4 md:px-6 py-4 md:py-5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${configActiveProgram === p ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>{p}</button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">2. Pick a Category</label>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                           {OFFERS.map(o => (
                             <button key={o} onClick={() => setConfigActiveOffer(o)} className={`px-4 md:px-6 py-4 md:py-5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${configActiveOffer === o ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'}`}>{o}</button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border-2 border-slate-100">
                     <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-8 md:mb-12 flex items-center gap-3"><Coins className="w-6 h-6" /> Editing Costs for {configActiveProgram}</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                        {(['application', 'registration', 'material', 'term1', 'term2', 'term3'] as const).map((field) => (
                           <div key={field} className="space-y-2 group">
                              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">{field.replace('term', 'Term ')} Cost</label>
                              <div className="relative">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">₹</span>
                                 <input 
                                   type="number"
                                   value={matrix[configActiveProgram][configActiveOffer][field]}
                                   onChange={e => setMatrix(prev => ({
                                      ...prev,
                                      [configActiveProgram]: {
                                         ...prev[configActiveProgram],
                                         [configActiveOffer]: {
                                            ...prev[configActiveProgram][configActiveOffer],
                                            [field]: Number(e.target.value)
                                         }
                                      }
                                   }))}
                                   className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-4 md:py-6 bg-white border-2 border-slate-100 rounded-2xl md:rounded-3xl text-base md:text-lg font-black outline-none focus:border-blue-600 shadow-sm transition-all focus:shadow-xl"
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-8 md:p-12 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                  <div className="flex items-baseline gap-4 md:gap-6">
                     <span className="text-slate-400 text-[10px] md:text-sm font-black uppercase tracking-widest whitespace-nowrap">Total Year Plan:</span>
                     <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">₹{Object.values(matrix[configActiveProgram][configActiveOffer]).reduce((a: number, b: any) => a + (b as number), 0).toLocaleString()}</span>
                  </div>
                  <button onClick={() => { localStorage.setItem('JOIS_FEE_MATRIX_V2', JSON.stringify(matrix)); showToast?.("Prices Updated", "success", "The new costs have been saved."); setShowConfigModal(false); }} className="w-full md:w-auto bg-slate-900 text-white px-10 md:px-16 py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4"><Save className="w-6 h-6" /> Save All Costs</button>
               </div>
            </div>
         </div>
      )}

      {/* RECEIPT VIEW */}
      {selectedInvoice && (
         <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-2 md:p-4 animate-in fade-in duration-300 print:p-0 print:bg-white print:fixed print:inset-0">
            <div className="bg-white rounded-3xl md:rounded-[4rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col print:rounded-none print:shadow-none print:max-w-none print:h-screen">
               <div className="flex justify-between items-center p-6 md:p-12 bg-slate-50 border-b border-slate-100 print:hidden">
                  <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Official Receipt</h4>
                  <div className="flex gap-2 md:gap-4">
                     <button onClick={() => window.print()} className="w-12 h-12 md:w-16 md:h-16 bg-white text-slate-600 hover:text-blue-600 rounded-xl md:rounded-3xl flex items-center justify-center border-2 border-slate-100 transition-all shadow-sm"><Printer className="w-6 h-6" /></button>
                     <button onClick={() => setSelectedInvoice(null)} className="w-12 h-12 md:w-16 md:h-16 bg-white text-slate-400 hover:text-rose-600 rounded-xl md:rounded-3xl flex items-center justify-center border-2 border-slate-100 transition-all shadow-sm"><X className="w-8 h-8" /></button>
                  </div>
               </div>

               <div className="p-10 md:p-20 space-y-12 md:space-y-16 overflow-y-auto no-scrollbar print:p-12">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0">
                     <div>
                        <img src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" className="h-16 md:h-24 w-auto mb-6 md:mb-8" />
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-none">Junior Odyssey</h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 md:mt-4">Payment Confirmation</p>
                     </div>
                     <div className="text-left md:text-right w-full md:w-auto">
                        <h2 className="text-5xl md:text-7xl font-black text-slate-100 uppercase tracking-tighter mb-6 md:mb-10 leading-none">PAID</h2>
                        <div className="space-y-1 md:space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill ID</p>
                           <p className="text-sm md:text-base font-black text-slate-900 uppercase">{selectedInvoice.id}</p>
                        </div>
                        <div className="space-y-1 md:space-y-2 mt-4 md:mt-8">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Paid</p>
                           <p className="text-sm md:text-base font-black text-slate-900">{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleDateString() : '—'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 border-y-2 border-slate-50 py-10 md:py-16">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 uppercase leading-none">{selectedInvoice.studentName}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID: {selectedInvoice.studentId}</p>
                     </div>
                     <div className="space-y-3 text-left md:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Via</p>
                        <p className={`text-2xl md:text-3xl font-black uppercase leading-none text-emerald-500`}>{selectedInvoice.paymentMethod || 'CASH'}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status: Fully Settled</p>
                     </div>
                  </div>

                  <div className="space-y-8 md:space-y-10">
                     <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 md:pb-8 border-b-4 border-slate-900">
                        <span className="col-span-2">Item Description</span>
                        <span className="text-right">Amount (₹)</span>
                     </div>
                     
                     <div className="space-y-6 md:space-y-8">
                        {selectedInvoice.breakdown && (Object.entries(selectedInvoice.breakdown) as [string, number][]).map(([k, v]) => (
                           <div key={k} className="grid grid-cols-3 items-center group">
                              <span className="col-span-2 text-base md:text-lg font-black text-slate-700 uppercase tracking-widest">{k.replace('term', 'Term ')} Fee</span>
                              <span className="text-right text-lg md:text-xl font-black text-slate-900">₹{v.toLocaleString()}</span>
                           </div>
                        ))}
                     </div>

                     <div className="pt-10 md:pt-16 mt-12 md:mt-20 border-t-8 border-slate-900 flex justify-between items-center">
                        <p className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-widest">Total Amount</p>
                        <p className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">₹{selectedInvoice.amount.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="pt-20 md:pt-32 text-center">
                     <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">
                        This is an official document from Junior Odyssey International School. 
                     </p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
