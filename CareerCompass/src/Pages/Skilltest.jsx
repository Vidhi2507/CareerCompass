import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const Skilltest = () => {
    const { username, skillName } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const encodedSkill = encodeURIComponent(skillName);
                const response = await axios.get(`http://localhost:8000/skilltest/${username}/${encodedSkill}`);
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
        // Map correct percentage to 1-5 scale
        return Math.max(1, Math.round((correctCount / questions.length) * 5));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        const proficiencyScore = calculateScore();

        try {
            // This call updates the DB and triggers the roadmap rebuild
            await axios.post(`http://localhost:8000/update-skill-and-rebuild?username=${username}&skill_name=${encodeURIComponent(skillName)}&score_out_of_5=${proficiencyScore}`);
            
            // Redirect back to roadmap to see changes
            navigate('/roadmap');
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error updating your profile. Please try again.");
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
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-4">
                        <Sparkles size={12} /> Skill Verification
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter italic">
                        {skillName} <span className="text-zinc-600">Assessment.</span>
                    </h1>
                </motion.div>

                {/* Questions List */}
                <div className="space-y-8">
                    {questions.map((q, qIdx) => (
                        <motion.div 
                            key={qIdx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: qIdx * 0.1 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-xl"
                        >
                            <div className="flex gap-4 mb-6">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold">
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

                {/* Submit Button */}
                <motion.div className="mt-12 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="group relative bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-600/40 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>FINISH ASSESSMENT <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </motion.div>
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
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mt-2 font-bold">Scoping MCQs to your current proficiency...</p>
        </div>
    </div>
);

export default Skilltest;