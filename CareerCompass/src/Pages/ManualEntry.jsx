import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Code, Rocket, User } from 'lucide-react';
import axios from "axios";
import html2pdf from 'html2pdf.js';

const ManualEntry = () => {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const resumeRef = useRef(); 

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const [formData, setFormData] = useState({
    username: localStorage.getItem('username') || "UnRegistered User",
    fullName: "",
    currentRole: "",
    years_experience: "",
    education: [{ school: "", degree: "", field: "", startYear: "", endYear: "" }],
    experience: [{ company: "", role: "", description: "", startYear: "", endYear: "" }],
    skills: [{ skill: "", proficiency: 0 }],
    interests: []
  });

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExperienceChange = (index, e) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index][e.target.name] = e.target.value;
    setFormData({ ...formData, experience: updatedExperience });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { company: "", role: "", description: "", startYear: "", endYear: "" }]
    });
  };

  const removeExperience = (index) => {
    const updatedExperience = [...formData.experience];
    updatedExperience.splice(index, 1);
    setFormData({ ...formData, experience: updatedExperience });
  };

  const handleEducationChange = (index, e) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][e.target.name] = e.target.value;
    setFormData({ ...formData, education: updatedEducation });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { school: "", degree: "", field: "", startYear: "", endYear: "" }]
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData({ ...formData, education: updatedEducation });
  };

  const handleSkillsChange = (index, e) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index][e.target.name] = e.target.value;
    setFormData({ ...formData, skills: updatedSkills });
  };

  const addSkills = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { skill: "", proficiency: 0 }]
    });
  };

  const removeSkills = (index) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData({ ...formData, skills: updatedSkills });
  };

  const toggleInterest = (interest) => {
    setFormData(prev => {
      const currentInterests = prev.interests || [];
      if (currentInterests.includes(interest)) {
        return { ...prev, interests: currentInterests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...currentInterests, interest] };
      }
    });
  };

  // --- FINAL ACTIONS ---
  const handleDownloadPDF = async () => {
    const element = resumeRef.current;
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `${formData.fullName || 'User'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        // Force standard colors to avoid oklch crash
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("PDF generation failed due to modern CSS colors. Ensure standard colors are used.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const generateRoadmap = async () => {
    const endpoint = "/manual-entry/roadmap";
    try {
      const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, formData);
      console.log(response.data);
      navigate('/Roadmap');
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  // --- CONDITIONAL RENDERING (PREVIEW MODE) ---
  if (showPreview) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          {/* This container is styled with HEX colors to prevent html2pdf 
              from crashing on modern 'oklch' color functions.
          */}
          <div 
            ref={resumeRef}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#000000',
              '--tw-bg-opacity': '1',
              '--tw-text-opacity': '1',
              '--tw-border-opacity': '1'
            }}
            className="p-12 rounded-sm shadow-2xl font-serif min-h-[1050px] w-full max-w-[8.5in] mx-auto text-left"
          >
            <h1 style={{ color: '#000000' }} className="text-4xl font-bold border-b-2 border-black pb-2 uppercase">
                {formData.fullName || "Full Name"}
            </h1>
            <p style={{ color: '#374151' }} className="text-lg mt-2 font-semibold">
                {formData.currentRole} • {formData.years_experience} Years Exp
            </p>

            <h2 style={{ color: '#000000', borderColor: '#d1d5db' }} className="text-xl font-bold mt-8 border-b pb-1 uppercase">
                Experience
            </h2>
            {formData.experience.map((exp, i) => (
              <div key={i} className="mt-4 text-black">
                <div className="flex justify-between font-bold">
                  <span>{exp.role} @ {exp.company}</span>
                  <span>{exp.startYear} - {exp.endYear}</span>
                </div>
                <p style={{ color: '#4b5563' }} className="text-sm italic mt-1">{exp.description}</p>
              </div>
            ))}

            <h2 style={{ color: '#000000', borderColor: '#d1d5db' }} className="text-xl font-bold mt-8 border-b pb-1 uppercase">
                Education
            </h2>
            {formData.education.map((edu, i) => (
              <div key={i} className="mt-4 flex justify-between text-black">
                <div>
                  <span className="font-bold">{edu.degree} in {edu.field}</span>
                  <p>{edu.school}</p>
                </div>
                <span className="font-bold">{edu.startYear} - {edu.endYear}</span>
              </div>
            ))}

            <h2 style={{ color: '#000000', borderColor: '#d1d5db' }} className="text-xl font-bold mt-8 border-b pb-1 uppercase">
                Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.skills.map((s, i) => (
                <span key={i} style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#1f2937' }} className="px-3 py-1 rounded text-sm font-medium border">
                  {s.skill} (Level: {s.proficiency}/5)
                </span>
              ))}
            </div>

            <h2 style={{ color: '#000000', borderColor: '#d1d5db' }} className="text-xl font-bold mt-8 border-b pb-1 uppercase">
                Areas of Interest
            </h2>
            <p className="mt-2 text-black">{formData.interests.length > 0 ? formData.interests.join(', ') : 'Not specified'}</p>
          </div>

          <div className="flex flex-wrap gap-4 mt-12 justify-center">
            <button 
                onClick={handleDownloadPDF} 
                className="px-8 py-4 bg-zinc-800 border border-white/10 rounded-2xl font-bold hover:bg-zinc-700 transition-all active:scale-95"
            >
              Save as PDF
            </button>
            <button 
                onClick={generateRoadmap} 
                className="px-8 py-4 bg-indigo-600 rounded-2xl font-black tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              GENERATE ROADMAP →
            </button>
            <button 
                onClick={() => setShowPreview(false)} 
                className="text-zinc-500 font-bold hover:text-white transition-colors"
            >
                Edit Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM VIEW ---
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6 flex flex-col items-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10">
        <div className="mb-16 px-4">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Step {step} of 4</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              {step === 1 ? 'Experience' : step === 2 ? 'Education' : step === 3 ? 'Skills' : 'Goals'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "25%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            />
          </div>
        </div>

        <motion.div layout className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-14 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><User size={24} /></div>
                  <h2 className="text-3xl font-black tracking-tight text-white">The Basics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputField label="Full Name" placeholder="Vidya Shinde" name="fullName" value={formData.fullName} onChange={handleChange} />
                  </div>
                  <InputField label="Current Role" placeholder="Student" name="currentRole" value={formData.currentRole} onChange={handleChange} />
                  <InputField label="Years of Experience" placeholder="2" name="years_experience" value={formData.years_experience} onChange={handleChange} />
                </div>
                {formData.experience.map((exp, index) => (
                  <div key={index} className="space-y-4 border border-white/10 p-4 rounded-2xl bg-white/[0.02]">
                    <InputField label="Company" name="company" placeholder="Company Name" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} />
                    <InputField label="Position" name="role" placeholder="Position Title" value={exp.role} onChange={(e) => handleExperienceChange(index, e)} />
                    <InputField label="Description" name="description" placeholder="Brief Job Description" value={exp.description} onChange={(e) => handleExperienceChange(index, e)} />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Start Year" name="startYear" placeholder="2019" value={exp.startYear} onChange={(e) => handleExperienceChange(index, e)} />
                      <InputField label="End Year" name="endYear" placeholder="2023" value={exp.endYear} onChange={(e) => handleExperienceChange(index, e)} />
                    </div>
                    {formData.experience.length > 1 && <button type="button" onClick={() => removeExperience(index)} className="text-red-400 font-bold text-sm"> Remove </button>}
                  </div>
                ))}
                <button type="button" onClick={addExperience} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-white/40 font-bold hover:bg-white/5 transition-all">+ Add Another Experience</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400"><Code size={24} /></div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Education Details</h2>
                </div>
                {formData.education.map((edu, index) => (
                  <div key={index} className="space-y-4 border border-white/10 p-4 rounded-2xl bg-white/[0.02]">
                    <InputField label="School / University" name="school" placeholder="Institution Name" value={edu.school} onChange={(e) => handleEducationChange(index, e)} />
                    <InputField label="Degree" name="degree" placeholder="B. Tech, BSc, etc." value={edu.degree} onChange={(e) => handleEducationChange(index, e)} />
                    <InputField label="Field" name="field" placeholder="Computer Science" value={edu.field} onChange={(e) => handleEducationChange(index, e)} />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Start Year" name="startYear" placeholder="2019" value={edu.startYear} onChange={(e) => handleEducationChange(index, e)} />
                      <InputField label="End Year" name="endYear" placeholder="2023" value={edu.endYear} onChange={(e) => handleEducationChange(index, e)} />
                    </div>
                    {formData.education.length > 1 && <button type="button" onClick={() => removeEducation(index)} className="text-red-400 font-bold text-sm"> Remove </button>}
                  </div>
                ))}
                <button type="button" onClick={addEducation} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-white/40 font-bold hover:bg-white/5 transition-all">+ Add Education</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Code size={24} /></div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Your Toolkit</h2>
                </div>
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-end gap-4 border border-white/10 p-4 rounded-2xl bg-white/[0.02]">
                    <div className="flex-1 w-full"><InputField label="Skill" name="skill" placeholder="Skill Name" value={skill.skill} onChange={(e) => handleSkillsChange(index, e)} /></div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 ml-1">Proficiency</label>
                      <div className="flex gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => handleSkillsChange(index, { target: { name: "proficiency", value: star } })} className={`text-2xl transition-all hover:scale-110 ${star <= skill.proficiency ? "text-yellow-400" : "text-white/10"}`}>★</button>
                        ))}
                      </div>
                    </div>
                    {formData.skills.length > 1 && <button type="button" onClick={() => removeSkills(index)} className="text-red-400 font-bold text-xs uppercase">Remove</button>}
                  </div>
                ))}
                <button type="button" onClick={addSkills} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-white/40 font-bold hover:bg-white/5 transition-all">+ Add Skill</button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><Rocket size={24} /></div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Aspirations</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InterestCard label="Full Stack Engineering" icon="💻" isSelected={formData.interests.includes("Full Stack Engineering")} onToggle={() => toggleInterest("Full Stack Engineering")} />
                  <InterestCard label="AI & Machine Learning" icon="🤖" isSelected={formData.interests.includes("AI & Machine Learning")} onToggle={() => toggleInterest("AI & Machine Learning")} />
                  <InterestCard label="UX Architecture" icon="🎨" isSelected={formData.interests.includes("UX Architecture")} onToggle={() => toggleInterest("UX Architecture")} />
                  <InterestCard label="Product Management" icon="🚀" isSelected={formData.interests.includes("Product Management")} onToggle={() => toggleInterest("Product Management")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 text-white/40 font-bold hover:text-white transition-colors"><ChevronLeft size={20} /> Back</button>
            ) : <div />}

            {step < 4 ? (
              <button onClick={nextStep} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-white/10 flex items-center gap-2">CONTINUE <ChevronRight size={18} /></button>
            ) : (
              <button onClick={handleSubmit} className="group relative bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 overflow-hidden shadow-indigo-600/40 active:scale-95">
                <Sparkles size={18} />
                <span className="relative z-10">REVIEW & GENERATE</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const InputField = ({ label, placeholder, name, value, onChange }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 ml-1">{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500/40 focus:bg-white/[0.08] transition-all text-white placeholder:text-white/20 font-medium"
    />
  </div>
);

const InterestCard = ({ label, icon, isSelected, onToggle }) => (
  <button
    type='button'
    onClick={onToggle}
    className={`p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-left ${isSelected ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-indigo-600/15' : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60'}`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

export default ManualEntry;