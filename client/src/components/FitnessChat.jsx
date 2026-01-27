import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, Loader, Dumbbell } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const FitnessChat = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Coach. I know your stats. Ask me for a diet plan or workout routine!" }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false); 
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (authLoading || !user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const historyContext = messages.slice(-6); 
      const res = await api.post('/chat', { 
        message: userMsg.content,
        history: historyContext
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the server." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up h-[500px]">
          
          <div className="bg-emerald-900/30 p-4 border-b border-emerald-500/20 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Pantry Coach</h3>
                <span className="text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
                  }`}
                >
                  {}
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        
                        strong: ({node, ...props}) => <span className="font-bold text-emerald-400" {...props} />,
                        
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mt-2 space-y-1" {...props} />,
                        
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700">
                  <Loader className="w-4 h-4 text-emerald-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-gray-900 border-t border-emerald-500/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diet or exercise..."
              className="flex-1 bg-black/50 border border-gray-700 text-white text-sm rounded-xl px-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={isSending || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isOpen ? 'bg-gray-800 text-gray-400 rotate-90' : 'bg-emerald-600 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default FitnessChat;