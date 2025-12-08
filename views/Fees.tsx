import React, { useState } from 'react';
import { mockInvoices } from '../data/mockData';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const Fees: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const totalCollected = mockInvoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = mockInvoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = mockInvoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);

  const pieData = [
    { name: 'Collected', value: totalCollected, color: '#10b981' },
    { name: 'Pending', value: totalPending, color: '#3b82f6' },
    { name: 'Overdue', value: totalOverdue, color: '#ef4444' },
  ];

  const handlePayClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col overflow-y-auto animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fees & Finance</h2>
          <p className="text-slate-500">Manage invoices, payments, and financial reports.</p>
        </div>
        <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-900 shadow-sm flex items-center gap-2 transition-all w-full md:w-auto justify-center">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500"></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</p>
            <h3 className="text-3xl font-black text-slate-800">₹{totalCollected.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-500"></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
            <h3 className="text-3xl font-black text-slate-800">₹{totalPending.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-red-500"></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Overdue</p>
            <h3 className="text-3xl font-black text-slate-800">₹{totalOverdue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Invoice List */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Invoices</h3>
            <button className="text-sm text-blue-600 font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold">Invoice ID</th>
                    <th className="px-6 py-4 font-bold">Student</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{inv.id}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{inv.studentName}</td>
                      <td className="px-6 py-4 text-slate-600">{inv.type}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                          inv.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.status !== 'Paid' ? (
                          <button 
                            onClick={() => handlePayClick(inv)}
                            className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 font-semibold shadow-sm transition-colors"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <button className="text-xs text-slate-400 font-medium hover:text-slate-600">Download Receipt</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full xl:w-96 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
           <h3 className="font-bold text-slate-800 mb-4 w-full text-left">Revenue Overview</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                   ))}
                 </Pie>
                 <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 text-center bg-slate-50 rounded-xl p-4 w-full">
             <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Projected Total</p>
             <p className="text-2xl font-black text-slate-800">₹{(totalCollected + totalPending + totalOverdue).toLocaleString('en-IN')}</p>
           </div>
        </div>
      </div>

      {/* Payment Modal Simulation */}
      {showPaymentModal && selectedInvoice && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Secure Payment</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                     <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Payment for</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedInvoice.type} Fee</p>
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                     <span className="text-sm font-medium text-slate-600">Amount Due</span>
                     <span className="text-xl font-black text-blue-600">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                  </div>
               </div>

               <div className="space-y-3 mb-6">
                  <button className="w-full flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-xl text-blue-700 font-bold justify-center">
                     <CreditCard className="w-5 h-5" /> Pay with Card
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 justify-center">
                     <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px] text-white">B</span> Net Banking
                  </button>
               </div>

               <button 
                  onClick={() => {
                     alert("Payment processed successfully!");
                     setShowPaymentModal(false);
                  }} 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
               >
                  Complete Payment
               </button>
            </div>
         </div>
      )}
    </div>
  );
};