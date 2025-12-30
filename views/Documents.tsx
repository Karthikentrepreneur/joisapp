import React, { useState, useEffect } from 'react';
import { db } from '../services/persistence';
import { schoolService } from '../services/schoolService';
import { UserRole, Certificate } from '../types';
import { FileText, Download, Printer, Plus, Check, X, Clock, FileCheck, Send, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { getMyChild } from '../data/mockData';

interface DocumentsProps {
  role: UserRole;
}

export const Documents: React.FC<DocumentsProps> = ({ role }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<Certificate['type']>('Bonafide');
  const [requestReason, setRequestReason] = useState('');

  const isParent = role === UserRole.PARENT;
  const isTeacher = role === UserRole.TEACHER;
  const isAdmin = role === UserRole.ADMIN;
  const child = isParent ? getMyChild() : null;

  const loadData = async () => {
    setLoading(true);
    const data = await db.getAll('certificates');
    if (isParent && child) {
      setCertificates(data.filter(c => c.studentId === child.id));
    } else {
      setCertificates(data);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [role]);

  const handleRequest = async (e: React.FormEvent) => {
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
    await db.create('certificates', newDoc);
    await loadData();
    setShowRequestModal(false);
    setRequestReason('');
    alert("Document request sent successfully.");
  };

  const handleAction = async (id: string, newStatus: Certificate['status']) => {
    try {
      await schoolService.updateDocumentStatus(id, newStatus);
      await loadData();
      alert(`Document ${newStatus.toLowerCase()} successfully.`);
    } catch (e) {
      alert("Action failed.");
    }
  };

  const requestedCerts = certificates.filter(c => c.status === 'Requested');
  const teacherApprovedCerts = certificates.filter(c => c.status === 'Teacher Approved');
  const releasedCerts = certificates.filter(c => c.status === 'Released');

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto flex flex-col animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Documents & Vault</h2>
          <p className="text-slate-500 font-medium">{isParent ? `Official records for ${child?.name}` : "Manage school-wide document requests and verification."}</p>
        </div>
        {isParent && (
          <button onClick={() => setShowRequestModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-3 transition-all"><Plus className="w-5 h-5" /> Request Document</button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Tracking Status</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Pending', count: requestedCerts.length, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Verified', count: teacherApprovedCerts.length, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Released', count: releasedCerts.length, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                  ].map((stat, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${stat.bg} border border-transparent`}><span className={`text-xs font-black uppercase tracking-wider ${stat.color}`}>{stat.label}</span><span className={`text-xl font-black ${stat.color}`}>{stat.count}</span></div>
                  ))}
               </div>
            </div>
         </div>

         <div className="xl:col-span-3 space-y-8">
            {(isTeacher || isAdmin) && (
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                     <h3 className="font-black text-slate-900 text-xl flex items-center gap-3"><Clock className="w-6 h-6 text-amber-500" /> Action Required</h3>
                     <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full uppercase tracking-widest">{(isTeacher ? requestedCerts : teacherApprovedCerts).length} Items</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                     {loading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div> : (isTeacher ? requestedCerts : teacherApprovedCerts).length === 0 ? (
                        <div className="p-12 text-center text-slate-300"><FileCheck className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-bold">Queue is clear!</p></div>
                     ) : (
                        (isTeacher ? requestedCerts : teacherApprovedCerts).map((cert) => (
                           <div key={cert.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-start gap-4">
                                 <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200">{cert.studentName.charAt(0)}</div>
                                 <div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-black text-slate-900">{cert.studentName}</span></div><h4 className="text-lg font-black text-blue-600">{cert.type}</h4><p className="text-xs text-slate-500 italic">"{cert.reason}"</p></div>
                              </div>
                              <div className="flex gap-3">
                                 {isTeacher && <button onClick={() => handleAction(cert.id, 'Teacher Approved')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95">Approve</button>}
                                 {isAdmin && <button onClick={() => handleAction(cert.id, 'Released')} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95">Release PDF</button>}
                                 <button onClick={() => handleAction(cert.id, 'Rejected')} className="bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Reject</button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50"><h3 className="font-black text-slate-900 text-xl">Archive History</h3></div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-4">Document</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Issued On</th><th className="px-8 py-4 text-right">Actions</th></tr></thead>
                     <tbody className="divide-y divide-slate-50">
                        {certificates.map((cert) => (
                           <tr key={cert.id} className="group hover:bg-slate-50/30 transition-colors">
                              <td className="px-8 py-6"><div className="flex items-center gap-3"><div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500"><FileText className="w-5 h-5" /></div><div><p className="text-sm font-black text-slate-800">{cert.type}</p><p className="text-[10px] font-mono text-slate-400">{cert.studentName}</p></div></div></td>
                              <td className="px-8 py-6"><div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cert.status === 'Released' ? 'bg-emerald-50 text-emerald-600' : cert.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{cert.status}</div></td>
                              <td className="px-8 py-6 text-sm font-bold text-slate-600">{cert.issueDate || cert.requestDate}</td>
                              <td className="px-8 py-6 text-right">{cert.status === 'Released' ? <div className="flex justify-end gap-2"><button className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Download className="w-5 h-5" /></button><button className="p-2 text-slate-400 hover:text-slate-800 rounded-xl transition-all"><Printer className="w-5 h-5" /></button></div> : <span className="text-[10px] font-black text-slate-300 uppercase">Processing</span>}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative">
              <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-slate-900">Request Document</h3><button onClick={() => setShowRequestModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center"><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleRequest} className="space-y-6">
                 <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label><div className="grid grid-cols-2 gap-3">{['Bonafide', 'Transfer', 'Character', 'Fee Receipt'].map((type) => (<button key={type} type="button" onClick={() => setRequestType(type as any)} className={`px-5 py-4 rounded-2xl text-xs font-black uppercase border-2 transition-all ${requestType === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>{type}</button>))}</div></div>
                 <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label><textarea required value={requestReason} onChange={e => setRequestReason(e.target.value)} className="w-full px-6 py-5 border-2 border-slate-100 rounded-[1.5rem] text-sm h-32 resize-none" placeholder="Purpose of the document..." /></div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all">Submit Request <ChevronRight className="w-5 h-5" /></button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
