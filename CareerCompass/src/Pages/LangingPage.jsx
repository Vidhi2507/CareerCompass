import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, Sparkles, ShieldCheck, Zap, Compass } from 'lucide-react';

const Landingpage = ({ openLogin }) => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // If a token exists, the user is logged in
      navigate('/resume-upload');
    } else {
      // If no token, call the function we passed from App.jsx
      openLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-pink-500/40 overflow-x-hidden">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/10 via-purple-600/10 to-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/10 via-pink-600/10 to-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" 
             style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT: THE REALISTIC COMPASS */}
          <div className="relative flex justify-center items-center h-[420px] md:h-[500px]">
            {/* Glowing background behind compass */}
            <div className="absolute w-72 h-72 md:w-[380px] md:h-[380px] bg-gradient-to-tr from-pink-500/10 via-purple-600/10 to-orange-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

            {/* The Compass Body */}
            <div className="relative w-80 h-80 md:w-[420px] md:h-[420px] rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 p-[2px] shadow-2xl">
              <div className="absolute inset-0 rounded-full bg-[#080808] shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)]" />
              
              {/* Internal Glass Reflection */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none z-20" />

              {/* Success / North Star */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 bg-pink-400 rounded-full shadow-[0_0_15px_#ec4899]" 
                />
                <span className="mt-2 text-[10px] font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400 uppercase">SUCCESS</span>
              </div>

              {/* Degree Notches */}
              {[...Array(60)].map((_, i) => (
                <div key={i} className="absolute inset-0 flex justify-center py-6" style={{ transform: `rotate(${i * 6}deg)` }}>
                  <div className={`w-[1px] rounded-full ${i % 5 === 0 ? 'h-4 bg-zinc-500' : 'h-2 bg-zinc-800'}`} />
                </div>
              ))}

              {/* THE NEEDLE */}
              <motion.div 
                initial={{ rotate: -120 }}
                animate={{ rotate: 15 }}
                transition={{ 
                  type: "spring",
                  stiffness: 40,
                  damping: 12,
                  delay: 0.8
                }}
                className="absolute inset-0 flex items-center justify-center z-40"
              >
                <div className="relative h-[80%] w-6 flex flex-col items-center">
                  {/* Top Needle (The Active Part) */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-bottom-[140px] border-bottom-pink-500 filter drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" 
                       style={{ borderBottomWidth: '140px', borderBottomStyle: 'solid' }} />
                  
                  {/* Center Hub */}
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-zinc-700 z-50 flex items-center justify-center shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]" />
                  </div>

                  {/* Bottom Needle (Balance) */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-top-[140px] border-top-zinc-800" 
                       style={{ borderTopWidth: '100px', borderTopStyle: 'solid' }} />
                </div>
              </motion.div>

              {/* Outer Glowing Ring */}
              <div className="absolute -inset-4 border border-pink-500/10 rounded-full blur-sm" />
            </div>
          </div>

          {/* RIGHT: THE CONTENT */}
          <div className="flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black tracking-widest uppercase mb-6"
            >
              <Sparkles size={14} className="animate-pulse" /> AI-Driven Student Navigation
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] text-zinc-100"
            >
              Map your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 filter drop-shadow-[0_0_20px_rgba(236,72,153,0.15)]">Future !</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-zinc-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-medium"
            >
              Step into the future of learning. CareerCompass analyzes your background, visualizes your skill gaps, and plans a tailored learning roadmap to launch your career.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6"
            >
              <button 
                onClick={handleGetStarted} 
                className="px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-pink-500/20 hover:shadow-pink-500/40"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- STEPWISE CAREER ROADMAP --- */}
      <section className="py-28 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
              Your Journey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500">Step by Step.</span>
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-[0.3em] font-black">How CareerCompass Guides You From Profile to Job Ready</p>
          </div>

          <div className="relative">
            {/* Center Connecting line with animated gradient */}
            <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-[3px] bg-gradient-to-b from-pink-500 via-purple-600 via-pink-500 to-orange-500 transform md:-translate-x-1/2 rounded-full opacity-80" />

            <div className="space-y-16">
              <TimelineStep 
                num="01" 
                title="Create Your Profile" 
                desc="Upload your resume or manually enter your education, experience, and current skills." 
                isRight={false}
              />
              <TimelineStep 
                num="02" 
                title="Rate Your Skills" 
                desc="Add your technical skills and proficiency level to help us map your starting point accurately." 
                isRight={true}
              />
              <TimelineStep 
                num="03" 
                title="Choose Your Interests" 
                desc="Select the professional domains you're passionate about, from AI & Machine Learning to UX Architecture." 
                isRight={false}
              />
              <TimelineStep 
                num="04" 
                title="AI Recommends Target Roles" 
                desc="Our intelligent agents analyze your background and match you with 3 high-potential target job roles." 
                isRight={true}
              />
              <TimelineStep 
                num="05" 
                title="Skill Gap Analysis" 
                desc="Identify precisely which technologies, concepts, and skills you lack to qualify for your target role." 
                isRight={false}
              />
              <TimelineStep 
                num="06" 
                title="Personalized Learning Roadmap" 
                desc="Receive a custom-tailored, phase-by-phase learning path complete with estimated durations and goals." 
                isRight={true}
              />
              <TimelineStep 
                num="07" 
                title="Build Real Projects" 
                desc="Strengthen your portfolio with concrete Mini and Major projects selected for each learning phase." 
                isRight={false}
              />
              <TimelineStep 
                num="08" 
                title="Assess & Verify Readiness" 
                desc="Take structured MCQ skill tests, track your updated readiness score, and become job-ready." 
                isRight={true}
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

/* --- TIMELINE COMPONENT --- */
const TimelineStep = ({ num, title, desc, isRight }) => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className={`flex flex-col md:flex-row items-stretch w-full relative ${isRight ? 'md:flex-row-reverse' : ''}`}
  >
    {/* Left/Right spacer for layout alignment */}
    <div className="hidden md:block w-1/2" />

    {/* Center node indicator */}
    <div className="absolute left-4 md:left-1/2 top-8 w-9 h-9 -translate-x-1/2 rounded-full bg-[#050505] border-2 border-purple-500 z-20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 animate-pulse" />
    </div>

    {/* Card container */}
    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-12 flex">
      <div className="relative w-full p-8 rounded-[2.5rem] bg-zinc-900/10 border border-white/5 hover:border-pink-500/20 backdrop-blur-md transition-all duration-500 group flex flex-col items-start text-left shadow-lg">
        {/* Glow backdrop on hover */}
        <div className="absolute -inset-[1px] rounded-[2.5rem] bg-gradient-to-tr from-pink-500 via-purple-600 to-orange-500 opacity-0 group-hover:opacity-20 blur-[1px] transition-opacity -z-10" />
        
        {/* Number badge */}
        <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 text-white text-[10px] font-black tracking-widest mb-4 shadow-md shadow-pink-500/10">
          STEP {num}
        </div>

        <h3 className="text-xl font-bold mb-3 text-white tracking-tight group-hover:text-pink-400 transition-colors">
          {title}
        </h3>

        <p className="text-zinc-400 text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  </motion.div>
);

export default Landingpage;