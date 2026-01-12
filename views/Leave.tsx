
import React, { useState, useEffect } from 'react';
import { UserRole, LeaveRequest } from '../types';
import { db } from '../services/persistence';
import { CalendarDays, Plus, Check, X, Clock, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getMyChild } from '../data/mockData';
import { ToastType } from '../components/Toast';

interface LeaveProps {
  role?: UserRole;
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

export const Leave: React.FC<LeaveProps> = ({ role, showToast }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [showModal, setShowModal] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isParent = role === UserRole.PARENT;
  const child = isParent ? getMyChild() : null;

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('leaveRequests');
      if (isParent && child) {
        setRequests(data.filter(r => r.studentId === child.id).sort((a, b) => b.requestDate.localeCompare(a.requestDate)));
      } else {
        setRequests(data.sort((a, b) => b.requestDate.localeCompare(a.requestDate)));
      }
    } catch (error) {
      console.error("Failed to load leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    const sub = db.subscribe('leaveRequests', loadLeaveRequests, loadLeaveRequests, loadLeaveRequests);
    return () => { sub.unsubscribe(); };
  }, [role, child?.id]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) {
      showToast?.("No Child Found", "error", "You must have a child linked to your account.");
      return;
    }
    setIsSubmitting(true);

    const newRequest: LeaveRequest = {
      id: `LR-${Date.now()}`,
      studentId: child.id,
      studentName: child.name,
      parentId: child.parentId,
      startDate: startDate,
      endDate: endDate,
      reason: reason,
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0]
    };

    try {
      await db.create('leaveRequests', newRequest);
      setShowModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      showToast?.("Request Sent", "success", "Your leave application is pending approval.");
    } catch (err) {
      showToast?.("Request Failed", "error", "Cloud vault connection interrupted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await db.update('leaveRequests', id, { status });
      showToast?.(`Application ${status}`, "info", `Leave record updated in the system.`);
    } catch (e) {
      showToast?.("Action Failed", "error", "Could not sync with database.");
    }
  };

  const filteredRequests = activeTab === 'pending' ? requests.filter(r => r.status === 'Pending') : requests;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-500" /> Leave Management
          </h2>
          <p className="text-slate-500">{isParent ? "Apply for student leave." : "Manage applications."}</p>
        </div>
        {isParent && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Apply for Leave</button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p className="font-black uppercase tracking-widest text-xs">Syncing...</p></div>
      ) : isParent ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p><h3 className="text-3xl font-black text-slate-800">{requests.length}</h3></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p><h3 className="text-3xl font-black text-yellow-500">{requests.filter(r => r.status === 'Pending').length}</h3></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approved</p><h3 className="text-3xl font-black text-green-500">{requests.filter(r => r.status === 'Approved').length}</h3></div>
           </div>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">Leave History</div>
              <div className="divide-y divide-slate-100">
                 {requests.map((req) => (
                    <div key={req.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                       <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-lg ${req.status === 'Approved' ? 'bg-green-100 text-green-600' : req.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                             {req.status === 'Approved' ? <Check className="w-5 h-5" /> : req.status === 'Rejected' ? <X className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span><span className="text-xs text-slate-400">{req.requestDate}</span></div><h4 className="font-bold text-slate-800">{req.startDate} to {req.endDate}</h4><p className="text-sm text-slate-600 mt-1">{req.reason}</p></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100%-80px)] overflow-hidden">
           <div className="border-b border-slate-200 flex">
              <button onClick={() => setActiveTab('pending')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Pending {requests.filter(r => r.status === 'Pending').length > 0 && <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{requests.filter(r => r.status === 'Pending').length}</span>}</button>
              <button onClick={() => setActiveTab('all')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>All History</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 {filteredRequests.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 font-medium">No {activeTab} requests found.</div>
                 ) : (
                    filteredRequests.map((req) => (
                       <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{req.studentName.charAt(0)}</div><div><h4 className="font-bold text-slate-800 text-sm">{req.studentName}</h4><p className="text-[10px] text-slate-400 font-mono">{req.studentId}</p></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span></div>
                          <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2"><Calendar className="w-4 h-4 text-slate-400" />{req.startDate} to {req.endDate}</div><p className="text-xs text-slate-600 italic">"{req.reason}"</p></div>
                          {req.status === 'Pending' && role === UserRole.ADMIN && (
                             <div className="flex gap-2"><button onClick={() => handleAction(req.id, 'Approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold transition-all">Approve</button><button onClick={() => handleAction(req.id, 'Rejected')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition-all">Reject</button></div>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
               <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">Apply for Leave</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
               <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label><input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason</label><textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave..." className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white h-24 resize-none"></textarea></div>
                  <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 text-xs text-yellow-800 border border-yellow-100"><AlertCircle className="w-4 h-4 shrink-0" /><p>Submit at least 24h in advance.</p></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Submit</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
