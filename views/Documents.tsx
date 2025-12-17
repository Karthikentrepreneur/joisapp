import React from 'react';
import { mockCertificates } from '../data/mockData';
import { FileText, Download, Printer, Plus } from 'lucide-react';

export const Documents: React.FC = () => {
  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Documents & Certificates</h2>
          <p className="text-slate-500">Generate and manage official school documentation.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors w-full md:w-auto justify-center">
          <Plus className="w-4 h-4" /> Generate New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Templates */}
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4">Available Templates</h3>
            <div className="space-y-3">
               {['Bonafide Certificate', 'Transfer Certificate (TC)', 'Character Certificate', 'Fee Payment Receipt'].map((template, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-blue-200 cursor-pointer transition-all group">
                     <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{template}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Issued History */}
         <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4">Recently Issued Documents</h3>
            <div className="overflow-x-auto">
               <div className="min-w-[600px]">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                           <th className="px-4 py-3 rounded-l-lg">Document ID</th>
                           <th className="px-4 py-3">Type</th>
                           <th className="px-4 py-3">Student</th>
                           <th className="px-4 py-3">Date</th>
                           <th className="px-4 py-3">Status</th>
                           <th className="px-4 py-3 rounded-r-lg">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {mockCertificates.map((cert) => (
                           <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-4 text-sm font-mono text-slate-600">{cert.id}</td>
                              <td className="px-4 py-4 font-semibold text-slate-800">{cert.type}</td>
                              <td className="px-4 py-4 text-sm text-slate-600">{cert.studentName}</td>
                              <td className="px-4 py-4 text-sm text-slate-500">{cert.issueDate}</td>
                              <td className="px-4 py-4">
                                 <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                    {cert.status}
                                 </span>
                              </td>
                              <td className="px-4 py-4 flex gap-2">
                                 <button className="text-slate-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                                 <button className="text-slate-400 hover:text-slate-600"><Printer className="w-4 h-4" /></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               {mockCertificates.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">No documents found.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};