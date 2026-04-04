import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Code, Rocket, User } from 'lucide-react';
import axios from "axios";

const ManualEntry = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const [formData, setFormData] = useState({fullName: "",gradYear: "",
    education: [
    { school: "", degree: "", field: "", startYear: "", endYear: "" }
  ]
  ,skills: "",interests: []});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleExperienceAdd = () => {
    setEducationList([
      ...educationList,
      {
        school: "",
        degree: "",
        field: "",
        startYear: "",
        endYear: "",
      },
    ]);
  };

    const handleEducationChange = (index, e) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][e.target.name] = e.target.value;

    setFormData({ ...formData, education: updatedEducation });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { school: "", degree: "", field: "", startYear: "", endYear: "" }
      ]
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);

    setFormData({ ...formData, education: updatedEducation });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = "/manual-entry/roadmap";
    
    try {
      const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, formData);
      console.log(response.data);
      navigate('/Roadmap');
      
    } 
    catch (err) {
      console.error("Submission failed:", err);
    }
  };



  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6 flex flex-col items-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10">
        
        {/* --- HIGH-TECH PROGRESS BAR --- */}
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

        {/* --- FORM CARD --- */}
        <motion.div 
          layout
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-14 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {step === 5 && (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><User size={24}/></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">The Basics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputField label="Full Name" placeholder="Vidya Shinde" name="fullName" value={formData.fullName} onChange={handleChange} />
                  </div>
                  <InputField label="Current Role" placeholder="Student" name="role" value={formData.role} onChange={handleChange} />
                  <InputField label="Years of Experience" placeholder="2" name="years_experience" value={formData.years_experience} onChange={handleChange} />
                  <div className="md:col-span-2 text font-black text-white">
                    <button onClick={handleExperienceAdd} style={{ fontSize: 15 }}>➕ Add Experience</button>
                  </div>
                </div>


                {formData.experience.map((exp, index) => (
                <div key={index} className="space-y-4 border border-white/10 p-4 rounded-2xl">
                        
                <InputField label="Company" type="text" name="company" placeholder="Company Name" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <InputField label="Position" type="text" name="position" placeholder="Position Title" value={exp.position} onChange={(e) => handleExperienceChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <InputField label="Description" type="text" name="description" placeholder="Job Description" value={exp.description} onChange={(e) => handleExperienceChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <div className="grid grid-cols-2 gap-4">
                          <InputField label="Start Year" type="text" name="startYear" placeholder="2019" value={exp.startYear} onChange={(e) => handleExperienceChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                          <InputField label="End Year" type="text" name="endYear" placeholder="2023" value={exp.endYear} onChange={(e) => handleExperienceChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                </div>
                        

                {formData.experience.length > 1 && (
                      <button type="button" onClick={() => removeExperience(index)} className="text-red-400 font-bold text-sm"> Remove </button>
                            
                        )}
                </div>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-xl font-bold"
                >
                  ➕ Add Experience
                </button>


              </motion.div>
            )}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400"><Code size={24}/></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Education Details</h2>
                </div>
                <p className="text-white/40 font-medium">Tell us about your educational background.</p>
                {formData.education.map((edu, index) => (
                <div key={index} className="space-y-4 border border-white/10 p-4 rounded-2xl">
                        
                <InputField label="School / University" type="text" name="school" placeholder="School / University" value={edu.school} onChange={(e) => handleEducationChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <InputField label="Degree" type="text" name="degree" placeholder="B. Tech, BSc, B.Com" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <InputField label="Field of Study" type="text" name="field" placeholder="Computer Science" value={edu.field} onChange={(e) => handleEducationChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                <div className="grid grid-cols-2 gap-4">
                          <InputField label="Start Year" type="text" name="startYear" placeholder="2019" value={edu.startYear} onChange={(e) => handleEducationChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                          <InputField label="End Year" type="text" name="endYear" placeholder="2023" value={edu.endYear} onChange={(e) => handleEducationChange(index, e)} className="w-full bg-white/[0.05] border border-white/10 p-3 rounded-xl text-white"/>
                </div>
                        

                {formData.education.length > 1 && (
                      <button type="button" onClick={() => removeEducation(index)} className="text-red-400 font-bold text-sm"> Remove </button>
                            
                        )}
                </div>
                ))}

                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-xl font-bold"
                >
                  ➕ Add Education
                </button>
              </motion.div>
            )}

            {step === 0 && (
              <motion.div 
                key="not a valid step now"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400"><Code size={24}/></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Your Toolkit</h2>
                </div>
                <p className="text-white/40 font-medium">Which technologies have you mastered or explored?</p>
                <textarea 
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl p-6 outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] min-h-[180px] transition-all text-white placeholder:text-white/20 font-medium"
                  placeholder="e.g. React, Python, Django, Tailwind CSS, PostgreSQL..."
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><Rocket size={24}/></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Aspirations</h2>
                </div>
                <p className="text-white/40 font-medium">Select the paths that resonate with your career vision.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InterestCard label="Full Stack Engineering" icon="💻" />
                  <InterestCard label="AI & Machine Learning" icon="🤖" />
                  <InterestCard label="UX Architecture" icon="🎨" />
                  <InterestCard label="Product Management" icon="🚀" />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><Rocket size={24}/></div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Aspirations</h2>
                </div>
                <p className="text-white/40 font-medium">Select the paths that resonate with your career vision.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InterestCard label="Full Stack Engineering" icon="💻" />
                  <InterestCard label="AI & Machine Learning" icon="🤖" />
                  <InterestCard label="UX Architecture" icon="🎨" />
                  <InterestCard label="Product Management" icon="🚀" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- NAVIGATION --- */}
          <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
            {step > 1 ? (
              <button 
                onClick={prevStep} 
                className="flex items-center gap-2 text-white/40 font-bold hover:text-white transition-colors"
              >
                <ChevronLeft size={20} /> Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button 
                onClick={nextStep} 
                className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2"
              >
                CONTINUE <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="group relative bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.4)]"
              >
                <Sparkles size={18} />
                <span className="relative z-10">GENERATE ROADMAP</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* --- HELPER COMPONENTS --- */

const InputField = ({ label, placeholder, name, value, onChange }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 ml-1">{label}</label>
    <input 
      type="text" 
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-white placeholder:text-white/20 font-medium" 
    />
  </div>
);

const InterestCard = ({ label, icon }) => {
  const [selected, setSelected] = useState(false);
  return (
    <button 
      onClick={() => setSelected(!selected)}
      className={`
        p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-left
        ${selected 
          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
          : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60'}
      `}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}

export default ManualEntry;