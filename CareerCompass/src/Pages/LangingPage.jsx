import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, Sparkles, ShieldCheck, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/40 overflow-x-hidden">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT: THE REALISTIC COMPASS */}
          <div className="relative flex justify-center items-center h-[500px]">
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
                  className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa]" 
                />
                <span className="mt-2 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">SUCCESS</span>
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
                animate={{ rotate: 0 }}
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
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-bottom-[140px] border-bottom-blue-500 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
                       style={{ borderBottomWidth: '140px', borderBottomStyle: 'solid' }} />
                  
                  {/* Center Hub */}
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-zinc-700 z-50 flex items-center justify-center shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  </div>

                  {/* Bottom Needle (Balance) */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-top-[140px] border-top-zinc-800" 
                       style={{ borderTopWidth: '100px', borderTopStyle: 'solid' }} />
                </div>
              </motion.div>

              {/* Outer Glowing Ring */}
              <div className="absolute -inset-4 border border-blue-500/10 rounded-full blur-sm" />
            </div>
          </div>

          {/* RIGHT: THE CONTENT */}
          <div className="flex flex-col items-start text-left">
           

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9] text-zinc-100"
            >
              Map your <br />
              <span className="text-blue-500">Future !</span>
            </motion.h1>

            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6"
            >
              <button onClick={handleGetStarted} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5">
                Get Started
              </button>
              <div className="hidden md:flex items-center gap-2 text-zinc-500">
                
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- STEPWISE CAREER ROADMAP --- */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto relative">

          {/* Vertical Roadmap Line */}

          <div className="grid grid-cols-1 gap-8 relative z-10">

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Create Your Profile"
              desc="Upload your resume or manually enter your education, experience and skills"
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Rate Your Skills"
              desc="Add your technical skills and proficiency level to help us understand your current strengths."
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Choose Your Interests"
              desc="Select the career domains you're passionate about."
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="AI Recommends Target Roles"
              desc="Based on your profile, we identify the best job roles suited for your career goals."
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Skill Gap Analysis"
              desc="Compare your skills with industry requirements to identify strengths, weaknesses and missing skills."
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Personalized Learning Roadmap"
              desc="Receive a structured roadmap with learning phases tailored specifically for you."
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Build Real Projects"
              desc="Complete curated mini and major projects while mastering each phase"
            />

            <FeatureCard
              icon={<Target className="text-blue-500" />}
              title="Assess & Become Job Ready"
              desc="Take assessments, track your progress and achieve your target career."
            />

          </div>
        </div>
      </section>

    </div>
  );
};

const FeatureCard = ({ icon, title, desc, isLast }) => (
  <div className="relative flex flex-col items-center">

    {/* Card */}
    <div className="w-full p-8 rounded-[2rem] bg-zinc-900/20 border border-white/5 hover:border-white/10 transition-all group">
      <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <h3 className="text-lg font-bold mb-3 text-center">
        {title}
      </h3>

      <p className="text-zinc-500 text-sm leading-relaxed text-center">
        {desc}
      </p>
    </div>

    {/* Connector */}
    {!isLast && (
      <div className="w-[2px] h-10 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500"></div>
    )}
  </div>
);

export default Landingpage;