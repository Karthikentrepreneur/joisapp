import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import { mockInvoices, getMyChild } from '../data/mockData';
import { UserRole, Invoice, Student } from '../types';
import { 
  DollarSign, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Loader2, 
  X,
  History,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ToastType } from '../components/Toast';

interface FeesProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

export const Fees: React.FC<FeesProps> = ({ role, showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const isParent = role === UserRole.PARENT;
  const child = isParent ? getMyChild() : null;

  const loadInvoices = async () => {
    setLoading(true);
    const data = await db.getAll('invoices');
    if (isParent && child) {
      setInvoices(data.filter(i => i.studentId === child.id));
    } else {
      setInvoices(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [role]);

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);

  const pieData = [
    { name: 'Collected', value: totalCollected, color: '#10b981' },
    { name: 'Pending', value: totalPending, color: '#3b82f6' },
    { name: 'Overdue', value: totalOverdue, color: '#ef4444' },
  ];

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedInvoice) return;
    setProcessing(true);
    try {
      await schoolService.collectPayment(selectedInvoice.id);
      await loadInvoices();
      setShowPaymentModal(false);
      showToast?.("Payment Successful", "success", `₹${selectedInvoice.amount.toLocaleString()} received. Your receipt is now available.`);
    } catch (e) {
      showToast?.("Payment Failed", "error", "The transaction could not be completed. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isParent && child ? `Finances for ${child.name}` : "School Finance Hub"}
          </h2>
          <p className="text-slate-500 font-medium">
            {isParent ? "View and pay school fees securely using our digital portal." : "Real-time revenue tracking and invoice management."}
          </p>
        </div>
        {!isParent && (
           <button className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 flex items-center gap-3 transition-all active:scale-95">
              <Download className="w-4 h-4" /> Export Financials
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-2 bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-6">
             <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle className="w-7 h-7" />
             </div>
             <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{isParent ? "You have Paid" : "Total Revenue"}</p>
            <h3 className="text-3xl font-black text-slate-900">₹{totalCollected.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-2 bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-6">
             <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Clock className="w-7 h-7" />
             </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Outstanding</p>
            <h3 className="text-3xl font-black text-slate-900">₹{totalPending.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-2 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-6">
             <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                <AlertCircle className="w-7 h-7" />
             </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Overdue Payments</p>
            <h3 className="text-3xl font-black text-slate-900">₹{totalOverdue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
               <History className="w-6 h-6 text-blue-500" />
               Transaction Ledger
            </h3>
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
               {invoices.length} Records
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <tr>
                  <th className="px-8 py-5">Reference</th>
                  <th className="px-8 py-5">Service Type</th>
                  <th className="px-8 py-5">Net Amount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading ledger...</td></tr>
                ) : invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                         <p className="font-black text-slate-800 text-sm">{inv.id}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inv.studentName}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">{inv.type}</td>
                      <td className="px-8 py-6 font-black text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          inv.status === 'Paid' ? 'bg-emerald-500 text-white' : 
                          inv.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                          'bg-rose-500 text-white'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {inv.status !== 'Paid' ? (
                          <button 
                            onClick={() => handlePayClick(inv)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-100 transition-all active:scale-95"
                          >
                            Pay Online
                          </button>
                        ) : (
                          <button className="text-xs font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 ml-auto">
                             <Download className="w-3.5 h-3.5" /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic">No financial activity found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full xl:w-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
           <h3 className="font-black text-slate-900 text-xl mb-8">Payment Distribution</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                   {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                 </Pie>
                 <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Fee for AY 2024</p>
                 <p className="text-3xl font-black text-slate-900">₹{(totalCollected + totalPending + totalOverdue).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 group cursor-pointer overflow-hidden relative">
                 <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                 <h4 className="text-lg font-black mb-1">Fee Receipts</h4>
                 <p className="text-indigo-100 text-xs font-medium leading-relaxed">Download your tax-saving fee certificates for the current financial year.</p>
                 <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest gap-2">Access Portal <ChevronRight className="w-3.5 h-3.5" /></div>
              </div>
           </div>
        </div>
      </div>

      {showPaymentModal && selectedInvoice && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-slate-900">Checkout</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
                     <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="bg-slate-50 p-8 rounded-[2rem] mb-8 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Payment</p>
                  <p className="font-black text-slate-900 text-2xl">{selectedInvoice.type} Maintenance</p>
                  <div className="flex justify-between mt-6 pt-6 border-t border-slate-200">
                     <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Amount Due</span>
                     <span className="text-3xl font-black text-blue-600">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                  </div>
               </div>

               <div className="space-y-3 mb-10">
                  <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <span className="font-black text-blue-900 uppercase tracking-widest text-xs">Verified Portal</span>
                     </div>
                     <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Transaction is SSL Encrypted</p>
               </div>

               <button 
                  onClick={processPayment} 
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
               >
                  {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><DollarSign className="w-5 h-5" /> Confirm & Pay</>}
               </button>
            </div>
         </div>
      )}
    </div>
  );
};
