import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, Award, ChevronRight, MessageSquare, Target, Activity, 
  BrainCircuit, User, Bot, AlertCircle, Play, CheckCircle2, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://careercompass-0b6l.onrender.com';

const InterviewPrep = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interviewActive, setInterviewActive] = useState(false);
    
    // Interview State
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [history, setHistory] = useState([]);
    
    // User Input
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // Final Report
    const [report, setReport] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!username) {
            navigate('/');
        } else {
            startInterview();
        }
    }, [username, navigate]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, currentQuestion]);

    const startInterview = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/interview/start/${username}`);
            setCurrentQuestion(res.data.question);
            setTotalQuestions(res.data.total_questions);
            setQuestionNumber(1);
            setInterviewActive(true);
            setHistory([]);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to start interview. Please make sure you have generated a Roadmap first.");
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim() || submitting) return;
        
        const currentAns = answer;
        setAnswer("");
        setSubmitting(true);
        
        try {
            const res = await axios.post(`${API_URL}/interview/answer/${username}`, { answer: currentAns });
            const data = res.data;
            
            // Add to history
            const newHistoryItem = {
                question: currentQuestion,
                answer: currentAns,
                evaluation: data.evaluation
            };
            setHistory(prev => [...prev, newHistoryItem]);
            
            if (data.is_completed) {
                setInterviewActive(false);
                endInterview();
            } else {
                setCurrentQuestion(data.next_question);
                setQuestionNumber(data.current_question_number);
                setTotalQuestions(data.total_questions);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to submit answer. Please try again.");
            setAnswer(currentAns); // Restore answer
        } finally {
            setSubmitting(false);
        }
    };

    const endInterview = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/interview/end/${username}`);
            setReport(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !interviewActive && !report) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400">
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-6" />
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">Connecting to AI Interviewer...</h2>
            </div>
        );
    }

    if (error && !interviewActive) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-400 px-6">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-lg text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white mb-4">Cannot Start Interview</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">{error}</p>
                    <button 
                        onClick={() => navigate('/roadmap')}
                        className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        Go to Roadmap
                    </button>
                </div>
            </div>
        );
    }

    if (report) {
        return (
            <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6 text-white flex justify-center">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="max-w-3xl w-full z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-6">
                            <CheckCircle2 size={12} /> Interview Completed
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Report</span></h1>
                        <p className="text-zinc-400">Here is how you performed across the simulated technical interview.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] text-center backdrop-blur-md">
                            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block mb-2">Overall Score</span>
                            <span className="text-5xl font-black text-white">{report.average_score?.toFixed(1)}<span className="text-xl text-zinc-600">/10</span></span>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] text-center backdrop-blur-md">
                            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block mb-2">Questions Answered</span>
                            <span className="text-5xl font-black text-white">{report.answered}<span className="text-xl text-zinc-600">/{report.total_questions}</span></span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-4">Detailed Breakdown</h3>
                        {report.history.map((h, idx) => (
                            <div key={idx} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <h4 className="font-bold text-lg text-white leading-relaxed">Q: {h.question}</h4>
                                    <div className={`px-3 py-1 rounded-full border text-xs font-black shrink-0 ${h.score >= 7 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : h.score >= 4 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                        {h.score}/10
                                    </div>
                                </div>
                                <div className="p-4 bg-black/40 rounded-xl text-zinc-400 text-sm leading-relaxed border border-white/5">
                                    <span className="font-bold text-zinc-300 block mb-1">Your Answer:</span>
                                    {h.answer}
                                </div>
                                <div className="p-4 bg-pink-500/5 rounded-xl text-pink-200/80 text-sm leading-relaxed border border-pink-500/10">
                                    <span className="font-bold text-pink-400 block mb-1">AI Feedback:</span>
                                    {h.feedback}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <button onClick={() => navigate('/roadmap')} className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity">
                            Return to Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col pt-24 pb-0 h-screen overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col lg:flex-row gap-6 p-4 lg:p-8 relative z-10">
                
                {/* --- LEFT PANE: Active Context --- */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    {/* Header Card */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shrink-0 flex flex-col justify-center items-center text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                            <Bot size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">Technical Interview</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">Respond to the questions with as much technical depth as possible. The AI will evaluate your answers in real-time.</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Progress</span>
                                <span className="text-xs font-bold text-pink-400">Q {questionNumber} of {totalQuestions}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Question Card */}
                    <div className="bg-pink-500/5 border border-pink-500/20 rounded-[2rem] p-8 backdrop-blur-xl flex-1 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full" />
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-black tracking-widest uppercase mb-6 self-start">
                            <Activity size={12} className="animate-pulse" /> Active Question
                        </span>
                        
                        <h3 className="text-2xl font-bold leading-relaxed text-white">
                            {currentQuestion}
                        </h3>
                    </div>
                </div>

                {/* --- RIGHT PANE: Chat Timeline --- */}
                <div className="lg:w-2/3 bg-zinc-900/20 border border-white/5 rounded-[2rem] backdrop-blur-xl flex flex-col overflow-hidden relative">
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide">
                        {history.length === 0 && !submitting && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <MessageSquare size={48} className="text-zinc-600 mb-4" />
                                <p className="text-zinc-400 font-medium">Your interview transcript will appear here.</p>
                            </div>
                        )}

                        {history.map((item, idx) => (
                            <div key={idx} className="space-y-6 animate-fade-in">
                                {/* Question from AI */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 border border-pink-500/30">
                                        <Bot size={18} className="text-pink-400" />
                                    </div>
                                    <div className="bg-pink-500/5 border border-pink-500/10 p-5 rounded-2xl rounded-tl-none max-w-[85%]">
                                        <p className="text-zinc-200 leading-relaxed font-medium">{item.question}</p>
                                    </div>
                                </div>

                                {/* User Answer */}
                                <div className="flex gap-4 justify-end">
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tr-none max-w-[85%]">
                                        <p className="text-zinc-300 leading-relaxed">{item.answer}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
                                        <User size={18} className="text-zinc-400" />
                                    </div>
                                </div>

                                {/* Evaluation Feedback */}
                                <div className="flex justify-center px-12">
                                    <div className="w-full bg-zinc-950/50 border border-white/5 p-6 rounded-2xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Evaluation Result</span>
                                            <span className={`text-xs font-black px-2 py-1 rounded-md ${item.evaluation.score >= 7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                Score: {item.evaluation.score}/10
                                            </span>
                                        </div>
                                        <p className="text-zinc-400 text-sm leading-relaxed">
                                            {item.evaluation.feedback}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading / Submitting Animation */}
                        {submitting && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                                className="flex justify-center"
                            >
                                <div className="bg-zinc-900/50 border border-white/5 px-6 py-4 rounded-full flex items-center gap-3">
                                    <Loader2 size={16} className="text-pink-500 animate-spin" />
                                    <span className="text-xs font-bold text-zinc-400 tracking-wider">Evaluating response...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-zinc-950/80 border-t border-white/5 backdrop-blur-xl">
                        {error && <div className="mb-4 text-xs font-bold text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</div>}
                        
                        <div className="relative flex items-end gap-4">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submitAnswer();
                                    }
                                }}
                                disabled={submitting}
                                placeholder="Type your answer here... (Press Enter to submit, Shift+Enter for new line)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all resize-none min-h-[80px] max-h-[200px]"
                                rows={2}
                            />
                            <button
                                onClick={submitAnswer}
                                disabled={submitting || !answer.trim()}
                                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-lg shadow-pink-500/20"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Submit</>}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InterviewPrep;
