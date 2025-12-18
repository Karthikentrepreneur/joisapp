import React, { useState } from 'react';
import { mockCertificates, getMyChild } from '../data/mockData';
import { UserRole, Certificate } from '../types';
import { FileText, Download, Printer, Plus, Check, X, Clock, FileCheck, Send, ShieldCheck, ChevronRight } from 'lucide-react';

interface DocumentsProps {
  role: UserRole;
}

export const Documents: React.FC<DocumentsProps> = ({ role }) => {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<Certificate['type']>('Bonafide');
  const [requestReason, setRequestReason] = useState('');

  const isParent = role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER;
  const isAdmin = role === UserRole.ADMIN;
  const child = isParent ? getMyChild() : null;

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

    const newDoc: Certificate = {
      id: `DOC-${Date.now()}`,
      type: requestType,
      studentName: child.name,
      studentId: child.id,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Requested',
      reason: requestReason
    };

    setCertificates([newDoc, ...certificates]);
    setShowRequestModal(false);
    setRequestReason('');
  };

  const handleAction = (id: string, newStatus: Certificate['status']) => {
    setCertificates(prev => prev.map(cert => {
      if (cert.id === id) {
        return {
          ...cert,
          status: newStatus,
          issueDate: newStatus === 'Released' ? new Date().toISOString().split('T')[0] : cert.issueDate
        };
      }
      return cert;
    }));
  };

  const filteredCerts = isParent && child 
    ? certificates.filter(c => c.studentId === child.id)
    : certificates;

  // Group by status for workflow view
  const requestedCerts = filteredCerts.filter(c => c.status === 'Requested');
  const teacherApprovedCerts = filteredCerts.filter(c => c.status === 'Teacher Approved');
  const releasedCerts = filteredCerts.filter(c => c.status === 'Released');

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto flex flex-col animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Documents & Certifications</h2>
          <p className="text-slate-500 font-medium">
            {isParent ? `Official records and requests for ${child?.name}` : "Manage school-wide document requests and verification."}
          </p>
        </div>
        {isParent && (
          <button 
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Request Document
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Workflow Summary / Sidebar */}
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Tracking Status</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Pending Approval', count: requestedCerts.length, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Teacher Approved', count: teacherApprovedCerts.length, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Successfully Released', count: releasedCerts.length, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                  ].map((stat, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${stat.bg} border border-transparent`}>
                       <span className={`text-xs font-black uppercase tracking-wider ${stat.color}`}>{stat.label}</span>
                       <span className={`text-xl font-black ${stat.color}`}>{stat.count}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-24 h-24" />
               </div>
               <h4 className="text-xl font-black mb-2">Digital Integrity</h4>
               <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  All documents issued by Junior Odyssey are digitally signed and verifiable via the secure QR code provided on the released PDF.
               </p>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="xl:col-span-3 space-y-8">
            {/* Actionable Tasks (Conditional) */}
            {(isTeacher || isAdmin) && (
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                     <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
                        <Clock className="w-6 h-6 text-amber-500" />
                        Needs Your Attention
                     </h3>
                     <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {isTeacher ? requestedCerts.length : teacherApprovedCerts.length} Pending
                     </span>
                  </div>
                  <div className="divide-y divide-slate-50">
                     {(isTeacher ? requestedCerts : teacherApprovedCerts).length === 0 ? (
                        <div className="p-12 text-center text-slate-300">
                           <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                           <p className="font-bold">Queue is clear! No documents pending action.</p>
                        </div>
                     ) : (
                        (isTeacher ? requestedCerts : teacherApprovedCerts).map((cert) => (
                           <div key={cert.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-start gap-4">
                                 <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 shadow-inner">
                                    {cert.studentName.charAt(0)}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="text-sm font-black text-slate-900">{cert.studentName}</span>
                                       <span className="text-[10px] text-slate-400 font-bold tracking-widest">{cert.studentId}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-blue-600 mb-1">{cert.type} Request</h4>
                                    <p className="text-xs text-slate-500 font-medium italic">"{cert.reason || 'No reason provided'}"</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Requested: {cert.requestDate}</p>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 {isTeacher && cert.status === 'Requested' && (
                                    <button 
                                       onClick={() => handleAction(cert.id, 'Teacher Approved')}
                                       className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:bg-blue-700 active:scale-95"
                                    >
                                       <Check className="w-4 h-4" /> Approve
                                    </button>
                                 )}
                                 {isAdmin && cert.status === 'Teacher Approved' && (
                                    <button 
                                       onClick={() => handleAction(cert.id, 'Released')}
                                       className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all hover:bg-emerald-600 active:scale-95"
                                    >
                                       <Send className="w-4 h-4" /> Release PDF
                                    </button>
                                 )}
                                 <button 
                                    onClick={() => handleAction(cert.id, 'Rejected')}
                                    className="bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                 >
                                    Reject
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            )}

            {/* Issued History Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50">
                  <h3 className="font-black text-slate-900 text-xl">Document History</h3>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Released & Archive</p>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                           <th className="px-8 py-4">Document ID</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4">Recipient</th>
                           <th className="px-8 py-4">Issued On</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {/* FIX: Use filteredCerts instead of non-existent filteredRequests */}
                        {filteredCerts.map((cert) => (
                           <tr key={cert.id} className="group hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                       <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-800">{cert.type}</p>
                                       <p className="text-[10px] font-mono text-slate-400">{cert.id}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    cert.status === 'Released' ? 'bg-emerald-50 text-emerald-600' :
                                    cert.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                                    'bg-amber-50 text-amber-600'
                                 }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                       cert.status === 'Released' ? 'bg-emerald-500' :
                                       cert.status === 'Rejected' ? 'bg-rose-500' :
                                       'bg-amber-500'
                                    }`}></span>
                                    {cert.status}
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-bold text-slate-700">{cert.studentName}</p>
                                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{cert.studentId}</p>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-bold text-slate-600">{cert.issueDate || '—'}</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex justify-end gap-2">
                                    {cert.status === 'Released' ? (
                                       <>
                                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
                                          <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"><Printer className="w-5 h-5" /></button>
                                       </>
                                    ) : (
                                       <button className="text-xs font-black text-slate-300 uppercase tracking-widest px-3 py-1 cursor-not-allowed">Locked</button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {/* FIX: Use filteredCerts instead of non-existent filteredRequests */}
                  {filteredCerts.length === 0 && (
                     <div className="p-20 text-center text-slate-300 font-bold italic">Archive empty.</div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Parent Request Modal */}
      {showRequestModal && isParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black text-slate-900">Document Request</h3>
                 <button onClick={() => setShowRequestModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleRequest} className="space-y-6">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Certificate Type</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['Bonafide', 'Transfer', 'Character', 'Fee Receipt'].map((type) => (
                          <button
                             key={type}
                             type="button"
                             onClick={() => setRequestType(type as any)}
                             className={`px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2 ${
                                requestType === type 
                                   ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                   : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                             }`}
                          >
                             {type}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose of Request</label>
                    <textarea 
                      required 
                      value={requestReason} 
                      onChange={e => setRequestReason(e.target.value)}
                      placeholder="Why do you need this document? (e.g., Passport application, Bank use)"
                      className="w-full px-6 py-5 border-2 border-slate-100 rounded-[1.5rem] text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 h-32 resize-none transition-all placeholder:text-slate-300"
                    />
                 </div>

                 <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex gap-4">
                    <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm shrink-0">
                       <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                       Standard processing time is 2-3 working days after Teacher Approval. 
                       Admins will release the digital copy once finalized.
                    </p>
                 </div>

                 <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-all active:scale-95"
                 >
                    Send Request <ChevronRight className="w-5 h-5" />
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};