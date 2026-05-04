import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Terminal, Loader2, Sparkles } from 'lucide-react';

const Roadmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState({ 0: true });

  // Get username from localStorage (fallback to null)
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!username) {
        console.error("No username found in session");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/roadmap/${username}`);
        const result = await response.json();
        
        // result.data matches your backend's {"data": result_state.get("roadmap")}
        if (result.data) {
          setData(result.data);
          console.log(result.data)
        }
      } catch (err) {
        console.error("Error fetching roadmap:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [username]);

  if (loading) return <TreeLoader />;
  
  // Handle case where API call fails or user isn't found
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-500 font-medium">
      No roadmap data found for "{username}".
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-50 min-h-screen">
      <header className="mb-12 border-l-4 border-blue-600 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
          {data.role} <span className="text-blue-600 font-light italic">MAP</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">
          Target readiness: {data.readinessScore}% • Approx. {data.estimated_days_to_job_ready} days
        </p>
      </header>

      {/* Main Tree Trunk */}
      <div className="relative border-l-2 border-dashed border-slate-300 ml-4 space-y-10">
        {data.phases?.map((phase, pIdx) => (
          <div key={pIdx} className="relative pl-10">
            {/* Tree Node (Phase Joint) */}
            <div 
              onClick={() => setExpandedPhases(v => ({...v, [pIdx]: !v[pIdx]}))}
              className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm cursor-pointer flex items-center justify-center transition-all duration-300
                ${expandedPhases[pIdx] ? 'bg-blue-600 scale-110 shadow-blue-200 shadow-lg' : 'bg-slate-400 hover:bg-blue-500'}`}
            >
              {expandedPhases[pIdx] ? <ChevronDown size={16} color="white" /> : <ChevronRight size={16} color="white" />}
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">{phase.phase_name}</h2>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Phase Duration: {phase.duration_days} Days
              </div>
            </div>

            {/* Branching Content */}
            {expandedPhases[pIdx] && (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                {phase.skills_to_focus?.map((skill, sIdx) => (
                  <div key={sIdx} className="relative">
                    {/* Horizontal Branch Line */}
                    <div className="absolute -left-10 top-5 w-10 h-0.5 bg-blue-200"></div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm ml-2 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4 text-blue-600">
                        <Terminal size={18} />
                        <h3 className="font-bold text-slate-800 tracking-tight">{skill.skill}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skill.tasks?.map((task, tIdx) => (
                          <div key={tIdx} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50 flex items-start gap-2">
                            <span className="text-blue-400 font-bold">•</span>
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TreeLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-6">
    <div className="relative">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
    </div>
    <div className="text-center">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Generating Career Roadmap</h2>
      <p className="text-slate-500 text-sm mt-1">AI Agents are analyzing your skill gaps...</p>
    </div>
    <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 animate-[loading_17s_ease-in-out_forwards]"></div>
    </div>
  </div>
);

export default Roadmap;