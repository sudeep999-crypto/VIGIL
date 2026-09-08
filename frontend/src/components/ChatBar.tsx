import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, X, ChevronUp, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChat } from '../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const ChatBar: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setIsExpanded(true);

    try {
      const res = await sendChat(question);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text:
          err instanceof Error
            ? `Connection notice: ${err.message}. Please verify backend is running on port 8000.`
            : 'Unable to reach VIGIL chat service.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl flex flex-col">
        {/* Expanded Chat History Overlay (Liquid Glass) */}
        <AnimatePresence>
          {isExpanded && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="mb-2 p-4 rounded-[4px] border border-white/10 bg-neutral-900/70 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_24px_rgba(255,255,255,0.04)] flex flex-col max-h-80 sm:max-h-[32rem]"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2 text-[#e8e8e8] font-medium">
                  <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>VIGIL Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMessages([])}
                    className="text-[11px] text-[#888888] hover:text-[#e8e8e8] cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-[#888888] hover:text-[#e8e8e8] p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 text-xs leading-relaxed">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono text-[#888888] mb-1">
                      {msg.sender === 'user' ? 'Operator' : 'VIGIL Assistant'}
                    </span>
                    <div
                      className={`p-2.5 rounded-[3px] ${
                        msg.sender === 'user'
                          ? 'max-w-[85%] bg-[#181818] text-[#e8e8e8] border border-white/10 whitespace-pre-wrap'
                          : 'max-w-[96%] w-full bg-[#0e0e0e] text-[#e8e8e8] border border-[#3b82f6]/40 shadow-inner overflow-hidden'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        msg.text
                      ) : (
                        <div className="text-xs leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed text-[#dcdcdc]">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">{children}</strong>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-2 border border-[#2a2a2a] rounded-[2px]">
                                  <table className="min-w-full text-left text-[11px] border-collapse">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-[#181818] text-[#888888] font-mono uppercase text-[10px] border-b border-[#2a2a2a]">
                                  {children}
                                </thead>
                              ),
                              th: ({ children }) => (
                                <th className="px-2.5 py-1.5 border-b border-[#2a2a2a] font-medium text-[#e8e8e8]">{children}</th>
                              ),
                              tbody: ({ children }) => (
                                <tbody className="divide-y divide-[#2a2a2a] bg-[#111111]">{children}</tbody>
                              ),
                              td: ({ children }) => (
                                <td className="px-2.5 py-1.5 font-mono tabular-nums text-[#e8e8e8]">{children}</td>
                              ),
                              tr: ({ children }) => (
                                <tr className="hover:bg-white/[0.02]">{children}</tr>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 my-1.5 pl-1 text-[#dcdcdc]">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 my-1.5 pl-1 text-[#dcdcdc]">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-[#dcdcdc]">{children}</li>
                              ),
                              code: ({ children }) => (
                                <code className="bg-[#181818] border border-[#2a2a2a] px-1 py-0.5 rounded text-[11px] font-mono text-[#3b82f6]">
                                  {children}
                                </code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-[#3b82f6] pl-2.5 my-1.5 text-[#888888] italic">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-[#888888] py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3b82f6]" />
                    <span>Evaluating verified project parameters...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Suggestion Chips when not expanded */}
        {!isExpanded && (
          <div className="hidden sm:flex items-center gap-2 mb-2 overflow-x-auto text-[11px] text-[#888888]">
            <span className="text-[10px] uppercase tracking-wider font-mono">Suggestions:</span>
            <button
              onClick={() => handleQuickQuestion("What is VIGIL's model test accuracy and ROC-AUC?")}
              className="px-2.5 py-1 rounded-[2px] bg-neutral-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-neutral-800/60 text-[#e8e8e8] transition-all truncate shadow-sm cursor-pointer"
            >
              Model accuracy &amp; ROC-AUC?
            </button>
            <button
              onClick={() => handleQuickQuestion('How does SHAP explain individual project delay risks?')}
              className="px-2.5 py-1 rounded-[2px] bg-neutral-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-neutral-800/60 text-[#e8e8e8] transition-all truncate shadow-sm cursor-pointer"
            >
              How SHAP explains delays?
            </button>
            <button
              onClick={() => handleQuickQuestion('What is the precision and recall on delayed projects?')}
              className="px-2.5 py-1 rounded-[2px] bg-neutral-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-neutral-800/60 text-[#e8e8e8] transition-all truncate shadow-sm cursor-pointer"
            >
              Precision &amp; recall metrics?
            </button>
          </div>
        )}

        {/* Liquid Glass Input Dock */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-center gap-2 p-1.5 sm:p-2 rounded-[4px] border border-white/10 bg-neutral-900/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-white/20 focus-within:border-[#3b82f6] focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(59,130,246,0.15)]"
        >
          <div className="flex items-center pl-2 text-[#3b82f6]">
            <Terminal className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (messages.length > 0) setIsExpanded(true);
            }}
            placeholder="Ask VIGIL a question regarding delay risks, model metrics, or dataset..."
            className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-[#e8e8e8] placeholder:text-[#888888] focus:outline-none"
          />

          {messages.length > 0 && !isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-[#888888] hover:text-[#e8e8e8] transition-colors cursor-pointer"
              title="Show dialogue"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="h-7 px-3 bg-[#3b82f6] hover:bg-[#2563eb] text-[#0a0a0a] rounded-[2px] font-medium text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0a0a0a]" />
            ) : (
              <Send className="w-3.5 h-3.5 text-[#0a0a0a]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
