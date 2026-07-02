import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle2, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResumeUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (!token || !username) {
      alert("Please login to access this feature.");
      return false;
    }
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!checkAuth()) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !checkAuth()) return;

    setSubmitting(true);
    const username = localStorage.getItem('username');
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST to your new FastAPI endpoint
      const response = await axios.post(
        `https://careercompass-0b6l.onrender.com/upload-resume/${username}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("Upload Success:", response.data);
      navigate('/roadmap');
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.detail || "Failed to analyze resume. Try manual entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualEntryClick = (e) => {
    e.preventDefault();
    if (checkAuth()) navigate('/manual-entry');
  };

  const handleBrowseClick = () => {
    if (checkAuth()) fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pt-32 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold tracking-widest uppercase mb-6">
            <Sparkles size={12} /> Step 01: The Blueprint
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Upload your <span className="text-zinc-500">profile.</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Drop your resume and let our AI map your skills to industry benchmarks in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative z-20 group border border-zinc-800 rounded-[2rem] transition-all duration-500
              flex flex-col items-center justify-center p-12 md:p-20
              ${dragActive ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'bg-zinc-900/40 backdrop-blur-sm hover:border-zinc-700'}
              ${file ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center"
                  onClick={handleBrowseClick}
                >
                  <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-8 border border-zinc-700 group-hover:border-blue-500/50 transition-all">
                    <UploadCloud size={32} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Drop file here</h3>
                  <p className="text-zinc-500 text-sm mb-8">PDF Files only (Max 10MB)</p>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => {
                        if (checkAuth() && e.target.files[0]) setFile(e.target.files[0]);
                    }}
                    accept=".pdf"
                  />
                  
                  <div className="text-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Browse Files <ArrowRight size={14} />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="selected"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                    <FileText size={28} className="text-blue-400" />
                  </div>
                  
                  <div className="mb-10">
                    <p className="text-2xl font-bold tracking-tight mb-2">{file.name}</p>
                    <div className="flex items-center justify-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <CheckCircle2 size={14} /> File Ready for Analysis
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <button 
                      onClick={handleUpload}
                      disabled={submitting}
                      className="flex-grow bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Start Mapping"
                      )}
                    </button>
                    <button 
                      onClick={() => setFile(null)}
                      disabled={submitting}
                      className="px-6 py-4 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400 disabled:opacity-30"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <p className="text-zinc-500 text-sm">
            Don't have a resume?{' '}
            <button 
                onClick={handleManualEntryClick}
                className="text-zinc-200 hover:text-blue-400 font-semibold transition-colors bg-transparent border-none cursor-pointer"
            >
              Enter details manually →
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeUpload;