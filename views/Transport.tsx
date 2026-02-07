import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Phone, Navigation, AlertTriangle, Send, Loader2, X } from 'lucide-react';
import { schoolService } from '../services/schoolService';
import { UserRole } from '../types';
import { ToastType } from '../components/Toast';

interface TransportProps {
  showToast?: (title: string, type: ToastType, description?: string) => void;
}

export const Transport: React.FC<TransportProps> = ({ showToast }) => {
  const [buses, setBuses] = useState([
    { id: 'BUS-01', route: 'North Road', driver: 'Mike T.', status: 'Moving', speed: 45, nextStop: 'Maple St', progress: 30 },
    { id: 'BUS-02', route: 'South Road', driver: 'Sarah J.', status: 'Stopped', speed: 0, nextStop: 'Oak Ave', progress: 65 },
    { id: 'BUS-03', route: 'East Road', driver: 'John D.', status: 'Traffic', speed: 12, nextStop: 'Pine Ln', progress: 85 },
  ]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedBusForAlert, setSelectedBusForAlert] = useState<string | null>(null);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

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

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const reason = formData.get('reason') as string;
    
    setIsSendingAlert(true);
    try {
       await schoolService.sendBroadcast(
         'TRN-001',
         'Bus Hub',
         UserRole.TRANSPORT,
         `BUS NEWS [${selectedBusForAlert}]: Bus will be 15-20 mins late because of ${reason}. Please wait at the stop.`,
         'High'
       );
       setShowAlertModal(false);
       
       if (showToast) {
         showToast("Message Sent", "success", "Parents on this road have been told about the delay.");
       }
    } catch (e) {
       if (showToast) {
         showToast("Failed to send", "error", "System could not send the message.");
       }
    } finally {
       setIsSendingAlert(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8 animate-in fade-in duration-500 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bus Tracking</h2>
          <p className="text-slate-500 font-medium mt-1">See where the buses are in real-time.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none bg-white border-2 border-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-slate-300 transition-all">Road List</button>
           <button onClick={() => setShowAlertModal(true)} className="flex-1 md:flex-none bg-rose-500 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-100 flex items-center gap-2 justify-center transition-all active:scale-95">
              <AlertTriangle className="w-4 h-4" /> Send News
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        <div className="w-full lg:w-96 space-y-4 lg:overflow-y-auto h-fit lg:max-h-full">
          {buses.map((bus) => (
            <div key={bus.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform ${bus.status === 'Moving' ? 'bg-emerald-50 text-emerald-600' : bus.status === 'Traffic' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{bus.id}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{bus.route}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${bus.status === 'Moving' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : bus.status === 'Traffic' ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                  {bus.status}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-tight">Next Stop: <strong className="text-slate-700">{bus.nextStop}</strong></span>
                  <span className="text-blue-600">{Math.floor(bus.speed)} km/h</span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2 shadow-inner border border-slate-100">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 relative" style={{ width: `${bus.progress}%` }}>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md scale-125"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 text-[10px] border border-slate-200">
                       {bus.driver.charAt(0)}
                     </div>
                     <span className="text-xs font-bold text-slate-600">{bus.driver}</span>
                   </div>
                   <button className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm">
                     <Phone className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-slate-100 rounded-[3rem] border-4 border-white shadow-2xl relative overflow-hidden group min-h-[400px]">
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>
           
           <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <path d="M 100 100 Q 300 250 500 100 T 900 400" stroke="#fff" strokeWidth="40" fill="none" className="opacity-50" />
             <path d="M 200 600 Q 400 400 600 500 T 900 300" stroke="#fff" strokeWidth="40" fill="none" className="opacity-50" />
             <path d="M 100 100 Q 300 250 500 100 T 900 400" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 10" fill="none" />
           </svg>

           {buses.map((bus, idx) => (
             <div 
               key={bus.id}
               className="absolute transition-all duration-1000 ease-linear flex flex-col items-center group/bus"
               style={{ 
                 top: `${20 + idx * 22 + (Math.sin(bus.progress / 10) * 15)}%`, 
                 left: `${bus.progress}%` 
               }}
             >
                <div className="relative group-hover/bus:scale-125 transition-transform">
                  <div className={`w-10 h-10 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white z-10 relative ${bus.status === 'Moving' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                    <Bus className={`w-5 h-5 ${bus.status === 'Moving' ? 'text-white' : 'text-slate-900'}`} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 rounded-full blur-[4px]"></div>
                </div>
                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest mt-2 whitespace-nowrap text-slate-700">
                  {bus.id} • {Math.floor(bus.speed)} KMH
                </div>
             </div>
           ))}

           <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/50 max-w-xs animate-in slide-in-from-right duration-700">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Navigation className="w-5 h-5" />
               </div>
               <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Roads</span>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Traffic</span>
                   <span className="text-rose-500 font-black">BAD (Road 02)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-rose-500 w-4/5"></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Lots of traffic on the main road. Drivers told to use the other way.</p>
             </div>
           </div>
        </div>
      </div>

      {/* ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black text-slate-900">Send Bus News</h3>
                 <button onClick={() => setShowAlertModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <form onSubmit={handleSendAlert} className="space-y-6">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Bus</label>
                    <div className="grid grid-cols-3 gap-3">
                       {buses.map(b => (
                          <button 
                             key={b.id} 
                             type="button"
                             onClick={() => setSelectedBusForAlert(b.id)}
                             className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                selectedBusForAlert === b.id 
                                   ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                   : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                             }`}
                          >
                             {b.id}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Why is it late?</label>
                    <select name="reason" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none">
                       <option value="Traffic">Traffic</option>
                       <option value="Breakdown">Broken Bus</option>
                       <option value="Weather">Bad Weather</option>
                       <option value="Event">Road Event</option>
                    </select>
                 </div>
                 <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-700 font-bold leading-relaxed uppercase tracking-widest">
                       This message will be sent to all parents on this bus road right away.
                    </p>
                 </div>
                 <button 
                   type="submit" 
                   disabled={!selectedBusForAlert || isSendingAlert}
                   className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isSendingAlert ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Send to Everyone</>}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};