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
  Wallet,
} from 'lucide-react';
import { CURRENT_USER_ID } from '../data/mockData';
import { ToastType } from '../components/Toast';

// ─── Jois Brand Palette ───────────────────────────────────────────────────────
// Pink   #FF4B8B  light #FFF0F5  text #CC1A5A  border #FFB3CE
// Yellow #FFB800  light #FFFBEA  text #A07000  border #FFE080
// Green  #4BC83A  light #F0FBF0  text #217A15  border #A8E8A2
// Blue   #3BB5F0  light #EEF8FE  text #1270A0  border #99D8F8
// Orange #FF8C1A  light #FFF4EA  text #A05010  border #FFD0A0
// ─────────────────────────────────────────────────────────────────────────────

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
  term3: 10000,
};

const DEFAULT_FEE_MATRIX: FeeMatrix = PROGRAMS.reduce((acc, prog) => {
  acc[prog] = OFFERS.reduce((oAcc, offer) => {
    oAcc[offer] = { ...INITIAL_BREAKDOWN };
    return oAcc;
  }, {} as any);
  return acc;
}, {} as any);

const PROGRAM_COLORS: Record<string, { dot: string; light: string; text: string; border: string }> = {
  'Little Seeds':   { dot: '#FF4B8B', light: '#FFF0F5', text: '#CC1A5A', border: '#FFB3CE' },
  'Curiosity Cubs': { dot: '#FFB800', light: '#FFFBEA', text: '#A07000', border: '#FFE080' },
  'Odyssey Owls':   { dot: '#4BC83A', light: '#F0FBF0', text: '#217A15', border: '#A8E8A2' },
  'Future Makers':  { dot: '#3BB5F0', light: '#EEF8FE', text: '#1270A0', border: '#99D8F8' },
};

// ─── Summary Stat Card ────────────────────────────────────────────────────────

const SummaryStat = ({ icon: Icon, label, value, accentColor, lightColor }: any) => (
  <div
    className="bg-white p-4 md:p-6 rounded-2xl flex items-center gap-3 md:gap-4 flex-1 min-w-[140px] transition-all relative overflow-hidden"
    style={{ border: `1.5px solid ${accentColor}28`, boxShadow: `0 2px 14px ${accentColor}12` }}
  >
    <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: accentColor }} />
    <div
      className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
      style={{ background: lightColor }}
    >
      <Icon className="w-5 h-5 md:w-7 md:h-7" style={{ color: accentColor }} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-wider mb-0.5 md:mb-1.5 leading-none" style={{ color: '#9AA5B4' }}>{label}</p>
      <p className="text-lg md:text-2xl font-black leading-none truncate tracking-tight" style={{ color: '#1A2340' }}>₹{value.toLocaleString()}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices]                   = useState<Invoice[]>([]);
  const [students, setStudents]                   = useState<Student[]>([]);
  const [matrix, setMatrix]                       = useState<FeeMatrix>(DEFAULT_FEE_MATRIX);
  const [loading, setLoading]                     = useState(true);
  const [searchTerm, setSearchTerm]               = useState('');
  const [activeProgram, setActiveProgram]         = useState<'All' | ProgramType>('All');
  const [showConfigModal, setShowConfigModal]     = useState(false);
  const [configActiveProgram, setConfigActiveProgram] = useState<ProgramType>('Little Seeds');
  const [configActiveOffer, setConfigActiveOffer] = useState<OfferType>('Regular');
  const [showBillModal, setShowBillModal]         = useState<Student | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Set<keyof FeeBreakdown>>(new Set());
  const [syncing, setSyncing]                     = useState(false);
  const [selectedInvoice, setSelectedInvoice]     = useState<Invoice | null>(null);

  const isAdmin  = role === UserRole.ADMIN || role === UserRole.FOUNDER;
  const isParent = role === UserRole.PARENT;

  const loadData = useCallback(async () => {
    try {
      const [invs, stds] = await Promise.all([db.getAll('invoices'), db.getAll('students')]);
      setInvoices(invs || []);
      setStudents(stds || []);
    } catch (err) {
      console.error('Finance fetch error:', err);
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
    const offer  = (student.offer as OfferType) || 'Regular';
    return pRates[offer] || pRates['Regular'];
  }, [matrix]);

  const alreadyBilledComponents = useMemo(() => {
    if (!showBillModal) return new Set<string>();
    const studentInvoices = invoices.filter(i => i.studentId === showBillModal.id);
    const billedKeys = new Set<string>();
    studentInvoices.forEach(inv => {
      if (inv.breakdown) Object.keys(inv.breakdown).forEach(k => billedKeys.add(k));
    });
    return billedKeys;
  }, [showBillModal, invoices]);

  const filteredStudents = useMemo(() =>
    students.filter(s => {
      const matchesSearch  = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = activeProgram === 'All' || s.program === activeProgram;
      return matchesSearch && matchesProgram;
    }),
  [students, searchTerm, activeProgram]);

  const stats = useMemo(() => {
    const collected   = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
    const receivables = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.amount, 0);
    return { collected, receivables, total: collected + receivables };
  }, [invoices]);

  const handleGenerateInvoice = async (student: Student) => {
    const fullBreakdown     = getBreakdownForStudent(student);
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
      type: selectedComponents.size > 1 ? 'School Fee Bundle' : `${(Array.from(selectedComponents)[0] as string).toUpperCase()} Fee`,
    };
    setSyncing(true);
    try {
      await db.create('invoices', newInvoice);
      showToast?.('Bill Created', 'success', `Fees for ${student.name} have been billed.`);
      setShowBillModal(null);
      loadData();
    } catch {
      showToast?.('Sync Error', 'error', 'Could not save bill to database.');
    } finally {
      setSyncing(false);
    }
  };

  const processPayment = async (invoice: Invoice, method: 'Cash' | 'Online') => {
    setSyncing(true);
    try {
      await db.update('invoices', invoice.id, { status: 'Paid', paymentMethod: method, paidAt: new Date().toISOString() });
      const otherPending = invoices.filter(i => i.studentId === invoice.studentId && i.id !== invoice.id && i.status !== 'Paid').length;
      if (otherPending === 0) await db.update('students', invoice.studentId, { feesStatus: 'Paid' });
      showToast?.('Paid Successfully', 'success', `Received ₹${invoice.amount.toLocaleString()} via ${method}.`);
      loadData();
    } catch {
      showToast?.('Error', 'error', 'Failed to update payment.');
    } finally {
      setSyncing(false);
    }
  };

  // ─── Parent View ──────────────────────────────────────────────────────────

  if (isParent) {
    const myChild    = students.find(s => s.parentId === CURRENT_USER_ID) || students[0];
    const myInvoices = myChild
      ? invoices.filter(i => i.studentId === myChild.id).sort((a, b) => b.id.localeCompare(a.id))
      : [];
    const unpaidBalance = myInvoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);

    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto no-scrollbar pb-32" style={{ animation: 'fadeUp .4s ease' }}>

        {/* Header */}
        <div
          className="bg-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          style={{ border: '1.5px solid #F0F4F8', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EEF8FE' }}>
                <Wallet className="w-4 h-4" style={{ color: '#3BB5F0' }} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#1A2340' }}>Fee Wallet</h2>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 ml-10" style={{ color: '#9AA5B4' }}>Payments for {myChild?.name}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#9AA5B4' }}>Unpaid Balance</p>
            <h3
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: unpaidBalance > 0 ? '#FF4B8B' : '#4BC83A' }}
            >
              ₹{unpaidBalance.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Invoice Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {myInvoices.map(inv => {
            const isPaid = inv.status === 'Paid';
            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all"
                style={{
                  border: isPaid ? '1.5px solid #A8E8A2' : '1.5px solid #FFB3CE',
                  boxShadow: isPaid ? '0 2px 12px #4BC83A10' : '0 4px 20px #FF4B8B14',
                }}
              >
                {/* Top accent */}
                <span
                  className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
                  style={{ background: isPaid ? '#4BC83A' : '#FF4B8B' }}
                />

                {isPaid && (
                  <div
                    className="absolute top-3 right-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5"
                    style={{ background: '#4BC83A' }}
                  >
                    <Check className="w-3 h-3" /> Paid
                  </div>
                )}

                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: isPaid ? '#F0FBF0' : '#FFF0F5' }}
                  >
                    <Receipt className="w-6 h-6 md:w-7 md:h-7" style={{ color: isPaid ? '#4BC83A' : '#FF4B8B' }} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#9AA5B4' }}>Due Date</p>
                    <p className="font-bold text-sm" style={{ color: '#1A2340' }}>{inv.dueDate}</p>
                  </div>
                </div>

                <div className="mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-black mb-3 tracking-tight" style={{ color: '#1A2340' }}>{inv.type}</h3>
                  <div className="space-y-1.5">
                    {inv.breakdown && Object.entries(inv.breakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs font-medium">
                        <span style={{ color: '#9AA5B4' }}>{k.replace('term', 'Term ')}</span>
                        <span style={{ color: '#4A5568' }}>₹{(v as number).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5" style={{ borderTop: `1px solid ${isPaid ? '#A8E8A2' : '#FFB3CE'}` }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Amount</p>
                    <p className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#1A2340' }}>₹{inv.amount.toLocaleString()}</p>
                  </div>
                  {!isPaid ? (
                    <button
                      onClick={() => processPayment(inv, 'Online')}
                      className="px-6 md:px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 text-white"
                      style={{ background: '#3BB5F0', boxShadow: '0 4px 14px #3BB5F030' }}
                    >
                      <CreditCard className="w-4 h-4" /> Pay Now
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                      style={{ background: '#F0FBF0', color: '#217A15', border: '1.5px solid #A8E8A2' }}
                    >
                      <Printer className="w-4 h-4" /> Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Admin / Staff View ───────────────────────────────────────────────────

  return (
    <div className="w-full min-h-full pb-20" style={{ background: '#F8FAFC', animation: 'fadeUp .4s ease' }}>

      {/* Page Header */}
      <div className="bg-white px-6 md:px-8 py-6 md:py-8" style={{ borderBottom: '1.5px solid #F0F4F8' }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#F0FBF0', border: '1.5px solid #A8E8A2' }}>
              <Banknote className="w-6 h-6" style={{ color: '#4BC83A' }} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: '#1A2340' }}>Payments & Fees</h2>
              <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: '#9AA5B4' }}>Manage school bills and collections</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex-1 md:flex-none px-5 md:px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 text-white"
              style={{ background: '#1A2340', boxShadow: '0 4px 14px rgba(26,35,64,0.25)' }}
            >
              <Settings className="w-4 h-4" /> Set Fees
            </button>
            <button
              onClick={loadData}
              className="flex-1 md:flex-none px-5 md:px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{ background: '#fff', color: '#4A5568', border: '1.5px solid #F0F4F8' }}
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#3BB5F0' }} /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <SummaryStat icon={CheckCircle} label="Fees Collected"      value={stats.collected}   accentColor="#4BC83A" lightColor="#F0FBF0" />
          <SummaryStat icon={TrendingUp}  label="Money to Collect"    value={stats.receivables} accentColor="#FF8C1A" lightColor="#FFF4EA" />
          <SummaryStat icon={Target}      label="Total Year Expected"  value={stats.total}       accentColor="#3BB5F0" lightColor="#EEF8FE" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveProgram('All')}
              className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              style={activeProgram === 'All'
                ? { background: '#3BB5F0', color: '#fff', boxShadow: '0 2px 8px #3BB5F030' }
                : { background: '#fff', color: '#9AA5B4', border: '1.5px solid #F0F4F8' }}
            >
              All Classes
            </button>
            {PROGRAMS.map(p => {
              const pc = PROGRAM_COLORS[p];
              return (
                <button
                  key={p}
                  onClick={() => setActiveProgram(p)}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  style={activeProgram === p
                    ? { background: pc.dot, color: '#fff', boxShadow: `0 2px 8px ${pc.dot}30` }
                    : { background: '#fff', color: '#9AA5B4', border: '1.5px solid #F0F4F8' }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9AA5B4' }} />
            <input
              type="text"
              placeholder="Search student name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
              style={{ background: '#fff', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F0F4F8' }}>
                <tr>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Student</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: '#9AA5B4' }}>Unpaid Bills</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: '#9AA5B4' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const pendingInvoices = invoices.filter(i => i.studentId === s.id && i.status !== 'Paid');
                  const pc = PROGRAM_COLORS[s.program] ?? PROGRAM_COLORS['Little Seeds'];
                  return (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors" style={{ borderBottom: '1px solid #F0F4F8' }}>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-5">
                          <img src={s.image} className="w-14 h-14 rounded-2xl object-cover shadow-md" style={{ border: '3px solid #F0F4F8' }} />
                          <div>
                            <p className="text-base font-black leading-none mb-2" style={{ color: '#1A2340' }}>{s.name}</p>
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                              style={{ background: pc.light, color: pc.text, border: `1px solid ${pc.border}` }}
                            >
                              {s.program}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        {pendingInvoices.length > 0 ? (
                          <div className="space-y-2">
                            {pendingInvoices.map(inv => (
                              <div
                                key={inv.id}
                                className="flex items-center justify-between p-3 rounded-2xl"
                                style={{ background: '#FFF0F5', border: '1px solid #FFB3CE' }}
                              >
                                <div className="text-left">
                                  <span className="text-[9px] font-bold uppercase block leading-none mb-1" style={{ color: '#9AA5B4' }}>{inv.type}</span>
                                  <span className="text-sm font-black" style={{ color: '#1A2340' }}>₹{inv.amount.toLocaleString()}</span>
                                </div>
                                <button
                                  onClick={() => processPayment(inv, 'Cash')}
                                  className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 text-white"
                                  style={{ background: '#4BC83A', boxShadow: '0 2px 8px #4BC83A30' }}
                                >
                                  <Coins className="w-3.5 h-3.5" /> Collect Cash
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full"
                            style={{ background: '#F0FBF0', color: '#217A15' }}
                          >
                            All Paid
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button
                          onClick={() => { setSelectedComponents(new Set()); setShowBillModal(s); }}
                          className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ml-auto text-white"
                          style={{ background: '#FF4B8B', boxShadow: '0 2px 10px #FF4B8B28' }}
                        >
                          <Plus className="w-4 h-4" /> Create Bill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9AA5B4' }}>No students found</div>
            ) : filteredStudents.map(s => {
              const pendingInvoices = invoices.filter(i => i.studentId === s.id && i.status !== 'Paid');
              const pc = PROGRAM_COLORS[s.program] ?? PROGRAM_COLORS['Little Seeds'];
              return (
                <div key={s.id} className="p-5 space-y-5" style={{ borderBottom: '1px solid #F0F4F8' }}>
                  <div className="flex items-center gap-4">
                    <img src={s.image} className="w-12 h-12 rounded-xl object-cover" style={{ border: '2px solid #F0F4F8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: '#1A2340' }}>{s.name}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: pc.text }}>{s.program}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedComponents(new Set()); setShowBillModal(s); }}
                      className="p-2.5 rounded-xl active:scale-90 transition-all text-white"
                      style={{ background: '#FF4B8B' }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {pendingInvoices.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Pending Payments</p>
                      {pendingInvoices.map(inv => (
                        <div key={inv.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: '#FFF0F5', border: '1px solid #FFB3CE' }}>
                          <div className="flex-1">
                            <p className="text-[9px] font-bold uppercase leading-none mb-1" style={{ color: '#9AA5B4' }}>{inv.type}</p>
                            <p className="text-lg font-black" style={{ color: '#1A2340' }}>₹{inv.amount.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => processPayment(inv, 'Cash')}
                            className="p-2.5 rounded-xl text-white active:scale-95 transition-all"
                            style={{ background: '#4BC83A' }}
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#F0FBF0', border: '1px solid #A8E8A2' }}>
                      <ShieldCheck className="w-4 h-4" style={{ color: '#4BC83A' }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#217A15' }}>Account Clear</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bill Creation Modal ── */}
      {showBillModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,30,60,0.55)', backdropFilter: 'blur(10px)', animation: 'fadeUp .25s ease' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>

            {/* Modal Header */}
            <div className="p-6 md:p-10 flex justify-between items-start" style={{ borderBottom: '1px solid #F0F4F8', background: '#F8FAFC' }}>
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#1A2340' }}>Create a Bill</h3>
                <p className="text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Charging {showBillModal.name}</p>
              </div>
              <button
                onClick={() => setShowBillModal(null)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all"
                style={{ background: '#FFF0F5', color: '#FF4B8B', border: '1.5px solid #FFB3CE' }}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Items */}
            <div className="p-6 md:p-10 space-y-4 overflow-y-auto max-h-[55vh] no-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Choose items to include</p>
                <span className="text-[8px] font-bold uppercase tracking-tighter hidden sm:inline" style={{ color: '#CBD5E1' }}>Grey = already billed</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(getBreakdownForStudent(showBillModal)).map(([key, val]) => {
                  const isBilled   = alreadyBilledComponents.has(key);
                  const isSelected = selectedComponents.has(key as any);
                  return (
                    <button
                      key={key}
                      disabled={isBilled}
                      onClick={() => {
                        const next = new Set(selectedComponents);
                        if (next.has(key as any)) next.delete(key as any); else next.add(key as any);
                        setSelectedComponents(next);
                      }}
                      className="flex items-center justify-between px-5 md:px-6 py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        border: isBilled ? '1.5px solid #F0F4F8'
                          : isSelected ? '1.5px solid #3BB5F0'
                          : '1.5px solid #F0F4F8',
                        background: isBilled ? '#F8FAFC'
                          : isSelected ? '#EEF8FE'
                          : '#fff',
                        boxShadow: isSelected ? '0 2px 10px #3BB5F020' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                          style={isBilled
                            ? { background: '#F0F4F8', border: '2px solid #E2E8F0' }
                            : isSelected
                              ? { background: '#3BB5F0', border: '2px solid #3BB5F0' }
                              : { background: '#fff', border: '2px solid #E2E8F0' }}
                        >
                          {isBilled
                            ? <ShieldCheck className="w-4 h-4" style={{ color: '#CBD5E1' }} />
                            : isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span
                          className="text-sm font-black uppercase tracking-widest"
                          style={{ color: isBilled ? '#9AA5B4' : '#1A2340' }}
                        >
                          {key.replace('term', 'Term ')}
                        </span>
                      </div>
                      <span className="text-sm font-black" style={{ color: isBilled ? '#CBD5E1' : '#1A2340' }}>
                        ₹{(val as number).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-6 md:p-10 bg-white flex flex-col md:flex-row justify-between items-center gap-4"
              style={{ borderTop: '1px solid #F0F4F8' }}
            >
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Total Bill Amount</p>
                <p className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: '#1A2340' }}>
                  ₹{Array.from(selectedComponents).reduce((sum, key) => sum + getBreakdownForStudent(showBillModal!)[key], 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleGenerateInvoice(showBillModal)}
                disabled={selectedComponents.size === 0 || syncing}
                className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-white active:scale-95"
                style={{ background: '#3BB5F0', boxShadow: '0 4px 16px #3BB5F030' }}
              >
                {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5" /> Send Bill</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Fees Modal ── */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,30,60,0.55)', backdropFilter: 'blur(10px)', animation: 'fadeUp .25s ease' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden" style={{ border: '1.5px solid #F0F4F8' }}>

            <div className="p-8 md:p-10 flex justify-between items-start" style={{ borderBottom: '1px solid #F0F4F8', background: '#F8FAFC' }}>
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#1A2340' }}>Setup School Fees</h3>
                <p className="text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest" style={{ color: '#9AA5B4' }}>
                  Define how much each term costs for various programs
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: '#FFF0F5', color: '#FF4B8B', border: '1.5px solid #FFB3CE' }}
              >
                <X className="w-5 h-5 md:w-7 md:h-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {/* Program Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>1. Pick a Program</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROGRAMS.map(p => {
                      const pc = PROGRAM_COLORS[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setConfigActiveProgram(p)}
                          className="px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                          style={configActiveProgram === p
                            ? { background: pc.dot, color: '#fff', border: `1.5px solid ${pc.dot}`, boxShadow: `0 4px 14px ${pc.dot}30` }
                            : { background: '#fff', color: '#9AA5B4', border: '1.5px solid #F0F4F8' }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Offer Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>2. Pick a Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OFFERS.map(o => (
                      <button
                        key={o}
                        onClick={() => setConfigActiveOffer(o)}
                        className="px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                        style={configActiveOffer === o
                          ? { background: '#4BC83A', color: '#fff', border: '1.5px solid #4BC83A', boxShadow: '0 4px 14px #4BC83A30' }
                          : { background: '#fff', color: '#9AA5B4', border: '1.5px solid #F0F4F8' }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fee Inputs */}
              <div className="p-6 md:p-8 rounded-2xl" style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8' }}>
                <h4 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ color: '#1A2340' }}>
                  <Coins className="w-5 h-5" style={{ color: '#FFB800' }} /> Editing Costs for {configActiveProgram}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(['application', 'registration', 'material', 'term1', 'term2', 'term3'] as const).map(field => (
                    <div key={field} className="space-y-2 group">
                      <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: '#9AA5B4' }}>
                        {field.replace('term', 'Term ')} Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg" style={{ color: '#CBD5E1' }}>₹</span>
                        <input
                          type="number"
                          value={matrix[configActiveProgram][configActiveOffer][field]}
                          onChange={e => setMatrix(prev => ({
                            ...prev,
                            [configActiveProgram]: {
                              ...prev[configActiveProgram],
                              [configActiveOffer]: {
                                ...prev[configActiveProgram][configActiveOffer],
                                [field]: Number(e.target.value),
                              },
                            },
                          }))}
                          className="w-full pl-10 pr-5 py-4 rounded-2xl text-base font-black outline-none transition-all"
                          style={{ background: '#fff', border: '1.5px solid #F0F4F8', color: '#1A2340' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-7 md:p-10 bg-white flex flex-col md:flex-row items-center justify-between gap-5"
              style={{ borderTop: '1px solid #F0F4F8' }}
            >
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: '#9AA5B4' }}>Total Year Plan:</span>
                <span className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: '#1A2340' }}>
                  ₹{Object.values(matrix[configActiveProgram][configActiveOffer]).reduce((a: number, b: any) => a + (b as number), 0).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('JOIS_FEE_MATRIX_V2', JSON.stringify(matrix));
                  showToast?.('Prices Updated', 'success', 'The new costs have been saved.');
                  setShowConfigModal(false);
                }}
                className="w-full md:w-auto px-10 md:px-14 py-4 md:py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 text-white"
                style={{ background: '#4BC83A', boxShadow: '0 4px 16px #4BC83A30' }}
              >
                <Save className="w-5 h-5" /> Save All Costs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-2 md:p-4 print:p-0 print:bg-white print:fixed print:inset-0"
          style={{ background: 'rgba(15,30,60,0.92)', backdropFilter: 'blur(16px)', animation: 'fadeUp .25s ease' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col print:rounded-none print:shadow-none print:max-w-none print:h-screen" style={{ border: '1.5px solid #F0F4F8' }}>

            {/* Receipt Header */}
            <div className="flex justify-between items-center p-6 md:p-10 print:hidden" style={{ background: '#F8FAFC', borderBottom: '1px solid #F0F4F8' }}>
              <h4 className="font-black text-[10px] uppercase tracking-widest" style={{ color: '#1A2340' }}>Official Receipt</h4>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                  style={{ background: '#EEF8FE', color: '#3BB5F0', border: '1.5px solid #99D8F8' }}
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                  style={{ background: '#FFF0F5', color: '#FF4B8B', border: '1.5px solid #FFB3CE' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-10 md:p-16 space-y-10 overflow-y-auto no-scrollbar print:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <img src="https://www.joischools.com/assets/jois-logo-BUnvOotz.png" className="h-14 md:h-20 w-auto mb-5" />
                  <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: '#1A2340' }}>Junior Odyssey</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2" style={{ color: '#3BB5F0' }}>Payment Confirmation</p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-5 leading-none" style={{ color: '#4BC83A' }}>PAID</h2>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Bill ID</p>
                    <p className="text-sm font-black uppercase" style={{ color: '#1A2340' }}>{selectedInvoice.id}</p>
                  </div>
                  <div className="space-y-1 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Date Paid</p>
                    <p className="text-sm font-black" style={{ color: '#1A2340' }}>
                      {selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8" style={{ borderTop: '2px solid #F0F4F8', borderBottom: '2px solid #F0F4F8' }}>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Student Details</p>
                  <p className="text-2xl font-black uppercase leading-none" style={{ color: '#1A2340' }}>{selectedInvoice.studentName}</p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9AA5B4' }}>ID: {selectedInvoice.studentId}</p>
                </div>
                <div className="space-y-2 text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9AA5B4' }}>Paid Via</p>
                  <p className="text-2xl font-black uppercase leading-none" style={{ color: '#4BC83A' }}>{selectedInvoice.paymentMethod || 'CASH'}</p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9AA5B4' }}>Status: Fully Settled</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-widest pb-5" style={{ color: '#9AA5B4', borderBottom: `3px solid #1A2340` }}>
                  <span className="col-span-2">Item Description</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                <div className="space-y-5">
                  {selectedInvoice.breakdown && (Object.entries(selectedInvoice.breakdown) as [string, number][]).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 items-center">
                      <span className="col-span-2 text-base font-black uppercase tracking-widest" style={{ color: '#4A5568' }}>{k.replace('term', 'Term ')} Fee</span>
                      <span className="text-right text-lg font-black" style={{ color: '#1A2340' }}>₹{v.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-8 mt-8 flex justify-between items-center" style={{ borderTop: `4px solid #1A2340` }}>
                  <p className="text-xl font-black uppercase tracking-widest" style={{ color: '#1A2340' }}>Total Amount</p>
                  <p className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: '#1A2340' }}>₹{selectedInvoice.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-12 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose max-w-sm mx-auto" style={{ color: '#9AA5B4' }}>
                  This is an official document from Junior Odyssey International School.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
