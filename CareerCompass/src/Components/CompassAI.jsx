import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Compass, 
    X, 
    Send, 
    Sparkles, 
    User,
    Loader2,
    ChevronDown,
    Bot
} from 'lucide-react';

const API = 'https://careercompass-0b6l.onrender.com';

const SUGGESTED_QUESTIONS = [
    "What should I learn next?",
    "How do I improve my readiness score?",
    "What's my biggest skill gap?",
    "How long until I'm job ready?",
];

export default function CompassAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm **CompassAI**, your personal career mentor. I know your profile, skills, and roadmap — so ask me anything specific to your journey! 🚀",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const username = localStorage.getItem('username');

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (text) => {
        const query = text || inputValue.trim();
        if (!query || isLoading) return;

        setInputValue('');
        setShowSuggestions(false);

        const userMsg = { role: 'user', content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/chat/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!res.ok) throw new Error('Failed to get response');
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || "Sorry, I couldn't find a relevant answer. Try rephrasing your question.",
                timestamp: new Date()
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please make sure your profile is set up and try again!",
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Render markdown-ish bold text
    const renderContent = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                id="compass-ai-trigger"
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-[900] group flex items-center gap-3 shadow-2xl transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 text-white px-5 py-3.5 rounded-full font-black text-sm tracking-wide shadow-xl">
                    <Compass size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
                    <span>CompassAI</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="compass-ai-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-[950] w-[min(420px,calc(100vw-2rem))] h-[min(620px,calc(100vh-6rem))] flex flex-col rounded-[2rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] border border-white/8"
                        style={{
                            background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                        }}
                    >
                        {/* Backdrop glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-10 left-0 w-48 h-48 bg-pink-600/8 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-orange-500 flex items-center justify-center shadow-lg">
                                        <Compass size={16} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-white tracking-tight">CompassAI</h3>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Career Mentor · Online</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                            : 'bg-gradient-to-br from-pink-500 to-orange-500'
                                    }`}>
                                        {msg.role === 'user' ? <User size={13} /> : <Compass size={13} />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 text-zinc-200 rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
                                                : 'bg-zinc-900/80 border border-white/5 text-zinc-300 rounded-tl-sm'
                                    }`}>
                                        {renderContent(msg.content)}
                                        <div className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 items-center"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                                        <Compass size={13} className="text-white" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-zinc-900/80 border border-white/5 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Questions */}
                        <AnimatePresence>
                            {showSuggestions && messages.length <= 1 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-3 flex flex-wrap gap-2 shrink-0"
                                >
                                    {SUGGESTED_QUESTIONS.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(q)}
                                            className="text-[10px] px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/8 text-zinc-400 hover:text-white hover:border-pink-500/30 hover:bg-pink-500/5 transition-all font-semibold"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="relative px-4 pb-4 pt-3 border-t border-white/5 shrink-0 bg-zinc-950/40 backdrop-blur-xl">
                            <div className="relative flex items-end gap-3">
                                <textarea
                                    ref={inputRef}
                                    id="compass-ai-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about your career path..."
                                    rows={1}
                                    disabled={isLoading || !username}
                                    className="flex-1 resize-none bg-zinc-900/60 border border-white/8 rounded-2xl px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-pink-500/30 focus:bg-zinc-900/80 transition-all font-medium leading-relaxed max-h-24 overflow-y-auto"
                                    style={{ scrollbarWidth: 'none' }}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={isLoading || !inputValue.trim() || !username}
                                    className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 active:scale-95"
                                >
                                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                </button>
                            </div>
                            {!username && (
                                <p className="text-[10px] text-zinc-600 text-center mt-2 font-semibold">Please log in to use CompassAI</p>
                            )}
                            <p className="text-[10px] text-zinc-700 text-center mt-2 font-bold uppercase tracking-widest">
                                <Sparkles size={8} className="inline mr-1" />
                                RAG-powered · Specific to your profile
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
