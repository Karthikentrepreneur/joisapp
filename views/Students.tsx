import React, { useState } from 'react';
import { mockStudents } from '../data/mockData';
import { Search, Filter, Plus, MoreHorizontal, Phone, Mail, MapPin, Bus } from 'lucide-react';

export const Students: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500">Manage student profiles, academic records, and contacts.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none w-full md:w-auto"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="All">All Grades</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <div className="p-6 flex flex-col items-center border-b border-slate-50">
              <div className="relative mb-4">
                <img src={student.image} alt={student.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50" />
                <div className={`absolute bottom-0 right-0 w-5 h-5 border-2 border-white rounded-full ${student.attendance > 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{student.name}</h3>
              <p className="text-xs text-slate-500 mb-1">{student.id}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Grade {student.grade}-{student.section}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${student.feesStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {student.feesStatus === 'Paid' ? 'Fees Paid' : 'Fees Due'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Parent Contact</p>
                  <p className="font-medium">{student.parentPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <Bus className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Transport</p>
                  <p className="font-medium">{student.busRoute}</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-center">
              <button className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors w-full py-1">
                View Full Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};