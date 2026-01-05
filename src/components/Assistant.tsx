'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // <--- NEW IMPORT
import { chatWithAssistant } from '../services/geminiService';

const Assistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user', text: string }[]>([
    { role: 'assistant', text: "Tēnā koe. I'm the Inertia Vision assistant. How can I help you explore our social mission today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await chatWithAssistant(userMsg, []);
    setMessages(prev => [...prev, { role: 'assistant', text: response || "Something stopped our momentum. Please try again or reach out directly to Clark." }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-50">
      {isOpen && (
        <div className="mb-6 w-80 md:w-[450px] h-[600px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 font-sans">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="font-heading font-black text-sm tracking-tight text-white uppercase">Inertia AI</p>
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Impact Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Chat Area */}
          <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-hide bg-slate-900">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-accent text-slate-950 font-bold rounded-tr-none' 
                  : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {/* THIS IS THE MAGIC PART: Renders Markdown properly */}
                  {m.role === 'user' ? (
                     m.text
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                       <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-full rounded-tl-none flex gap-1.5 items-center border border-white/5">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-950 border-t border-white/5">
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about our mission..."
                className="flex-grow pl-6 pr-4 py-4 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="w-14 h-14 bg-accent text-slate-950 rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 md:w-20 md:h-20 bg-accent text-slate-950 rounded-[2rem] shadow-[0_0_40px_rgba(56,189,248,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group z-50 hover:shadow-[0_0_60px_rgba(56,189,248,0.6)]"
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default Assistant;
