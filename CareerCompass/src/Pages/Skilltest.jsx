import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, ArrowRight, Loader2, Sparkles, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Skilltest = () => {
    const { username, skillName } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
    const [result, setResult] = useState(null); // { score, passed }
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const encodedSkill = encodeURIComponent(skillName);
                const response = await axios.get(`https://careercompass-0b6l.onrender.com/skilltest/${username}/${encodedSkill}`);
                setQuestions(response.data.data.questions);
            } catch (err) {
                console.error("Failed to fetch test:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [username, skillName]);

    const handleOptionSelect = (qIdx, option) => {
        setAnswers(prev => ({ ...prev, [qIdx]: option }));
    };

    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.answer) correctCount++;
        });
        // Returns a whole number proficiency level 1-5
        return Math.max(1, Math.round((correctCount / questions.length) * 5));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before finishing!");
            return;
        }

        setSubmitting(true);
        const proficiencyScore = calculateScore();
        const hasPassed = proficiencyScore >= 3;

        try {
            // Updated endpoint: Only updates skill proficiency, does NOT rebuild roadmap to save API credits
            await axios.post(`https://careercompass-0b6l.onrender.com/update-skill-assessment?username=${username}&skill_name=${encodeURIComponent(skillName)}&score_out_of_5=${proficiencyScore}`);
            
            setResult({
                score: proficiencyScore,
                passed: hasPassed,
                rawCorrect: Object.values(answers).filter((ans, i) => ans === questions[i].answer).length
            });
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error saving your results. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <TestLoader skill={skillName} />;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 pt-24 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] pointer-events-none" />

            <div className="max-w-3xl w-full relative z-10">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div 
                            key="test-view"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            {/* Header */}
                            <div className="mb-12">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-4">
                                    <Sparkles size={12} /> Skill Verification
                                </div>
                                <h1 className="text-4xl font-bold tracking-tighter italic">
                                    {skillName} <span className="text-zinc-600">Assessment.</span>
                                </h1>
                                <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-bold">Answer all {questions.length} questions to verify your proficiency.</p>
                            </div>

                            {/* Questions */}
                            <div className="space-y-8">
                                {questions.map((q, qIdx) => (
                                    <motion.div 
                                        key={qIdx}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: qIdx * 0.1 }}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl"
                                    >
                                        <div className="flex gap-4 mb-6">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold font-mono">
                                                {qIdx + 1}
                                            </span>
                                            <h3 className="text-lg font-medium text-zinc-200 leading-relaxed">
                                                {q.question}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {q.options.map((option, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleOptionSelect(qIdx, option)}
                                                    className={`p-4 rounded-xl text-left text-sm transition-all border ${
                                                        answers[qIdx] === option 
                                                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                                        : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{option}</span>
                                                        {answers[qIdx] === option && <CheckCircle2 size={16} className="text-blue-400" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div className="mt-12 flex justify-center">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="group relative bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-600/40 disabled:opacity-50 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : "FINISH ASSESSMENT"}
                                    {!submitting && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        /* RESULTS MODAL VIEW */
                        <motion.div 
                            key="result-view"
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] text-center shadow-3xl max-w-lg mx-auto"
                        >
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${result.passed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {result.passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                            </div>

                            <h2 className="text-3xl font-bold mb-2">
                                {result.passed ? "Skill Verified!" : "Needs Improvement"}
                            </h2>
                            <p className="text-zinc-500 text-sm uppercase tracking-[0.2em] font-bold mb-8">
                                Proficiency Level: <span className={result.passed ? "text-green-400" : "text-red-400"}>{result.score} / 5</span>
                            </p>

                            <div className={`p-6 rounded-2xl mb-8 text-left flex gap-4 ${result.passed ? 'bg-green-500/5 border border-green-500/10 text-green-100/80' : 'bg-red-500/5 border border-red-500/10 text-red-100/80'}`}>
                                <AlertCircle className="flex-shrink-0" size={20} />
                                <p className="text-sm leading-relaxed">
                                    {result.passed 
                                        ? `Excellent work, ${username}! Your performance indicates a strong grasp of ${skillName}. This milestone has been marked on your map.`
                                        : `You scored ${result.rawCorrect} out of ${questions.length}. We recommend reviewing the foundational tasks for ${skillName} in your roadmap before re-attempting.`
                                    }
                                </p>
                            </div>

                            <button 
                                onClick={() => navigate('/roadmap')}
                                className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl"
                            >
                                Return to Career Map
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const TestLoader = ({ skill }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] space-y-6">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
        </div>
        <div className="text-center">
            <h2 className="text-zinc-100 font-bold tracking-tighter text-xl italic">Calibrating {skill} Assessment</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">Scoping MCQs to your profile...</p>
        </div>
    </div>
);

export default Skilltest;