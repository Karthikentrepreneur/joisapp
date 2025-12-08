import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Phone, Navigation } from 'lucide-react';

export const Transport: React.FC = () => {
  const [buses, setBuses] = useState([
    { id: 'BUS-01', route: 'North Route', driver: 'Mike T.', status: 'Moving', speed: 45, nextStop: 'Maple St', progress: 30 },
    { id: 'BUS-02', route: 'South Route', driver: 'Sarah J.', status: 'Stopped', speed: 0, nextStop: 'Oak Ave', progress: 65 },
    { id: 'BUS-03', route: 'East Route', driver: 'John D.', status: 'Traffic', speed: 12, nextStop: 'Pine Ln', progress: 85 },
  ]);

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => ({
        ...bus,
        progress: bus.progress >= 100 ? 0 : bus.progress + (bus.speed > 0 ? 0.5 : 0),
        speed: bus.status === 'Traffic' ? Math.max(5, bus.speed + Math.random() * 5 - 2) : bus.speed
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col gap-6 animate-in fade-in zoom-in duration-300 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live Fleet Tracking</h2>
          <p className="text-slate-500">Real-time GPS monitoring of all school buses.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button className="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">View Routes</button>
           <button className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Emergency Alert</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Sidebar List */}
        <div className="w-full lg:w-1/3 space-y-4 lg:overflow-y-auto lg:h-full order-2 lg:order-1">
          {buses.map((bus) => (
            <div key={bus.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${bus.status === 'Moving' ? 'bg-green-100 text-green-600' : bus.status === 'Traffic' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{bus.id}</h4>
                    <p className="text-xs text-slate-500">{bus.route}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${bus.status === 'Moving' ? 'bg-green-100 text-green-700' : bus.status === 'Traffic' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                  {bus.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Next: <strong>{bus.nextStop}</strong></span>
                  <span>Speed: {Math.floor(bus.speed)} km/h</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${bus.progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                     <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                       {bus.driver.charAt(0)}
                     </div>
                     {bus.driver}
                   </div>
                   <button className="text-blue-600 hover:text-blue-800 p-1">
                     <Phone className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map Placeholder */}
        <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden group min-h-[300px] lg:h-full order-1 lg:order-2">
           {/* Decorative Map Background */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           {/* Simulated Roads */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <path d="M 100 100 Q 300 150 500 100 T 900 300" stroke="#cbd5e1" strokeWidth="20" fill="none" />
             <path d="M 200 600 Q 400 400 600 500 T 900 300" stroke="#cbd5e1" strokeWidth="20" fill="none" />
             <path d="M 100 100 Q 300 150 500 100 T 900 300" stroke="#fff" strokeWidth="12" fill="none" />
             <path d="M 200 600 Q 400 400 600 500 T 900 300" stroke="#fff" strokeWidth="12" fill="none" />
           </svg>

           {/* Moving Buses */}
           {buses.map((bus, idx) => (
             <div 
               key={bus.id}
               className="absolute transition-all duration-1000 ease-linear flex flex-col items-center"
               style={{ 
                 top: `${20 + idx * 20 + (Math.sin(bus.progress / 10) * 10)}%`, 
                 left: `${bus.progress}%` 
               }}
             >
                <div className="relative">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg shadow-lg flex items-center justify-center border-2 border-white z-10 relative">
                    <Bus className="w-4 h-4 text-slate-800" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full opacity-20 filter blur-[2px]"></div>
                </div>
                <div className="bg-white px-2 py-1 rounded shadow-sm text-[10px] font-bold mt-1 whitespace-nowrap">
                  {bus.id}
                </div>
             </div>
           ))}

           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200">
             <div className="flex items-center gap-2 mb-2">
               <Navigation className="w-4 h-4 text-blue-600" />
               <span className="text-xs font-bold text-slate-700">School Zone</span>
             </div>
             <div className="h-32 w-32 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                Mini Map
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};