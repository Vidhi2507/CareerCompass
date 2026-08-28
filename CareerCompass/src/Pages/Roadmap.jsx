import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ExternalLink, 
  Award, 
  Trophy, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Flame, 
  CheckCircle2, 
  Map, 
  Compass, 
  Loader2, 
  Sparkles, 
  Target, 
  Activity, 
  Calendar, 
  CheckSquare, 
  Square,
  ArrowRight,
  Book,
  FileText
} from 'lucide-react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Roadmap = () => {
    const svgRef = useRef(null);
    const [data, setData] = useState(null);
    const [userSkills, setUserSkills] = useState([]); // Stores test results
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'mindmap'
    
    // Expandable accordion states
    const [expandedPhases, setExpandedPhases] = useState({});
    const [expandedSkills, setExpandedSkills] = useState({});
    
    // Checklist state
    const [completedTasks, setCompletedTasks] = useState({});
    
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    // 1. Fetch Roadmap AND User Skill Scores
    useEffect(() => {
        const initializeData = async () => {
            if (!username) {
                setLoading(false);
                return;
            }

            try {
                // Parallel fetch for Roadmap and Skill Scores
                const [roadmapRes, skillsRes] = await Promise.all([
                    fetch(`https://careercompass-0b6l.onrender.com/roadmap/${username}`),
                    axios.get(`https://careercompass-0b6l.onrender.com/user-skills/${username}`)
                ]);

                const roadmapResult = await roadmapRes.json();
                const roadmapObj = roadmapResult.data;
                setUserSkills(skillsRes.data.skills || []);

                if (roadmapObj && roadmapObj.phases) {
                    const hierarchy = {
                        name: roadmapObj.role || "Career Path",
                        isRoot: true,
                        children: roadmapObj.phases.map(phase => ({
                            name: phase.phase_name,
                            type: 'phase',
                            duration: phase.duration_days,
                            children: (phase.skills_to_focus || []).map(skill => ({
                                name: skill.skill,
                                type: 'topic',
                                tasks: skill.tasks || []
                            }))
                        }))
                    };
                    setData({ raw: roadmapObj, tree: hierarchy });

                    // Load checklist progress from localStorage
                    const storageKey = `${username}_${roadmapObj.role}_completed_tasks`;
                    const saved = localStorage.getItem(storageKey);
                    if (saved) {
                        setCompletedTasks(JSON.parse(saved));
                    }

                    // Expand first phase by default
                    setExpandedPhases({ 0: true });
                }
            } catch (err) {
                console.error("Error initializing roadmap data:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [username]);

    // 2. D3 Tree Logic (Only runs when viewMode is 'mindmap')
    useEffect(() => {
        if (!data || !svgRef.current || viewMode !== 'mindmap') return;

        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth || 1000;
        const height = svgRef.current.clientHeight || 600;
        const margin = { top: 20, right: 160, bottom: 20, left: 160 };

        const svg = d3.select(svgRef.current)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const treeLayout = d3.tree().size([height - 100, width - margin.left - margin.right]);
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

        const root = d3.hierarchy(data.tree);
        root.x0 = height / 2;
        root.y0 = 0;

        const collapse = (d) => {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        };

        if (root.children) {
            root.children.forEach(collapse);
        }

        let i = 0;
        const update = (source) => {
            const treeData = treeLayout(root);
            const nodes = treeData.descendants();
            const links = treeData.links();

            nodes.forEach(d => d.y = d.depth * 220);

            const node = svg.selectAll('g.node')
                .data(nodes, d => d.id || (d.id = ++i));

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .on('click', (event, d) => {
                    if (d.data.type === 'topic') {
                        // Navigate or drill down
                        navigate(`/test/${username}/${encodeURIComponent(d.data.name)}`);
                    } else {
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d);
                    }
                });

            nodeEnter.append('circle')
                .attr('class', 'node-circle')
                .attr('r', 1e-6)
                .style("cursor", "pointer");

            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("x", d => d.children || d._children ? -15 : 15)
                .attr("text-anchor", d => d.children || d._children ? "end" : "start")
                .text(d => d.data.name)
                .style("fill", d => d.data.isRoot ? "#fff" : "#a1a1aa")
                .style("font-size", d => d.data.isRoot ? "14px" : "11px")
                .style("pointer-events", "none")
                .style("fill-opacity", 0);

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition().duration(600)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            // DYNAMIC COLOR LOGIC (Sunset gradient themed)
            nodeUpdate.select('circle.node-circle')
                .attr('r', d => d.data.isRoot ? 10 : 6)
                .style("fill", d => {
                    if (d.data.type === 'topic') {
                        const skillRecord = userSkills.find(s => s.skill === d.data.name);
                        if (skillRecord) {
                            return skillRecord.proficiency >= 3 ? "#22c55e" : "#ef4444";
                        }
                    }
                    return d._children ? "#d946ef" : "#09090b";
                })
                .style("stroke", d => {
                    const skillRecord = userSkills.find(s => s.skill === d.data.name);
                    if (skillRecord) {
                        return skillRecord.proficiency >= 3 ? "#22c55e" : "#ef4444";
                    }
                    return "#ec4899";
                })
                .style("stroke-width", "2px");

            nodeUpdate.select('text').style('fill-opacity', 1);

            const nodeExit = node.exit().transition().duration(600)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .remove();

            nodeExit.select('circle').attr('r', 1e-6);
            nodeExit.select('text').style('fill-opacity', 0);

            const link = svg.selectAll('path.link')
                .data(links, d => d.target.id);

            const linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#27272a")
                .attr("stroke-width", "1.5px")
                .attr('d', d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            linkEnter.merge(link).transition().duration(600).attr('d', d => diagonal(d));

            link.exit().transition().duration(600)
                .attr('d', d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                }).remove();

            nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
        };

        update(root);
    }, [data, userSkills, viewMode]);

    // Handle checklist click
    const toggleTask = (phaseIdx, skillName, taskIdx) => {
        const key = `${phaseIdx}_${skillName}_${taskIdx}`;
        setCompletedTasks(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            // Save to localStorage
            const storageKey = `${username}_${data.raw.role}_completed_tasks`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });
    };

    // Calculate phase progress percentage
    const getPhaseProgress = (phase, phaseIdx) => {
        let totalTasks = 0;
        let completedCount = 0;

        (phase.skills_to_focus || []).forEach(skill => {
            (skill.tasks || []).forEach((_, taskIdx) => {
                totalTasks++;
                const key = `${phaseIdx}_${skill.skill}_${taskIdx}`;
                if (completedTasks[key]) {
                    completedCount++;
                }
            });
        });

        if (totalTasks === 0) return 0;
        return Math.round((completedCount / totalTasks) * 100);
    };

    // Calculate overall roadmap progress percentage
    const getOverallProgress = () => {
        if (!data || !data.raw.phases) return 0;
        let totalTasks = 0;
        let completedCount = 0;

        data.raw.phases.forEach((phase, phaseIdx) => {
            (phase.skills_to_focus || []).forEach(skill => {
                (skill.tasks || []).forEach((_, taskIdx) => {
                    totalTasks++;
                    const key = `${phaseIdx}_${skill.skill}_${taskIdx}`;
                    if (completedTasks[key]) {
                        completedCount++;
                    }
                });
            });
        });

        if (totalTasks === 0) return 0;
        return Math.round((completedCount / totalTasks) * 100);
    };

    const togglePhaseExpand = (idx) => {
        setExpandedPhases(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleSkillExpand = (skillName) => {
        setExpandedSkills(prev => ({ ...prev, [skillName]: !prev[skillName] }));
    };

    if (loading) return <TreeLoader />;
    if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">No data found.</div>;

    const overallProgress = getOverallProgress();

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 pt-32 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
            {/* Instagram Glowing Backdrops */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl w-full relative z-10">
                
                {/* --- HEADER DASHBOARD --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mb-16 p-8 md:p-10 rounded-[3rem] bg-zinc-900/10 border border-white/5 backdrop-blur-xl">
                    <div className="lg:col-span-2 text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black tracking-widest uppercase">
                            <Sparkles size={12} className="animate-pulse" /> AI Interactive Syllabus
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-zinc-100">
                            {data.raw.role} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500">Path.</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-zinc-400 text-xs font-bold uppercase tracking-wider pt-2">
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5"><Target size={14} className="text-pink-500" /> Readiness: {data.raw.readinessScore}%</span>
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5"><Calendar size={14} className="text-purple-500" /> {data.raw.estimated_days_to_job_ready} Day Sprint</span>
                        </div>
                    </div>

                    {/* Progress Wheel */}
                    <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 rounded-[2.5rem] border border-white/5">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                {/* Track Circle */}
                                <circle
                                    className="text-zinc-800"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="45"
                                    cx="60"
                                    cy="60"
                                />
                                {/* Progress Circle */}
                                <motion.circle
                                    className="text-pink-500"
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 45}
                                    strokeDashoffset={((100 - overallProgress) / 100) * (2 * Math.PI * 45)}
                                    strokeLinecap="round"
                                    stroke="url(#sunset-gradient)"
                                    fill="transparent"
                                    r="45"
                                    cx="60"
                                    cy="60"
                                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                    animate={{ strokeDashoffset: ((100 - overallProgress) / 100) * (2 * Math.PI * 45) }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="sunset-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ec4899" />
                                        <stop offset="50%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#f97316" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-white">{overallProgress}%</span>
                                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Done</span>
                            </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mt-3">Roadmap Completion</span>
                    </div>
                </div>

                {/* --- VIEW SELECTOR TAB --- */}
                <div className="flex justify-center mb-12">
                    <div className="relative flex p-1 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`relative z-10 flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${viewMode === 'timeline' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {viewMode === 'timeline' && (
                                <motion.div layoutId="activeView" className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 rounded-xl -z-10 shadow-lg shadow-pink-500/10" />
                            )}
                            <Map size={14} /> Timeline Path
                        </button>
                        <button
                            onClick={() => setViewMode('mindmap')}
                            className={`relative z-10 flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${viewMode === 'mindmap' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {viewMode === 'mindmap' && (
                                <motion.div layoutId="activeView" className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 rounded-xl -z-10 shadow-lg shadow-pink-500/10" />
                            )}
                            <Compass size={14} /> Mind Map Graph
                        </button>
                    </div>
                </div>

                {/* --- VIEW RENDERING --- */}
                <AnimatePresence mode="wait">
                    {viewMode === 'timeline' ? (
                        <motion.div 
                            key="timeline"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="relative text-left space-y-12"
                        >
                            {/* Vertical Line */}
                            <div className="absolute left-6 md:left-10 top-6 bottom-6 w-[2px] bg-gradient-to-b from-pink-500 via-purple-600 to-orange-500 opacity-20" />

                            {data.raw.phases.map((phase, idx) => {
                                const progress = getPhaseProgress(phase, idx);
                                const isExpanded = expandedPhases[idx];

                                return (
                                    <div key={idx} className="relative flex items-stretch gap-6 md:gap-10">
                                        {/* Connector Circle */}
                                        <div className="absolute left-6 md:left-10 top-8 w-6 h-6 -translate-x-1/2 rounded-full bg-zinc-950 border-2 border-pink-500 flex items-center justify-center z-20 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                                            <div className={`w-2.5 h-2.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-pink-500 animate-pulse'}`} />
                                        </div>

                                        <div className="w-full pl-12 md:pl-16">
                                            <div className="relative p-6 md:p-8 rounded-[2rem] bg-zinc-950/40 border border-white/5 hover:border-pink-500/15 backdrop-blur-md transition-all duration-300 group shadow-xl">
                                                {/* Hover card border glow */}
                                                <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 opacity-0 group-hover:opacity-10 blur-[1px] transition-opacity -z-10" />

                                                {/* Phase Card Header */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-wider">
                                                                Phase {idx + 1}
                                                            </span>
                                                            <span className="text-zinc-500 text-xs font-bold flex items-center gap-1.5">
                                                                <Calendar size={12} /> {phase.duration_days} Days
                                                            </span>
                                                        </div>
                                                        <h2 className="text-xl md:text-2xl font-black text-white mt-2 tracking-tight group-hover:text-pink-400 transition-colors">
                                                            {phase.phase_name}
                                                        </h2>
                                                    </div>

                                                    {/* Progress and Expand buttons */}
                                                    <div className="flex items-center gap-6 self-start md:self-auto">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Phase Progress</span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 md:w-32 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                                    <div 
                                                                        style={{ width: `${progress}%` }} 
                                                                        className="h-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-500" 
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold text-white">{progress}%</span>
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={() => togglePhaseExpand(idx)}
                                                            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-pink-500/10 hover:border-pink-500/20 text-zinc-400 hover:text-pink-400 transition-all"
                                                        >
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Phase Content (Expandable) */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden space-y-8"
                                                        >
                                                            {/* --- Skills Breakdown Accordions --- */}
                                                            <div className="space-y-4">
                                                                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2 mb-2">
                                                                    <Activity size={14} className="text-pink-500" /> Key Skills & Syllabus
                                                                </h3>

                                                                {(phase.skills_to_focus || []).map((skill, sIdx) => {
                                                                    const skillExpanded = expandedSkills[skill.skill];
                                                                    
                                                                    return (
                                                                        <div key={sIdx} className="rounded-2xl border border-white/5 bg-zinc-950/30 overflow-hidden">
                                                                            <button 
                                                                                onClick={() => toggleSkillExpand(skill.skill)}
                                                                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] text-left transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                                                    <span className="font-bold text-sm text-zinc-200">{skill.skill}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 text-zinc-500">
                                                                                    <span className="text-[10px] uppercase font-black tracking-widest">{(skill.tasks || []).length} tasks</span>
                                                                                    {skillExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                                </div>
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {skillExpanded && (
                                                                                    <motion.div 
                                                                                        initial={{ height: 0 }}
                                                                                        animate={{ height: "auto" }}
                                                                                        exit={{ height: 0 }}
                                                                                        className="overflow-hidden bg-[#0a0a0a]/50 border-t border-white/5 p-5 space-y-6"
                                                                                    >
                                                                                        {/* Checklist of Tasks */}
                                                                                        <div className="space-y-3">
                                                                                            <span className="text-[10px] uppercase tracking-widest font-black text-zinc-600 block mb-1">Learning Checklist</span>
                                                                                            {(skill.tasks || []).map((task, tIdx) => {
                                                                                                const isChecked = completedTasks[`${idx}_${skill.skill}_${tIdx}`];
                                                                                                
                                                                                                return (
                                                                                                    <div 
                                                                                                        key={tIdx} 
                                                                                                        onClick={() => toggleTask(idx, skill.skill, tIdx)}
                                                                                                        className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-white/5 hover:border-pink-500/10 rounded-xl cursor-pointer transition-all hover:bg-zinc-900/50"
                                                                                                    >
                                                                                                        <div className={`mt-0.5 transition-colors ${isChecked ? 'text-emerald-500' : 'text-zinc-700 hover:text-pink-500'}`}>
                                                                                                            {isChecked ? <CheckCircle2 size={16} className="fill-emerald-500/10" /> : <Square size={16} />}
                                                                                                        </div>
                                                                                                        <span className={`text-xs leading-relaxed ${isChecked ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                                                                                            {task}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>

                                                                                        {/* Resources & Action Row */}
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                                                            <div className="space-y-2">
                                                                                                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-600 block">Recommended Resources</span>
                                                                                                <div className="flex flex-col gap-2">
                                                                                                    {skill.resource_book && (
                                                                                                        <div className="flex items-center gap-2.5 text-xs text-zinc-400 bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
                                                                                                            <BookOpen size={14} className="text-pink-400 shrink-0" />
                                                                                                            <span className="truncate font-semibold">{skill.resource_book}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {skill.official_docs && (
                                                                                                        <a 
                                                                                                            href={skill.official_docs} 
                                                                                                            target="_blank" 
                                                                                                            rel="noreferrer" 
                                                                                                            className="flex items-center gap-2.5 text-xs text-pink-400 bg-pink-500/5 hover:bg-pink-500/10 p-2.5 rounded-lg border border-pink-500/20 transition-all font-bold"
                                                                                                        >
                                                                                                            <ExternalLink size={14} className="shrink-0" />
                                                                                                            <span className="truncate">Official Documentation</span>
                                                                                                        </a>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="flex flex-col justify-end">
                                                                                                <button
                                                                                                    onClick={() => navigate(`/test/${username}/${encodeURIComponent(skill.skill)}`)}
                                                                                                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-md shadow-pink-500/10"
                                                                                                >
                                                                                                    <Sparkles size={14} /> Verify via Skill Assessment
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* --- Projects Showcase Section --- */}
                                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                                                                    <Layers size={14} className="text-purple-500" /> Phase Projects
                                                                </h3>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Mini Project Card */}
                                                                    {phase.mini_project && (
                                                                        <div className="relative p-6 rounded-2xl bg-gradient-to-b from-zinc-950 to-zinc-900 border border-white/5 hover:border-purple-500/20 transition-all flex flex-col justify-between">
                                                                            <div>
                                                                                <div className="flex items-center justify-between gap-4 mb-4">
                                                                                    <span className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded-full border border-purple-500/10">
                                                                                        <Award size={12} /> Mini Project
                                                                                    </span>
                                                                                    <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${
                                                                                        phase.mini_project.difficulty === 'Beginner' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 
                                                                                        phase.mini_project.difficulty === 'Intermediate' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' : 
                                                                                        'border-pink-500/20 text-pink-400 bg-pink-500/5'
                                                                                    }`}>
                                                                                        {phase.mini_project.difficulty}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="font-bold text-white text-base tracking-tight mb-2">
                                                                                    {phase.mini_project.title}
                                                                                </h4>
                                                                                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                                                                                    {phase.mini_project.description}
                                                                                </p>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {(phase.mini_project.skills_used || []).map((tech, tIdx) => (
                                                                                    <span key={tIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 font-semibold">
                                                                                        {tech}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Major Project Card */}
                                                                    {phase.major_project && (
                                                                        <div className="relative p-6 rounded-2xl bg-gradient-to-b from-zinc-950 to-zinc-900 border border-white/5 hover:border-pink-500/20 transition-all flex flex-col justify-between">
                                                                            <div>
                                                                                <div className="flex items-center justify-between gap-4 mb-4">
                                                                                    <span className="flex items-center gap-2 text-xs font-bold text-pink-400 bg-pink-500/5 px-2.5 py-1 rounded-full border border-pink-500/10">
                                                                                        <Trophy size={12} /> Capstone Major
                                                                                    </span>
                                                                                    <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${
                                                                                        phase.major_project.difficulty === 'Advanced' ? 'border-pink-500/20 text-pink-400 bg-pink-500/5' : 
                                                                                        phase.major_project.difficulty === 'Intermediate' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' : 
                                                                                        'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                                                                                    }`}>
                                                                                        {phase.major_project.difficulty}
                                                                                    </span>
                                                                                </div>
                                                                                <h4 className="font-bold text-white text-base tracking-tight mb-2">
                                                                                    {phase.major_project.title}
                                                                                </h4>
                                                                                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                                                                                    {phase.major_project.description}
                                                                                </p>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {(phase.major_project.skills_used || []).map((tech, tIdx) => (
                                                                                    <span key={tIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 font-semibold">
                                                                                        {tech}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="mindmap"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="relative flex flex-col items-center"
                        >
                            <div className="w-full h-[600px] border border-zinc-800/50 rounded-[2.5rem] bg-zinc-900/20 backdrop-blur-md relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" /> Dynamic Interactive Graph
                                </div>
                                <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                            </div>

                            <div className="mt-8 flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                                Click blue nodes to toggle <ChevronRight size={12} /> Explore topics <Sparkles size={12} className="text-yellow-500" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const TreeLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] space-y-6">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-20 animate-pulse" />
        </div>
        <div className="text-center">
            <h2 className="text-zinc-100 font-bold tracking-tighter text-xl italic">Generating Your Roadmap</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mt-2">Compiling gap analysis & project guides...</p>
        </div>
    </div>
);



export default Roadmap;