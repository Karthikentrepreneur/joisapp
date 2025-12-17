import React, { useState } from 'react';
import { mockStaff } from '../data/mockData';
import { Search, Plus, Phone, Mail } from 'lucide-react';

export const Staff: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = mockStaff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
          <p className="text-slate-500">Directory of teachers, admins, and support staff.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors w-full md:w-auto justify-center">
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input 
            type="text" 
            placeholder="Search by name or role..." 
            className="flex-1 outline-none text-sm text-slate-700 min-w-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${staff.role === 'Teacher' ? 'bg-blue-500' : staff.role === 'Admin' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative mb-4 mt-2">
                <img src={staff.image} alt={staff.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
                <div className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${staff.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{staff.name}</h3>
              <p className="text-sm font-medium text-slate-500 mb-1">{staff.role}</p>
              {staff.classAssigned && (
                 <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-semibold mb-3">Class {staff.classAssigned}</span>
              )}
              
              <div className="w-full space-y-3 mt-2 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <Phone className="w-4 h-4" />
                    </div>
                    <span>{staff.phone}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                       <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">{staff.email}</span>
                 </div>
              </div>
            </div>
            <div className="bg-slate-50 p-3 flex justify-center border-t border-slate-100">
               <button className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};