import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, User, LogOut, Menu, Sparkles } from 'lucide-react';

const Navbar = ({ onLoginClick }) => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) setUser(storedUser);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleProfileUpdate = () => {
    // Navigate to the profile update page
    window.location.href = '/manual-entry';
  }

  return (
    <div className="fixed w-full top-0 left-0 z-[100] px-4 sm:px-8 py-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`mx-auto max-w-7xl flex items-center justify-between px-6 py-2.5 rounded-2xl transition-all duration-500 ${scrolled ? 'bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-transparent border border-transparent'}`}
      >
        {/* LOGO SECTION - Enhanced with Glow */}
        {/* LOGO SECTION - Enhanced Instrument Design */}
  <Link to="/" className="flex items-center gap-4 group relative">
  {/* Ambient Glow behind the icon */}
  <div className="absolute -inset-2 bg-pink-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  
  <div className="relative">
    {/* Outer Rotating Ring (Visible on Hover) */}
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="absolute -inset-1 border border-dashed border-pink-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
    />
    
    {/* Main Icon Container */}
    <div className="relative w-11 h-11 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center shadow-2xl group-hover:border-pink-500/50 transition-all duration-300 overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 to-transparent" />
      
      {/* The Compass Icon - Rotates on hover */}
      <motion.div
        whileHover={{ rotate: 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        <Compass size={24} className="text-white group-hover:text-pink-400 transition-colors" />
      </motion.div>
      
      {/* Compass Needle Detail (Small Sparkle) */}
      <div className="absolute top-2 right-2 w-1 h-1 bg-pink-400 rounded-full animate-pulse shadow-[0_0_8px_#ec4899]" />
    </div>
  </div>

  <div className="flex flex-col">
    <div className="flex items-center gap-1">
      <span className="font-black text-xl tracking-tighter text-white leading-none">
        CAREER
      </span>
      <span className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 leading-none">
        COMPASS
      </span>
    </div>
    <div className="flex items-center gap-1.5 mt-1">
      <div className="h-[1px] w-4 bg-pink-500/50" />
      <span className="text-[7px] uppercase tracking-[0.4em] text-zinc-500 font-black group-hover:text-pink-400/80 transition-colors">
        Student Navigation System
      </span>
    </div>
  </div>
</Link>

        {/* CENTER LINKS - Sleeker Interaction */}
        <div className="hidden md:flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <NavLink to="/" label="Home" active={location.pathname === "/"} />
          <NavLink to="/resume-upload" label="Roadmap" active={location.pathname === "/resume-upload"} />
          <NavLink to="/roadmap" label="Career Paths" active={location.pathname === "/roadmap"} />
          <NavLink to="/interview" label="Interview Prep" active={location.pathname === "/interview"} />
        </div>

        {/* AUTH SECTION - Modern Pill Design */}
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div 
                key="user-pill"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full bg-pink-500/5 border border-pink-500/20 backdrop-blur-sm shadow-inner"
              >
                
               <div className="relative inline-block group">
                  <button
                    onClick={handleProfileUpdate}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 hover:bg-pink-500/20 transition-colors text-slate-200 font-semibold text-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-400 p-[1px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <User size={14} className="text-pink-400" />
                      </div>
                    </div>

                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest px-2">
                      {user}
                    </span>
                  </button>

                  {/* Tooltip */}
                  <div
                    className="
                      absolute left-1/2 -translate-x-1/2
                      -top+25
                      whitespace-nowrap
                      rounded-md bg-slate-900 border border-slate-700
                      px-3 py-1.5 text-xs text-slate-200
                      opacity-0 scale-95
                      transition-all duration-200
                      pointer-events-none
                      group-hover:opacity-100
                      group-hover:scale-100
                    "
                  >
                    Update Profile
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500"
                >
                  <LogOut size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="login-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoginClick}
                className="group relative flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all shadow-lg shadow-pink-500/20 hover:opacity-90"
              >
                <Sparkles size={14} className="text-white group-hover:animate-spin" />
                GET STARTED
              </motion.button>
            )}
          </AnimatePresence>
          
          <button className="md:hidden p-2 text-white/70 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>
    </div>
  );
};

const NavLink = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`relative px-5 py-2 text-[11px] uppercase tracking-widest font-black transition-all ${active ? 'text-white' : 'text-slate-400 hover:text-pink-400'}`}
  >
    {label}
    {active && (
      <motion.div 
        layoutId="nav-pill"
        className="absolute inset-0 bg-pink-500/10 rounded-lg -z-10 border border-pink-500/20"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
  </Link>
);

export default Navbar;