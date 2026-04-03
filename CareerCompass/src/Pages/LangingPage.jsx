import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const Landingpage = () => {
  const navigate = useNavigate();
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
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-8 bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-2xl"
            >
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">AI-Guided Navigation</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9] text-zinc-100"
            >
              Map your <br />
              <span className="text-blue-500">Future !</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-zinc-500 text-lg md:text-xl max-w-lg mb-12 leading-relaxed"
            >
          Precision career mapping powered by neural analysis. We bridge the gap between where you are and where the industry demands you to be.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6"
            >
              <button onClick={() => navigate('/resume-upload')} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5">
                Get Started
              </button>
              <div className="hidden md:flex items-center gap-2 text-zinc-500">
                <ShieldCheck size={18} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- REFINED BENTO FEATURES --- */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Target className="text-blue-500" />}
            title="Skill Precision"
            desc="We identify the exact technical gaps between you and your target salary."
          />
          <FeatureCard 
            icon={<Zap className="text-purple-500" />}
            title="Neural Matching"
            desc="Our AI mimics executive recruiters to find roles that aren't publicly listed."
          />
          <FeatureCard 
            icon={<Target className="text-emerald-500" />}
            title="Market Value"
            desc="Real-time global data tells you exactly what your expertise is worth today."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 rounded-[2rem] bg-zinc-900/20 border border-white/5 hover:border-white/10 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-3">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Landingpage;