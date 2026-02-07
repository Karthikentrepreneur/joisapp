import React, { useState, useMemo } from 'react';
import { Camera, Shield, LayoutGrid, Square, Grid3X3, Settings, ShieldAlert, X, Search, Activity, List, Monitor } from 'lucide-react';
import { CctvPlayer } from '../components/CctvPlayer';
import { Camera as CameraType } from '../types';

export const Safety: React.FC = () => {
  const [gridSize, setGridSize] = useState<1 | 4 | 9>(4);
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [fullScreenCam, setFullScreenCam] = useState<CameraType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cameras: CameraType[] = [
    { id: 'CAM-01', name: 'Main Entrance', location: 'Gate A', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Gate' },
    { id: 'CAM-02', name: 'Playground North', location: 'Little Seeds Area', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Outdoor' },
    { id: 'CAM-03', name: 'Preschool Yard', location: 'Curiosity Cubs', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Outdoor' },
    { id: 'CAM-04', name: 'Admin Block', location: 'Reception', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Indoor' },
    { id: 'CAM-05', name: 'Dining Hall', location: 'Canteen', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Indoor' },
    { id: 'CAM-06', name: 'Library', location: '2nd Floor', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Indoor' },
    { id: 'CAM-07', name: 'Bus Parking', location: 'East Gate', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Outdoor' },
    { id: 'CAM-08', name: 'Back Perimeter', location: 'Fence North', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Outdoor' },
    { id: 'CAM-09', name: 'Staff Room', location: 'Academic Wing', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'Online', type: 'Indoor' },
  ];

  const filteredCameras = useMemo(() => 
    cameras.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const displayedCameras = useMemo(() => {
    if (selectedCamId) {
      return cameras.filter(c => c.id === selectedCamId);
    }
    return filteredCameras.slice(0, gridSize);
  }, [selectedCamId, filteredCameras, gridSize]);

  const gridClasses = {
    1: 'grid-cols-1',
    4: 'grid-cols-1 sm:grid-cols-2',
    9: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* Surveillance Sidebar */}
      <aside className="hidden xl:flex flex-col w-72 bg-white border-r border-slate-200 shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Device Manager</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search cameras..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filteredCameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => { setSelectedCamId(cam.id); setGridSize(1); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border group ${selectedCamId === cam.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedCamId === cam.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                <Camera className={`w-4 h-4 ${selectedCamId === cam.id ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-black truncate leading-none mb-1">{cam.name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${selectedCamId === cam.id ? 'text-white/60' : 'text-slate-400'}`}>{cam.location}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
           <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Master Link: Active</span>
           </div>
        </div>
      </aside>

      {/* Main Monitoring Deck */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" /> Security Console
            </h2>
            <p className="text-slate-500 font-medium text-sm">Monitoring Junior Odyssey campus safety zones in real-time.</p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
             <button 
               onClick={() => { setSelectedCamId(null); setGridSize(1); }}
               className={`p-2.5 rounded-xl transition-all ${gridSize === 1 && !selectedCamId ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
               title="Focus View"
             >
               <Monitor className="w-5 h-5" />
             </button>
             <button 
               onClick={() => { setSelectedCamId(null); setGridSize(4); }}
               className={`p-2.5 rounded-xl transition-all ${gridSize === 4 && !selectedCamId ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
               title="Quad Layout"
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
               onClick={() => { setSelectedCamId(null); setGridSize(9); }}
               className={`p-2.5 rounded-xl transition-all ${gridSize === 9 && !selectedCamId ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
               title="9-Grid Layout"
             >
               <Grid3X3 className="w-5 h-5" />
             </button>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
               <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Dynamic Grid Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className={`grid ${gridClasses[gridSize]} gap-4 h-full auto-rows-fr overflow-y-auto no-scrollbar pb-8`}>
            {displayedCameras.map((cam) => (
              <div key={cam.id} className="relative aspect-video xl:aspect-auto">
                <CctvPlayer 
                  url={cam.streamUrl} 
                  name={cam.name} 
                  location={cam.location} 
                  onFullScreen={() => setFullScreenCam(cam)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Screen Monitor Modal */}
      {fullScreenCam && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-4 animate-in fade-in zoom-in duration-300">
           <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Monitor className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white leading-none">{fullScreenCam.name}</h3>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">{fullScreenCam.location}</p>
                 </div>
              </div>
              <button 
                onClick={() => setFullScreenCam(null)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
           <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <CctvPlayer 
                url={fullScreenCam.streamUrl} 
                name={fullScreenCam.name} 
                location={fullScreenCam.location} 
                isMuted={false}
              />
           </div>
           <div className="mt-4 flex justify-between items-center px-4">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Signal: Excellent</span>
                 </div>
                 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">HLS v3 • 1080p • 30fps</span>
              </div>
              <div className="flex gap-4">
                 <button className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" /> Flag Event
                 </button>
                 <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95">
                    Capture Still
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};