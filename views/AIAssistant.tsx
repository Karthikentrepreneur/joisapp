import React, { useState, useRef, useEffect } from 'react';
import { generateSchoolInsight } from '../services/geminiService';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init-1', role: 'model', text: 'Hello! I am EduNexus AI. How can I help you today? I can generate lesson plans, summarize student performance, or draft notices.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Context Data Simulation
    const contextData = `
      Current User: Admin/Teacher.
      School Stats: Attendance 96%, Fees collected 85%.
      Recent Events: Science Fair on Friday, Bus 01 delayed today.
    `;

    const responseText = await generateSchoolInsight(input, contextData);

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] p-6 flex flex-col md:flex-row gap-6 animate-in slide-in-from-right duration-300">
       <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-2xl font-bold mb-2">AI Capabilities</h2>
             <p className="text-indigo-100 text-sm mb-6">
               Leverage the power of Gemini to automate administrative tasks and gain educational insights.
             </p>
             <div className="space-y-2">
                <button onClick={() => setInput("Draft a notice for parents about the Annual Sports Day next week.")} className="w-full text-left bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-sm transition-colors border border-white/10">
                   📝 Draft Parent Notice
                </button>
                <button onClick={() => setInput("Create a lesson plan for Grade 5 History about Ancient Egypt.")} className="w-full text-left bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-sm transition-colors border border-white/10">
                   📚 Create Lesson Plan
                </button>
                <button onClick={() => setInput("Analyze the attendance trends for Grade 10 this month.")} className="w-full text-left bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-sm transition-colors border border-white/10">
                   📊 Analyze Trends
                </button>
             </div>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                 <Bot className="w-5 h-5 text-indigo-600" />
               </div>
               <div>
                  <h3 className="font-semibold text-slate-800">EduNexus Assistant</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                  </p>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                 </div>
                 <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                   msg.role === 'user' 
                     ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                     : 'bg-slate-100 text-slate-800 rounded-tl-none'
                 }`}>
                   {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>)}
                 </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
              </div>
            )}
         </div>

         <div className="p-4 bg-white border-t border-slate-100">
           <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
             <input 
               type="text" 
               className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400"
               placeholder="Type your request here..."
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button 
               onClick={handleSend}
               disabled={loading || !input.trim()}
               className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
             >
               <Send className="w-4 h-4" />
             </button>
           </div>
           <p className="text-[10px] text-center text-slate-400 mt-2">
             AI responses can be inaccurate. Verify important information.
           </p>
         </div>
       </div>
    </div>
  );
};