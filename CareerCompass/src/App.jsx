import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

import Navbar from './Components/Navbar';
import LandingPage from './Pages/LangingPage';
import ResumeUpload from './Pages/ResumeUpload';
import ManualEntry from './Pages/ManualEntry';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/register' : '/login';
    
    try {
      const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, formData);
      // console.log(response.data);
      if (!isRegister && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        
      }
      setShowLogin(false);
      window.location.reload();
    } 
    catch (err) {
    const serverError = err.response?.data;

    setError(
      serverError?.detail ||
      serverError?.message ||
      "Verification failed. Please check your credentials."
      );
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] flex flex-col font-sans selection:bg-indigo-500/30">
        <Navbar onLoginClick={() => { setShowLogin(true); setIsRegister(false); }} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/resume-upload" element={<ResumeUpload />} />
            <Route path="/manual-entry" element={<ManualEntry />} />
          </Routes>
        </main>

        {/* --- AUTH MODAL --- */}
        <AnimatePresence>
          {showLogin && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogin(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />

              {/* Modal Card */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-[440px] bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Decorative Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />

                <button 
                  onClick={() => setShowLogin(false)} 
                  className="absolute top-6 right-6 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
                >
                  <X size={20} />
                </button>

                <div className="relative z-10">
                  <header className="mb-8">
                    <h2 className="text-4xl font-black tracking-tight text-white mb-2">
                      {isRegister ? "Join the Lab" : "Welcome Back"}
                    </h2>
                    <p className="text-white/40 font-medium">
                      {isRegister ? "Start your career navigation today." : "Access your professional roadmaps."}
                    </p>
                  </header>

                  {error && (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-bold"
                    >
                      <AlertCircle size={18} /> {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                      {isRegister && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <AuthInput 
                            icon={<User size={18} />} 
                            name="username" 
                            placeholder="Username" 
                            onChange={handleChange} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AuthInput 
                      icon={<Mail size={18} />} 
                      type="email" 
                      name="email" 
                      placeholder="Email Address" 
                      onChange={handleChange} 
                    />
                    
                    <AuthInput 
                      icon={<Lock size={18} />} 
                      type="password" 
                      name="password" 
                      placeholder="Password" 
                      onChange={handleChange} 
                    />
                    
                    <button 
                      type="submit" 
                      className="w-full group relative bg-white text-black py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-50 transition-all mt-6 shadow-xl active:scale-[0.98] overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
                        <Sparkles size={16} className="text-indigo-600" />
                      </span>
                    </button>
                  </form>

                  <footer className="mt-8 text-center">
                    <button 
                      onClick={() => { setIsRegister(!isRegister); setError(''); }}
                      className="text-white/30 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                  </footer>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

/* --- HELPER COMPONENTS --- */

const AuthInput = ({ icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">
      {icon}
    </div>
    <input 
      {...props}
      required 
      className="w-full bg-white/[0.03] border border-white/5 p-4 pl-12 rounded-xl outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition-all text-white placeholder:text-white/20 font-medium text-sm" 
    />
  </div>
);

export default App;