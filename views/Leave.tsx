import React, { useState } from 'react';
import { UserRole, LeaveRequest } from '../types';
import { mockLeaveRequests, getMyChild } from '../data/mockData';
import { CalendarDays, Plus, Check, X, Clock, Calendar, AlertCircle } from 'lucide-react';

interface LeaveProps {
  role?: UserRole;
}

export const Leave: React.FC<LeaveProps> = ({ role }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Parent Logic
  const child = role === UserRole.PARENT ? getMyChild() : null;
  const myRequests = role === UserRole.PARENT && child 
    ? requests.filter(r => r.parentId === child.parentId)
    : [];

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

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

    setRequests([newRequest, ...requests]);
    setShowModal(false);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  // Admin Logic
  const handleAction = (id: string, status: 'Approved' | 'Rejected') => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const filteredRequests = activeTab === 'pending' ? pendingRequests : requests;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-500" /> Leave Management
          </h2>
          <p className="text-slate-500">
            {role === UserRole.PARENT 
              ? "Apply for student leave and view history." 
              : "Review and manage student leave applications."}
          </p>
        </div>
        {role === UserRole.PARENT && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 w-full md:w-auto justify-center transition-all"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        )}
      </div>

      {role === UserRole.PARENT ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Leaves</p>
                 <h3 className="text-3xl font-black text-slate-800">{myRequests.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
                 <h3 className="text-3xl font-black text-yellow-500">{myRequests.filter(r => r.status === 'Pending').length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approved</p>
                 <h3 className="text-3xl font-black text-green-500">{myRequests.filter(r => r.status === 'Approved').length}</h3>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                 Leave History
              </div>
              {myRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No leave requests found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                   {myRequests.map((req) => (
                      <div key={req.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                         <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg ${
                               req.status === 'Approved' ? 'bg-green-100 text-green-600' :
                               req.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                               'bg-yellow-100 text-yellow-600'
                            }`}>
                               {req.status === 'Approved' ? <Check className="w-5 h-5" /> : 
                                req.status === 'Rejected' ? <X className="w-5 h-5" /> : 
                                <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                     req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                     req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                     'bg-yellow-100 text-yellow-700'
                                  }`}>
                                     {req.status}
                                  </span>
                                  <span className="text-xs text-slate-400">Req: {req.requestDate}</span>
                               </div>
                               <h4 className="font-bold text-slate-800 text-sm md:text-base">
                                  {req.startDate} <span className="text-slate-400 mx-1">to</span> {req.endDate}
                               </h4>
                               <p className="text-sm text-slate-600 mt-1">{req.reason}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      ) : (
        // Admin View
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100%-80px)] overflow-hidden">
           <div className="border-b border-slate-200 flex">
              <button 
                 onClick={() => setActiveTab('pending')}
                 className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                 Pending Requests
                 {pendingRequests.length > 0 && (
                    <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                 )}
              </button>
              <button 
                 onClick={() => setActiveTab('all')}
                 className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                 All History
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 {filteredRequests.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-slate-300" />
                       </div>
                       <p className="text-slate-500 font-medium">No {activeTab} requests found.</p>
                    </div>
                 ) : (
                    filteredRequests.map((req) => (
                       <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                   {req.studentName.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-800 text-sm">{req.studentName}</h4>
                                   <p className="text-[10px] text-slate-400 font-mono">ID: {req.studentId}</p>
                                </div>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                                req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                             }`}>
                                {req.status}
                             </span>
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                             <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {req.startDate} <span className="text-slate-400 mx-1">to</span> {req.endDate}
                             </div>
                             <p className="text-xs text-slate-600 italic leading-relaxed">"{req.reason}"</p>
                          </div>

                          {req.status === 'Pending' && role === UserRole.ADMIN && (
                             <div className="flex gap-2">
                                <button 
                                   onClick={() => handleAction(req.id, 'Approved')}
                                   className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                                >
                                   <Check className="w-3 h-3" /> Approve
                                </button>
                                <button 
                                   onClick={() => handleAction(req.id, 'Rejected')}
                                   className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                                >
                                   <X className="w-3 h-3" /> Reject
                                </button>
                             </div>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Apply for Student Leave</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                     <X className="w-6 h-6" />
                  </button>
               </div>
               <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                     <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                     <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Leave</label>
                     <textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="Please detail the reason for your child's leave..." className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 text-xs text-yellow-800 border border-yellow-100">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     <p>Requests must be submitted at least 24 hours in advance unless it is a medical emergency.</p>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all mt-2 shadow-lg">Submit Request</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};