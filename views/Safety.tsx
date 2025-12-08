import React, { useState } from 'react';
import { Camera, AlertCircle, Shield, LogIn, LogOut, ArrowUpDown } from 'lucide-react';

interface AccessLog {
  id: number;
  studentId: number;
  name: string;
  timestamp: Date;
  type: 'check-in' | 'check-out';
  location: string;
  avatarSeed: number;
}

export const Safety: React.FC = () => {
  const cams = [
    { id: 1, loc: 'Main Entrance', status: 'Live' },
    { id: 2, loc: 'Playground North', status: 'Live' },
    { id: 3, loc: 'Corridor A (Gr 1-4)', status: 'Live' },
    { id: 4, loc: 'Cafeteria', status: 'Live' },
    { id: 5, loc: 'Library', status: 'Live' },
    { id: 6, loc: 'Bus Bay', status: 'Live' },
  ];

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Initialize logs data
  const [logs] = useState<AccessLog[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const idx = i + 1;
      return {
        id: idx,
        studentId: 202400 + idx,
        name: `Student Name ${idx}`,
        timestamp: new Date(Date.now() - idx * 2 * 60000), // Decreasing timestamps (2 mins apart)
        type: idx % 2 === 0 ? 'check-in' : 'check-out',
        location: idx % 2 === 0 ? 'Main Gate' : 'Library Exit',
        avatarSeed: idx + 55
      };
    });
  });

  const sortedLogs = [...logs].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.timestamp.getTime() - b.timestamp.getTime() 
      : b.timestamp.getTime() - a.timestamp.getTime();
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-emerald-500" /> Campus Safety & Surveillance
          </h2>
          <p className="text-slate-500">Centralized monitoring system for enhanced student security.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-100 flex items-center gap-2 w-full md:w-auto">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          System Status: SECURE
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {/* CCTV Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cams.map((cam) => (
              <div key={cam.id} className="relative aspect-video bg-black rounded-xl overflow-hidden group shadow-md border border-slate-800">
                <img 
                  src={`https://picsum.photos/600/400?random=${cam.id + 10}`} 
                  alt={cam.loc} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Overlays */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-2">
                  <Camera className="w-3 h-3" /> {cam.loc}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/90 px-2 py-1 rounded text-[10px] font-bold text-white tracking-wider animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div> REC
                </div>
                
                <div className="absolute bottom-3 left-3 text-[10px] text-white/70 font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Panel */}
        <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm h-64 lg:h-auto">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" /> Access Logs
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={toggleSort}
                className="text-xs flex items-center gap-1 text-slate-500 font-medium hover:text-blue-600 transition-colors bg-white border border-slate-200 px-2 py-1 rounded"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {sortedLogs.map((log) => {
              const isCheckIn = log.type === 'check-in';
              const timeString = log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={`https://picsum.photos/seed/${log.avatarSeed}/100/100`} 
                      className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-200 shadow-sm" 
                      alt="Student" 
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${isCheckIn ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 truncate mb-0.5">{log.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                         {isCheckIn ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              IN
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              OUT
                            </span>
                          )}
                         <span className="truncate max-w-[100px]">{log.location}</span>
                    </div>
                  </div>

                  {/* ID Column */}
                  <div className="text-right min-w-[70px]">
                     <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mb-1 inline-block">
                        ID: {log.studentId}
                     </div>
                     <div className="text-[10px] text-slate-400 font-medium">
                        {timeString}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};